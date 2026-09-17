/**
 * 마이크 입력에 실제로 사람 말소리가 있었는지 재는 모듈(VAD, Voice Activity Detection).
 *
 * 왜 필요한가: 무음 구간을 그대로 음성 인식에 보내면 모델이 빈 문자열이 아니라 그럴듯한 문장을
 * 지어낸다("감사합니다", "시청해주셔서 감사합니다" 같은 것). 그 문장이 손님 발화로 들어가면
 * 아무도 말하지 않았는데 추천 답변과 위험도가 만들어진다. 녹음 파일 크기(MIN_CHUNK_BYTES)만으로는
 * 거르지 못한다 — 에어컨·냉장고 소음만으로도 파일은 충분히 커진다.
 *
 * 그래서 보내기 전에 "이 10초 동안 소음 바닥보다 뚜렷하게 큰 소리가 몇 ms나 있었는지"를 재고,
 * 기준에 못 미치면 인식 요청 자체를 하지 않는다.
 *
 * 임계값은 절대값으로 고정하지 않는다. 매장마다 배경 소음이 달라서, 세션 시작 직후 잠깐을
 * "이 매장의 조용한 상태"로 잡고 거기에 여유(MARGIN_DB)를 더해 기준을 만든다.
 */

/** 레벨을 재는 주기. 20ms면 사람 말의 짧은 끊김도 놓치지 않으면서 부담이 없다. */
const FRAME_MS = 20;
/** 시작 직후 이만큼을 소음 바닥 측정에 쓴다. 이 구간에도 말이 들어오면 아래 갱신 규칙이 보정한다. */
const CALIBRATION_MS = 1500;
/** 소음 바닥보다 이만큼(dB) 커야 "말소리"로 친다. */
const MARGIN_DB = 8;
/** 아무리 조용한 방이어도 이보다 작은 소리는 말소리로 치지 않는다(바닥이 너무 낮게 잡힌 경우 방어). */
const ABSOLUTE_FLOOR_DB = -55;
/** 소음 바닥이 이보다 높게 잡히면 측정 중 큰 소리가 섞인 것으로 보고 이 값으로 제한한다. */
const MAX_NOISE_FLOOR_DB = -30;
/** 한 청크에서 말소리로 친 시간이 이보다 짧으면 음성 인식에 보내지 않는다. */
export const MIN_VOICED_MS = 400;
/** 말소리가 이보다 짧으면 인식 결과를 "불확실"로 표시한다(보내기는 한다). */
export const UNCERTAIN_VOICED_MS = 900;

export interface VoiceWindowResult {
  /** 이 구간에서 말소리로 판정된 누적 시간(ms) */
  voicedMs: number;
  /** 이 구간의 최대 레벨(dBFS) */
  peakDb: number;
  /** 이 구간에 적용된 판정 기준(dBFS) */
  thresholdDb: number;
}

export interface VoiceActivityMonitor {
  /** 미터 표시용 최근 레벨. 0(무음)~1(아주 큼) */
  level: () => number;
  /** 지금 말소리가 들어오고 있는지 */
  isVoiced: () => boolean;
  /** 청크 녹음 시작 시점에 호출 — 누적 카운터를 0으로 되돌린다. */
  beginWindow: () => void;
  /** 청크 녹음이 끝난 시점에 호출 — 그 사이 측정 결과를 돌려준다. */
  endWindow: () => VoiceWindowResult;
  /**
   * 이번 window에서 지금까지 말소리로 친 누적 시간(ms). endWindow 전에도 읽을 수 있다.
   * 녹음 도중 "말이 시작되긴 했는지"를 판단하는 데 쓴다.
   */
  voicedMsSoFar: () => number;
  /**
   * 마지막으로 말소리가 감지된 뒤 흐른 시간(ms). 말하는 중이면 0.
   * 아직 이번 window에서 한 번도 말소리가 없었으면 Infinity.
   * "손님이 말을 마쳤다"를 판정하는 기준이다.
   */
  trailingSilenceMs: () => number;
  close: () => void;
}

function toDb(rms: number): number {
  if (rms <= 1e-7) return -100;
  return 20 * Math.log10(rms);
}

/** dBFS를 미터용 0~1로 편다. -55dB 이하는 0, -15dB 이상은 1. */
function toMeterLevel(db: number): number {
  const normalized = (db - ABSOLUTE_FLOOR_DB) / (-15 - ABSOLUTE_FLOOR_DB);
  return Math.min(1, Math.max(0, normalized));
}

function median(values: number[]): number {
  if (values.length === 0) return ABSOLUTE_FLOOR_DB;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * 녹음에 쓰는 것과 같은 MediaStream에 분석 노드만 덧붙인다. 스트림 자체는 건드리지 않으므로
 * MediaRecorder와 동시에 써도 서로 영향이 없다. 스트림의 트랙 종료는 호출한 쪽 책임이다.
 */
export function createVoiceActivityMonitor(stream: MediaStream): VoiceActivityMonitor {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  // AudioContext를 못 쓰는 환경(아주 오래된 브라우저)에서는 판정을 포기하고 전부 통과시킨다.
  // 인식이 지저분해질 수는 있어도, 소리를 아예 못 듣는 것보다는 낫다.
  if (!AudioContextCtor) {
    return {
      level: () => 0,
      isVoiced: () => true,
      beginWindow: () => {},
      endWindow: () => ({ voicedMs: Infinity, peakDb: 0, thresholdDb: ABSOLUTE_FLOOR_DB }),
      // 말 끝을 잴 수단이 없으므로 "계속 말하는 중"으로 본다 — 그러면 녹음 루프가
      // 발화 끝 감지로 끊지 못하고 최대 길이까지 채우게 되어, 예전의 고정 청크와 같이 동작한다.
      voicedMsSoFar: () => Infinity,
      trailingSilenceMs: () => 0,
      close: () => {},
    };
  }

  const context = new AudioContextCtor();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  // 순간적인 소리를 그대로 보려고 스무딩을 끈다(기본값 0.8이면 짧은 말이 뭉개진다).
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);
  // 스피커로는 내보내지 않는다 — 연결하면 상담 중 하울링이 난다.

  const buffer = new Float32Array(analyser.fftSize);
  const calibrationSamples: number[] = [];
  let noiseFloorDb = ABSOLUTE_FLOOR_DB;
  let calibrated = false;
  let currentDb = -100;
  let voicedMs = 0;
  let peakDb = -100;
  // 이번 window에서 마지막 말소리 프레임 이후 흐른 시간. 아직 말소리가 없었으면 null.
  // "말을 마쳤는지"는 이 값으로 판정한다 — 캘리브레이션 전에는 재지 않는다.
  let silenceMs: number | null = null;

  const thresholdDb = () => Math.max(noiseFloorDb + MARGIN_DB, ABSOLUTE_FLOOR_DB + MARGIN_DB);

  const tick = () => {
    analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
    const db = toDb(Math.sqrt(sum / buffer.length));
    currentDb = db;

    if (!calibrated) {
      calibrationSamples.push(db);
      if (calibrationSamples.length * FRAME_MS >= CALIBRATION_MS) {
        // 평균이 아니라 중앙값을 쓴다 — 측정 중 문 소리 한 번에 바닥이 통째로 올라가지 않도록.
        noiseFloorDb = Math.min(median(calibrationSamples), MAX_NOISE_FLOOR_DB);
        calibrated = true;
      }
      return;
    }

    // 조용한 프레임으로 바닥을 아주 천천히 따라간다(에어컨이 켜지고 꺼지는 정도의 변화 대응).
    if (db < thresholdDb()) {
      noiseFloorDb = Math.min(noiseFloorDb * 0.995 + db * 0.005, MAX_NOISE_FLOOR_DB);
    }

    if (db > thresholdDb()) {
      voicedMs += FRAME_MS;
      if (db > peakDb) peakDb = db;
      silenceMs = 0;
    } else if (silenceMs !== null) {
      silenceMs += FRAME_MS;
    }
  };

  const timer = window.setInterval(tick, FRAME_MS);

  return {
    level: () => toMeterLevel(currentDb),
    isVoiced: () => calibrated && currentDb > thresholdDb(),
    beginWindow: () => {
      voicedMs = 0;
      peakDb = -100;
      silenceMs = null;
    },
    endWindow: () => ({ voicedMs, peakDb, thresholdDb: thresholdDb() }),
    voicedMsSoFar: () => voicedMs,
    trailingSilenceMs: () => (silenceMs === null ? Infinity : silenceMs),
    close: () => {
      window.clearInterval(timer);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // 이미 끊긴 경우
      }
      void context.close().catch(() => {});
    },
  };
}
