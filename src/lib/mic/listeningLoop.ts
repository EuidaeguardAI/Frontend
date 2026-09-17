/**
 * 상시 듣기 루프. 마이크를 열어 두고 "손님이 한 문장을 말할 때마다" 인식 결과를 올려보낸다.
 *
 * 세션(상담)과 분리돼 있는 것이 핵심이다. 예전에는 이 루프가 화면 컴포넌트 안에서
 * session.id에 묶여 있어서, 상담이 바뀔 때마다 getUserMedia부터 다시 했다. 그러면
 * "다음 고객" 전환 때 마이크가 끊기고 그 사이 말이 통째로 빠진다. 이제 루프는 마이크
 * 수명과 함께 살고, 세션 경계는 onUtterance를 받는 쪽이 정한다.
 *
 * 청크를 자르는 기준도 바뀌었다. 예전에는 10초 고정이라 손님이 말을 마쳐도 시계가
 * 다 돌 때까지 기다렸다(평균 5초 낭비). 지금은 VAD로 말 끝(END_SILENCE_MS 만큼의
 * 무음)을 감지해 그 순간 끊는다. 덤으로, recorder.stop()과 다음 start() 사이의 공백이
 * 항상 무음 구간에 놓이게 되어 예전에 이 틈으로 말이 빠지던 문제도 거의 사라진다.
 */

import { consultationClient } from "@/lib/api/consultationClient";
import { isMeaninglessTranscript, isRepeatOfPrevious } from "@/lib/text/sttGuard";
import {
  MIN_VOICED_MS,
  UNCERTAIN_VOICED_MS,
  createVoiceActivityMonitor,
  type VoiceActivityMonitor,
  type VoiceWindowResult,
} from "@/lib/mic/voiceActivity";

/** 이보다 짧으면 끊지 않는다. 한 단어짜리 파편이 따로 인식되는 것을 막는다. */
const CHUNK_MIN_MS = 1200;
/** 손님이 쉬지 않고 말할 때의 상한. 여기서 끊기면 문장 중간일 수 있다. */
const CHUNK_MAX_MS = 8000;
/** 말소리가 끊긴 뒤 이만큼 조용하면 "문장이 끝났다"로 보고 즉시 인식에 보낸다. */
const END_SILENCE_MS = 700;
/** 녹음을 시작하고 이만큼 지나도록 말소리가 없으면 그 조각은 버리고 다시 시작한다. */
const PRE_SPEECH_TIMEOUT_MS = 2000;
/** 위 조건들을 확인하는 주기. */
const POLL_MS = 50;

/** 무음 구간은 파일이 아주 작게 나온다. 그런 조각은 인식에 보내지 않는다. */
const MIN_CHUNK_BYTES = 2000;
/** 인식 결과가 이보다 짧으면 "잘못 들었을 수 있음"으로 표시한다(분석은 그대로 한다). */
const LOW_CONFIDENCE_TEXT_LENGTH = 6;

/** 음소거 중일 때 다시 확인하기까지 쉬는 시간. */
const MUTED_IDLE_MS = 300;

export interface Utterance {
  text: string;
  lowConfidence: boolean;
}

export interface ListeningLoop {
  /** 마이크와 루프를 완전히 정리한다. 한 번만 호출하면 된다. */
  stop: () => void;
  /** 미터 표시용 최근 입력 레벨. 0~1 */
  level: () => number;
  /** 지금 말소리가 들어오고 있는지 */
  isVoiced: () => boolean;
  /**
   * 중복 필터의 기준이 되는 "직전 인식 결과"를 지운다.
   * 손님이 바뀌면 호출한다 — 새 손님이 우연히 이전 손님과 같은 말을 해도 걸러지지 않도록.
   */
  resetDedupe: () => void;
}

export interface ListeningLoopOptions {
  /** 음소거 여부를 매번 물어본다(스토어 최신 값을 읽기 위해 값이 아니라 함수로 받는다). */
  isMuted: () => boolean;
  /** 손님 발화 한 건이 인식될 때마다 호출된다. */
  onUtterance: (utterance: Utterance) => void;
  /** 마이크를 열지 못했을 때 한 번 호출된다. */
  onError: (message: string) => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

/** 녹음이 끝난 이유. "silence"면 말소리가 없었다는 뜻이라 인식에 보내지 않는다. */
type StopReason = "endpoint" | "max" | "silence" | "aborted";

interface ChunkResult {
  blob: Blob;
  activity: VoiceWindowResult;
  reason: StopReason;
}

/**
 * 말이 끝날 때까지(또는 상한까지) 녹음한다.
 *
 * 예전 recordChunk(stream, 10000, mime)를 대체한다. 다른 점은 멈추는 시점을 시계가
 * 아니라 VAD가 정한다는 것뿐이고, 무음 판정에 쓰던 beginWindow/endWindow 계약은 그대로다.
 */
function recordUntilEndpoint(
  stream: MediaStream,
  mimeType: string,
  vad: VoiceActivityMonitor,
  shouldAbort: () => boolean,
): Promise<ChunkResult> {
  return new Promise<ChunkResult>((resolve, reject) => {
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (error) {
      reject(error);
      return;
    }

    const parts: BlobPart[] = [];
    const startedAt = Date.now();
    let reason: StopReason = "max";
    let timer = 0;

    const finish = (why: StopReason) => {
      if (timer) {
        window.clearInterval(timer);
        timer = 0;
      }
      reason = why;
      if (recorder.state !== "inactive") recorder.stop();
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) parts.push(event.data);
    };
    recorder.onerror = (event) => {
      if (timer) window.clearInterval(timer);
      reject(event);
    };
    recorder.onstop = () => {
      resolve({
        blob: new Blob(parts, { type: recorder.mimeType || "audio/webm" }),
        activity: vad.endWindow(),
        reason,
      });
    };

    vad.beginWindow();
    recorder.start();

    timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;

      if (shouldAbort()) {
        finish("aborted");
        return;
      }
      if (elapsed >= CHUNK_MAX_MS) {
        finish("max");
        return;
      }
      // 시작하고 한참이 지나도록 말소리가 없다 — 이 조각은 버리고 새로 시작한다.
      // (계속 이어 녹음하면 손님이 말을 시작했을 때 앞에 긴 무음이 붙어 인식이 나빠진다)
      if (elapsed >= PRE_SPEECH_TIMEOUT_MS && vad.voicedMsSoFar() < 100) {
        finish("silence");
        return;
      }
      // 말이 있었고, 그 뒤로 충분히 조용해졌다 — 문장이 끝난 것으로 본다.
      if (
        elapsed >= CHUNK_MIN_MS &&
        vad.voicedMsSoFar() >= MIN_VOICED_MS &&
        vad.trailingSilenceMs() >= END_SILENCE_MS
      ) {
        finish("endpoint");
      }
    }, POLL_MS);
  });
}

export async function startListeningLoop(
  options: ListeningLoopOptions,
): Promise<ListeningLoop> {
  let stopped = false;
  let stream: MediaStream | null = null;
  let vad: VoiceActivityMonitor | null = null;
  // 직전 인식 결과. 같은 문장이 계속 반복되는 환각 루프를 걸러내는 데만 쓴다.
  let lastText: string | null = null;

  const cleanup = () => {
    vad?.close();
    vad = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    console.error("[listeningLoop] mic error", error);
    options.onError("마이크에 접근할 수 없습니다. 아래에 직접 입력해 진행해 주세요.");
    return {
      stop: () => {},
      level: () => 0,
      isVoiced: () => false,
      resetDedupe: () => {},
    };
  }

  // getUserMedia를 기다리는 사이 이미 stop()이 불렸다면(화면을 바로 벗어난 경우)
  // 루프를 시작하지 않고 방금 연 마이크를 그대로 반납한다.
  if (stopped) {
    cleanup();
    return {
      stop: () => {},
      level: () => 0,
      isVoiced: () => false,
      resetDedupe: () => {},
    };
  }

  // 녹음과 같은 스트림에 분석 노드만 붙여 실제 말소리 여부를 잰다.
  vad = createVoiceActivityMonitor(stream);
  const activeStream = stream;
  const activeVad = vad;
  const mimeType = pickMimeType();

  async function run() {
    while (!stopped) {
      if (options.isMuted()) {
        await new Promise((resolve) => setTimeout(resolve, MUTED_IDLE_MS));
        continue;
      }

      let chunk: ChunkResult;
      try {
        chunk = await recordUntilEndpoint(
          activeStream,
          mimeType,
          activeVad,
          () => stopped || options.isMuted(),
        );
      } catch (error) {
        console.error("[listeningLoop] record failed", error);
        // 레코더가 한 번 실패했다고 루프를 접지는 않는다(탭 전환 등 일시적 원인이 많다).
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      if (stopped) break;

      if (chunk.reason === "silence" || chunk.reason === "aborted") continue;
      if (chunk.blob.size < MIN_CHUNK_BYTES) continue;
      // 무음 게이트 — 이 구간에 소음 바닥보다 뚜렷하게 큰 소리가 거의 없었다면 인식 요청
      // 자체를 하지 않는다. 무음을 보내면 모델이 문장을 지어내고, 그 문장이 손님 발화가 되어
      // 아무도 말하지 않았는데 답변과 위험도가 만들어진다.
      if (chunk.activity.voicedMs < MIN_VOICED_MS) continue;

      let text = "";
      try {
        text = await consultationClient.transcribeChunk(chunk.blob);
      } catch (error) {
        console.error("[listeningLoop] transcribe failed", error);
        continue;
      }
      if (stopped) break;

      const trimmed = text.trim();
      // 백엔드에서 환각 문구로 걸러지면 빈 문자열로 온다.
      if (!trimmed) continue;
      if (isMeaninglessTranscript(trimmed)) continue;
      if (isRepeatOfPrevious(trimmed, lastText)) continue;
      lastText = trimmed;

      options.onUtterance({
        text: trimmed,
        lowConfidence:
          trimmed.length < LOW_CONFIDENCE_TEXT_LENGTH ||
          chunk.activity.voicedMs < UNCERTAIN_VOICED_MS,
      });
    }

    cleanup();
  }

  void run();

  return {
    stop: () => {
      stopped = true;
      // 루프가 STT 응답을 기다리는 중일 수도 있다. 그때까지 마이크를 잡고 있지 않도록
      // 여기서 바로 반납한다(루프 쪽 cleanup과 중복 호출돼도 안전하다).
      cleanup();
    },
    level: () => activeVad.level(),
    isVoiced: () => activeVad.isVoiced(),
    resetDedupe: () => {
      lastText = null;
    },
  };
}
