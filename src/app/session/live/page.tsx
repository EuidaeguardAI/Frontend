"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  Check,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Pencil,
  PhoneOff,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import {
  CitationList,
} from "@/components/session/CitationList";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusPill } from "@/components/ui/StatusPill";
import { consultationClient } from "@/lib/api/consultationClient";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useResponseModeStore } from "@/lib/store/responseModeStore";
import { useTtsSettingsStore, type TtsMode } from "@/lib/store/ttsSettingsStore";
import {
  RISK_LABEL,
  type Recommendation,
  type ResponseMode,
  type RiskLevel,
  type TranscriptSegment,
  type TranscriptSource,
} from "@/lib/types";
import { buildFixedSafetyRecommendation } from "@/lib/safety/emergencyRules";
import { textSimilarity } from "@/lib/text/similarity";
import { isMeaninglessTranscript, isRepeatOfPrevious } from "@/lib/text/sttGuard";
import {
  MIN_VOICED_MS,
  UNCERTAIN_VOICED_MS,
  createVoiceActivityMonitor,
  type VoiceActivityMonitor,
} from "@/lib/mic/voiceActivity";
import { vars } from "@/styles/theme.css";
import {
  actionBar,
  actionButton,
  actionList,
  answerCard,
  answerEmpty,
  answerMarker,
  answerMarkerActive,
  answerPane,
  backToLatest,
  bubbleBody,
  bubbleRow,
  bubbleText,
  bubbleTextLow,
  deleteButton,
  deleteRow,
  detailBody,
  detailLabel,
  detailToggle,
  compactEvidence,
  compactEvidenceTitle,
  disclaimer,
  doNotList,
  echoCheck,
  echoTag,
  editArea,
  meter,
  meterBar,
  noEvidence,
  paneDivider,
  paneHandle,
  paneHandleLabel,
  glanceActions,
  glanceCard,
  glanceCardTitle,
  glanceStep,
  glanceSteps,
  inlineActionButton,
  scriptBlock,
  scriptLabel,
  quickReplyLabel,
  quickReplyRow,
  recommendationText,
  responseModeBar,
  responseModeButton,
  responseModeHint,
  responseModeLabel,
  responseModeSegments,
  sourceTag,
  speakerIcon,
  statusBar,
  ttsMenu,
  ttsMenuBody,
  ttsMenuRow,
  ttsMenuSummary,
  ttsUnsupported,
  topRow,
  transcriptEmpty,
  transcriptPane,
  twoColActionBar,
} from "./page.css";
import { manualBar, manualInput, manualRow, manualSendButton } from "./manual.css";

const RISK_TONE: Record<RiskLevel, "primary" | "warning" | "danger"> = {
  normal: "primary",
  dispute: "primary",
  abuse: "warning",
  threat: "warning",
  emergency: "danger",
};

// 한 번에 녹음해서 STT로 보내는 길이. 짧으면 문장이 중간에서 잘려
// "환불 안 해주면" / "죽여버린다"처럼 나뉘어 위험 신호를 놓친다.
const CHUNK_MS = 10000;
// 10초 내내 무음이면 파일이 아주 작게 나온다. 그런 조각은 인식에 보내지 않는다.
const MIN_CHUNK_BYTES = 2000;

// 새로 인식된 발화가 직전 "추천 답변"을 직원이 그대로 읽은 것인지 판단하는 유사도 기준.
// 마이크가 직원 목소리도 같이 주워서 "손님 말"로 오인되는 걸 막기 위한 것이라 다소 느슨하게 잡는다.
const ECHO_SIMILARITY_THRESHOLD = 0.6;
// 새로 생성된 답변이 직전 답변과 사실상 같은 형태인지 판단하는 유사도 기준.
// 에코 판단보다는 보수적으로 — 진짜 손님 발화에 대한 답인데 우연히 비슷한 경우까지 지우지 않도록.
const DUPLICATE_SIMILARITY_THRESHOLD = 0.75;
// 인식 결과가 이보다 짧으면 "잘못 들었을 수 있음"으로 표시한다(분석은 그대로 한다).
const LOW_CONFIDENCE_TEXT_LENGTH = 6;

const subscribeToTtsSupport = () => () => undefined;
const getTtsSupportSnapshot = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window;

type PaneSize = "sm" | "md" | "lg";
const PANE_SIZE_ORDER: PaneSize[] = ["sm", "md", "lg"];
const PANE_SIZE_LABEL: Record<PaneSize, string> = {
  sm: "대화 작게",
  md: "대화 보통",
  lg: "대화 크게",
};

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function recordChunk(stream: MediaStream, durationMs: number, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (error) {
      reject(error);
      return;
    }
    const parts: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) parts.push(event.data);
    };
    recorder.onerror = (event) => reject(event);
    recorder.onstop = () => resolve(new Blob(parts, { type: recorder.mimeType || "audio/webm" }));
    recorder.start();
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, durationMs);
  });
}

export default function SessionLivePage() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const muted = useSessionStore((state) => state.muted);
  const appendTranscript = useSessionStore((state) => state.appendTranscript);
  const removeTurn = useSessionStore((state) => state.removeTurn);
  const addRecommendation = useSessionStore((state) => state.addRecommendation);
  const addAction = useSessionStore((state) => state.addAction);
  const toggleMute = useSessionStore((state) => state.toggleMute);
  const completeSession = useSessionStore((state) => state.complete);
  const addHistorySession = useHistoryStore((state) => state.addSession);
  const responseMode = useResponseModeStore((state) => state.responseMode);
  const setResponseMode = useResponseModeStore((state) => state.setResponseMode);
  const ttsEnabled = useTtsSettingsStore((state) => state.ttsEnabled);
  const ttsMode = useTtsSettingsStore((state) => state.ttsMode);
  const ttsAutoPlay = useTtsSettingsStore((state) => state.ttsAutoPlay);
  const setTtsEnabled = useTtsSettingsStore((state) => state.setTtsEnabled);
  const setTtsMode = useTtsSettingsStore((state) => state.setTtsMode);
  const setTtsAutoPlay = useTtsSettingsStore((state) => state.setTtsAutoPlay);

  // 아래 세 가지는 "어느 답변에 대한 상태인지"를 함께 들고 있는다. 새 답변이 오면
  // 그 id가 더 이상 맞지 않게 되어 자동으로 초기 상태로 돌아간다(effect에서 초기화하지 않는다).
  const [detailsOpenFor, setDetailsOpenFor] = useState<string | null>(null);
  const [scriptOpenFor, setScriptOpenFor] = useState<string | null>(null);
  const [editingFor, setEditingFor] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [warningSent, setWarningSent] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [paneSize, setPaneSize] = useState<PaneSize>("md");
  // 대화 창에서 지난 답변 마커를 눌러 아래 패널에 띄워 둔 답변. null이면 항상 최신 답변을 보여준다.
  // 띄울 당시의 최신 답변 id를 같이 들고 있어서, 새 답변이 도착하면 이 고정이 저절로 풀린다 —
  // 상담 중에는 최신 답변이 보여야 한다.
  const [pinned, setPinned] = useState<{ id: string; latestIdWhenPinned: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // 지금 말소리가 들어오고 있는지(상태 문구용). 레벨 미터는 리렌더 없이 따로 그린다.
  const [hearing, setHearing] = useState(false);
  const ttsSupported = useSyncExternalStore(
    subscribeToTtsSupport,
    getTtsSupportSnapshot,
    () => false,
  );

  const transcriptRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const vadRef = useRef<VoiceActivityMonitor | null>(null);
  const manualInputRef = useRef<HTMLTextAreaElement>(null);
  // 직전 인식 결과. 같은 문장이 계속 반복되는 환각 루프를 걸러내는 데만 쓴다.
  const lastSttTextRef = useRef<string | null>(null);
  // 분석 요청 순번. 분석을 더 이상 기다리지 않고 녹음을 이어가므로 두 분석이 겹칠 수 있는데,
  // 그때 늦게 끝난 옛 요청이 최신 답변을 덮어쓰지 않도록 순번으로 막는다.
  const analysisSeqRef = useRef(0);
  // 설정 변경이나 리렌더가 같은 추천을 다시 읽게 하지 않도록, 도착 자체를 한 번만 관찰한다.
  const lastObservedTtsRecommendationRef = useRef<string | null>(null);

  const runAnalysis = async (latestText: string) => {
    const current = useSessionStore.getState().session;
    if (!current) return;
    const seq = analysisSeqRef.current + 1;
    analysisSeqRef.current = seq;
    setAnalyzing(true);
    try {
      const recommendation = await consultationClient.analyze({
        profile: current.profile,
        intake: current.intake,
        recentTranscript: current.transcript
          .slice(-8)
          .map((segment) => ({ speaker: segment.speaker, text: segment.text })),
        recentSituations: current.recommendations
          .slice(-4)
          .map((recommendation) => recommendation.situation),
        latestText,
        // 녹음 effect의 오래된 클로저가 아니라 요청 직전 persist store의 최신값을 읽는다.
        responseMode: useResponseModeStore.getState().responseMode,
      });
      // 이 요청이 도는 사이 더 최신 발화에 대한 분석이 시작됐다면 이 결과는 버린다.
      if (seq !== analysisSeqRef.current) return;
      // 손님 발화는 새로 들어왔지만 결과 답변이 직전 답변과 사실상 같은 형태라면
      // 카드를 또 쌓지 않는다 — 상담원 입장에서는 같은 답변이 반복 노출될 뿐이다.
      const store = useSessionStore.getState().session;
      const prevRecommendation = store?.recommendations[store.recommendations.length - 1];
      const isDuplicate =
        prevRecommendation != null &&
        (prevRecommendation.responseMode ?? "full") === recommendation.responseMode &&
        prevRecommendation.situation === recommendation.situation &&
        textSimilarity(prevRecommendation.sayNow, recommendation.sayNow) >=
          DUPLICATE_SIMILARITY_THRESHOLD;
      if (!isDuplicate) {
        // 백엔드는 createdAtMs를 절대 시각(epoch ms)으로 채워 보내지만, 화면과 이력은
        // "상담 시작 후 몇 초"라는 상대 시각을 쓴다(transcript.timestampMs와 같은 축).
        // 그대로 두면 추천이 항상 모든 발화보다 뒤로 정렬돼 손님 말과 짝이 지어지지 않고,
        // 이력 화면의 경과 시간도 엉뚱하게 찍힌다.
        addRecommendation({
          ...recommendation,
          createdAtMs: Date.now() - current.startedAtMs,
        });
        if (recommendation.isFixedSafetyScript) stoppedRef.current = true;
      }
    } catch (error) {
      console.error("[session/live] analyze failed", error);
    } finally {
      if (seq === analysisSeqRef.current) setAnalyzing(false);
    }
  };

  // STT/수동 입력/예상 답변 칩 — 손님 발화로 취급될 모든 입력이 거치는 공통 경로.
  // 직전 "추천 답변"을 직원이 그대로 읽은 것처럼 들리면(echo) 새 분석 없이 기록만 남긴다.
  const submitCustomerUtterance = async (
    text: string,
    source: TranscriptSource,
    options?: { lowConfidence?: boolean },
  ) => {
    const current = useSessionStore.getState().session;
    if (!current) return;
    const latestRecommendation = current.recommendations[current.recommendations.length - 1];
    const isEcho =
      latestRecommendation != null &&
      textSimilarity(text, latestRecommendation.sayNow) >= ECHO_SIMILARITY_THRESHOLD;

    const segment: TranscriptSegment = {
      id: `segment-${Date.now()}`,
      source,
      speaker: isEcho ? "staff" : "customer",
      text,
      lowConfidence: options?.lowConfidence,
      timestampMs: Date.now() - current.startedAtMs,
    };
    appendTranscript(segment);
    if (isEcho) return;
    await runAnalysis(text);
  };

  // 긴급 버튼으로 진입한 경우: 설문·녹음 없이 고정 안전 절차를 즉시 표시한다.
  // 스토어의 최신 상태를 직접 읽어 판단한다 — 개발 모드 StrictMode의 effect 이중 호출에도
  // 같은 클로저가 재실행되므로, session 프롭(그 시점에 캡처된 값)만 보면 두 번 다 length===0으로
  // 보여 추천이 중복 추가될 수 있다.
  useEffect(() => {
    if (!session) return;
    const current = useSessionStore.getState().session;
    if (
      session.intake.emergencyDeclared &&
      current &&
      current.recommendations.length === 0
    ) {
      addRecommendation({
        ...buildFixedSafetyRecommendation(
          "",
          useResponseModeStore.getState().responseMode,
        ),
        id: `rec-${Date.now()}`,
        createdAtMs: Date.now() - session.startedAtMs,
      });
      stoppedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // 실시간 녹음 → (무음 판정) → STT → 분석 루프
  useEffect(() => {
    if (!session) {
      router.replace("/session/intake");
      return;
    }
    if (!session.intake.micAvailable || session.intake.emergencyDeclared) return;

    let cancelled = false;
    // 개발 모드 StrictMode는 effect를 mount→cleanup→mount로 한 번 더 실행해 본다.
    // 첫 cleanup이 stoppedRef를 true로 남겨두면 두 번째 setup의 루프가 시작도 못 하고
    // 끝나버리므로, 새로 시작할 때마다 반드시 false로 되돌린다.
    stoppedRef.current = false;

    async function run() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        // 녹음과 같은 스트림에 분석 노드만 붙여 실제 말소리 여부를 잰다.
        vadRef.current = createVoiceActivityMonitor(stream);
        const mimeType = pickMimeType();

        while (!stoppedRef.current && !cancelled) {
          if (useSessionStore.getState().muted) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }

          vadRef.current?.beginWindow();
          const blob = await recordChunk(stream, CHUNK_MS, mimeType);
          const activity = vadRef.current?.endWindow();
          if (stoppedRef.current || cancelled) break;
          if (blob.size < MIN_CHUNK_BYTES) continue;

          // 무음 게이트 — 이 10초 동안 소음 바닥보다 뚜렷하게 큰 소리가 거의 없었다면
          // 인식 요청 자체를 하지 않는다. 무음을 보내면 모델이 문장을 지어내고, 그 문장이
          // 손님 발화가 되어 아무도 말하지 않았는데 답변과 위험도가 만들어진다.
          if (activity && activity.voicedMs < MIN_VOICED_MS) continue;

          let text = "";
          try {
            text = await consultationClient.transcribeChunk(blob);
          } catch (error) {
            console.error("[session/live] transcribe failed", error);
            continue;
          }
          if (stoppedRef.current || cancelled) continue;

          const trimmed = text.trim();
          // 백엔드에서 환각 문구로 걸러지면 빈 문자열로 온다.
          if (!trimmed) continue;
          if (isMeaninglessTranscript(trimmed)) continue;
          if (isRepeatOfPrevious(trimmed, lastSttTextRef.current)) continue;
          lastSttTextRef.current = trimmed;

          const lowConfidence =
            trimmed.length < LOW_CONFIDENCE_TEXT_LENGTH ||
            (activity != null && activity.voicedMs < UNCERTAIN_VOICED_MS);

          // 분석을 기다리지 않는다. 기다리면 그 3~5초 동안 녹음이 멈춰 손님 말이 통째로 빠진다.
          void submitCustomerUtterance(trimmed, "stt_raw", { lowConfidence });
        }
      } catch (error) {
        console.error("[session/live] mic error", error);
        if (!cancelled) {
          setMicError("마이크에 접근할 수 없습니다. 아래에 직접 입력해 진행해 주세요.");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      stoppedRef.current = true;
      vadRef.current?.close();
      vadRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // 상태 문구("말소리 감지" / "조용함")용. 값이 바뀔 때만 리렌더된다.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setHearing(vadRef.current?.isVoiced() ?? false);
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const recommendations = useMemo(() => session?.recommendations ?? [], [session]);
  const latest = recommendations[recommendations.length - 1];

  const speak = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "ko-KR";
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 자동 재생은 새 추천이 도착한 순간 한 번만 실행한다. 고정 안전 절차는 항상 수동 재생만 허용한다.
  useEffect(() => {
    if (!latest || lastObservedTtsRecommendationRef.current === latest.id) return;
    lastObservedTtsRecommendationRef.current = latest.id;
    const suppressAutoPlay =
      latest.isFixedSafetyScript ||
      latest.situation === "threat" ||
      latest.situation === "emergency";
    if (suppressAutoPlay) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    if (!ttsSupported || !ttsEnabled || !ttsAutoPlay) return;
    speak(ttsMode === "coach" ? latest.ttsText?.trim() || latest.sayNow : latest.sayNow);
  }, [latest, speak, ttsAutoPlay, ttsEnabled, ttsMode, ttsSupported]);

  // 보고 있는 답변이 바뀌면 답변 패널은 맨 위부터 보여준다.
  useEffect(() => {
    answerRef.current?.scrollTo({ top: 0 });
  }, [latest?.id]);

  // 대화 패널은 항상 마지막 발화가 보이게 둔다(답변 패널은 이 스크롤과 무관하다).
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.transcript.length, session?.recommendations.length]);

  const isThreatAlert = latest?.situation === "threat" && !latest.isFixedSafetyScript;
  const isFixedSafety = Boolean(latest?.isFixedSafetyScript);
  const showManualInput = !session?.intake.micAvailable || Boolean(micError);

  // 자막과 추천 답변을 "손님 말 → 답변"이 짝지어진 턴 단위로 묶는다.
  // 직원이 답변을 그대로 읽어 다시 인식된 구간(speaker: "staff")은 새 턴을 만들지 않고
  // 직전 턴에 "읽음 확인" 표시만 남긴다.
  const feed = useMemo(() => {
    if (!session) return [];

    type FeedTurn = {
      id: string;
      customerSegments: TranscriptSegment[];
      recommendation?: Recommendation;
      echoConfirmed: boolean;
    };

    type ChronoItem =
      | { kind: "transcript"; ts: number; segment: TranscriptSegment }
      | { kind: "recommendation"; ts: number; recommendation: Recommendation };

    const items: ChronoItem[] = [
      ...session.transcript.map(
        (segment): ChronoItem => ({ kind: "transcript", ts: segment.timestampMs, segment }),
      ),
      ...session.recommendations.map(
        (recommendation): ChronoItem => ({
          kind: "recommendation",
          ts: recommendation.createdAtMs,
          recommendation,
        }),
      ),
    ].sort((a, b) => a.ts - b.ts);

    const turns: FeedTurn[] = [];
    let current: FeedTurn | null = null;
    const closeCurrent = () => {
      if (current) turns.push(current);
      current = null;
    };

    for (const item of items) {
      if (item.kind === "transcript" && item.segment.speaker === "staff") {
        if (current) current.echoConfirmed = true;
        continue;
      }
      if (item.kind === "transcript") {
        if (current && !current.recommendation) {
          current.customerSegments.push(item.segment);
          continue;
        }
        closeCurrent();
        current = {
          id: item.segment.id,
          customerSegments: [item.segment],
          echoConfirmed: false,
        };
        continue;
      }
      if (current && !current.recommendation) {
        current.recommendation = item.recommendation;
        continue;
      }
      closeCurrent();
      current = {
        id: item.recommendation.id,
        customerSegments: [],
        recommendation: item.recommendation,
        echoConfirmed: false,
      };
    }
    closeCurrent();

    return turns;
  }, [session]);

  const echoByRecommendationId = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const turn of feed) {
      if (turn.recommendation) map.set(turn.recommendation.id, turn.echoConfirmed);
    }
    return map;
  }, [feed]);

  // 고정해 둔 답변은 그 뒤로 새 답변이 오지 않았을 때만 유효하다.
  const pinnedRecommendation =
    pinned && pinned.latestIdWhenPinned === latest?.id
      ? recommendations.find((recommendation) => recommendation.id === pinned.id)
      : undefined;
  const shown = pinnedRecommendation ?? latest;
  const isShowingLatest = shown != null && shown.id === latest?.id;
  const editing = editingFor != null && editingFor === latest?.id;
  const detailsOpen = detailsOpenFor != null && detailsOpenFor === shown?.id;

  const handleEditToggle = () => {
    if (!latest) return;
    if (editing) {
      setEditingFor(null);
      return;
    }
    // 수정은 항상 최신 답변에 대해서만 — 지난 답변을 보고 있었다면 최신으로 되돌린다.
    setPinned(null);
    setEditText(latest.sayNow);
    setEditingFor(latest.id);
  };

  const handleCustomerSpeakClick = () => {
    if (!shown) return;
    speak(editing && isShowingLatest ? editText : shown.sayNow);
    addAction("고객에게 읽기");
  };

  const handleCoachSpeakClick = () => {
    if (!shown) return;
    speak(shown.ttsText?.trim() || shown.sayNow);
    addAction("직원 안내 듣기");
  };

  const handleMuteClick = () => {
    toggleMute();
    addAction(muted ? "음소거 해제" : "음소거");
  };

  const handleEnd = () => {
    stoppedRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const completed = completeSession();
    if (completed) addHistorySession(completed);
    router.push("/session/complete");
  };

  const handleContinue = () => {
    addAction("상담 계속");
  };

  const handleSendWarning = () => {
    addAction("경고 전송");
    setWarningSent(true);
  };

  const handleReport = () => {
    router.push("/session/report");
  };

  const cyclePaneSize = () => {
    setPaneSize((size) => PANE_SIZE_ORDER[(PANE_SIZE_ORDER.indexOf(size) + 1) % 3]);
  };

  // 잘못 인식된 발화를 지운다. 그 발화를 근거로 만들어진 답변도 같이 지워야
  // 화면에 "아무도 하지 않은 말에 대한 답변"이 남지 않는다.
  const handleDeleteSegment = (segmentId: string, recommendationId?: string) => {
    removeTurn([segmentId], recommendationId);
    setConfirmDeleteId(null);
    if (recommendationId && pinned?.id === recommendationId) setPinned(null);
  };

  const autoResizeManualInput = () => {
    const el = manualInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleManualSubmit = async () => {
    const text = manualText.trim();
    if (!text) return;
    setManualText("");
    if (manualInputRef.current) manualInputRef.current.style.height = "auto";
    await submitCustomerUtterance(text, "user_input");
  };

  // AI가 제시한 "예상 답변" 칩을 눌렀을 때: 직접 타이핑/녹음하지 않고도 그 문장을 손님 발화로
  // 바로 넣어 다음 분석까지 이어간다(수동 입력창에 채운 뒤 전송하는 것과 동일한 동작).
  const handleQuickReply = async (text: string) => {
    if (analyzing) return;
    await submitCustomerUtterance(text, "user_input");
  };

  const getLevel = useCallback(() => vadRef.current?.level() ?? 0, []);

  const riskTone = shown ? RISK_TONE[shown.situation] : "primary";

  const statusText = useMemo(() => {
    if (muted) return "음소거됨";
    if (analyzing) return "분석 중...";
    if (showManualInput) return "직접 입력 모드";
    return hearing ? "말소리 감지" : "조용함 · 듣는 중";
  }, [muted, analyzing, showManualInput, hearing]);

  if (!session) return null;

  return (
    <MobileFrame
      variant="fixed"
      footer={
        <>
          {showManualInput && !isFixedSafety && (
            <div className={manualBar}>
              <div className={manualRow}>
                <textarea
                  ref={manualInputRef}
                  className={manualInput}
                  placeholder="고객이 한 말을 입력하세요"
                  value={manualText}
                  rows={1}
                  onChange={(event) => {
                    setManualText(event.target.value);
                    autoResizeManualInput();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      void handleManualSubmit();
                    }
                  }}
                />
                <button
                  type="button"
                  className={manualSendButton}
                  onClick={() => void handleManualSubmit()}
                  aria-label="전송"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
          {isThreatAlert ? (
            <div className={twoColActionBar}>
              <button type="button" className={actionButton} onClick={handleContinue}>
                상담 계속
              </button>
              <button
                type="button"
                className={actionButton}
                onClick={handleSendWarning}
                style={{ color: vars.color.danger, borderColor: vars.color.danger }}
              >
                {warningSent ? "경고 전송됨" : "경고 전송"}
              </button>
            </div>
          ) : isFixedSafety ? (
            <div className={twoColActionBar}>
              <button
                type="button"
                className={actionButton}
                onClick={handleReport}
                style={{ color: vars.color.danger, borderColor: vars.color.danger }}
              >
                <ShieldAlert size={18} />
                신고하기
              </button>
              <button type="button" className={actionButton} onClick={handleEnd}>
                <PhoneOff size={18} />
                상담 종료
              </button>
            </div>
          ) : (
            <div className={actionBar}>
              <button type="button" className={actionButton} onClick={handleEditToggle}>
                <Pencil size={18} />
                수정
              </button>
              <button type="button" className={actionButton} onClick={handleMuteClick}>
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
                음소거
              </button>
              <button
                type="button"
                className={actionButton}
                onClick={handleEnd}
                style={{ color: vars.color.danger, borderColor: vars.color.danger }}
              >
                <PhoneOff size={18} />
                상담 종료
              </button>
            </div>
          )}
        </>
      }
    >
      <div className={statusBar}>
        <StatusPill>{statusText}</StatusPill>
        {!showManualInput && <LevelMeter getLevel={getLevel} muted={muted} />}
        <details className={ttsMenu}>
          <summary className={ttsMenuSummary} title="음성 안내 설정">
            <Settings2 size={14} />
            TTS · {ttsMode === "coach" ? "직원" : "고객"}
          </summary>
          <div className={ttsMenuBody}>
            <label className={ttsMenuRow}>
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(event) => setTtsEnabled(event.target.checked)}
              />
              TTS 사용
            </label>
            <label className={ttsMenuRow}>
              자동 재생 모드
              <select
                value={ttsMode}
                onChange={(event) => setTtsMode(event.target.value as TtsMode)}
              >
                <option value="coach">직원 안내</option>
                <option value="customer">고객 응대</option>
              </select>
            </label>
            <label className={ttsMenuRow}>
              <input
                type="checkbox"
                checked={ttsAutoPlay}
                disabled={!ttsEnabled}
                onChange={(event) => setTtsAutoPlay(event.target.checked)}
              />
              새 추천 자동 재생
            </label>
            {!ttsSupported && <span className={ttsUnsupported}>이 브라우저는 TTS를 지원하지 않습니다.</span>}
          </div>
        </details>
        {shown && (
          <Badge tone={riskTone}>
            위험도 {shown.riskLevel} · {RISK_LABEL[shown.situation]}
          </Badge>
        )}
      </div>

      <ResponseModeSelector
        value={responseMode}
        onChange={setResponseMode}
      />

      {micError && (
        <Card tone="warning">
          <p className={sourceTag}>{micError}</p>
        </Card>
      )}

      <div className={transcriptPane[paneSize]} ref={transcriptRef}>
        {feed.length === 0 ? (
          <p className={transcriptEmpty}>
            손님 말이 인식되면 여기에 표시됩니다.
            <br />
            조용할 때는 아무것도 기록하지 않습니다.
          </p>
        ) : (
          feed.map((turn) => (
            <Fragment key={turn.id}>
              {turn.customerSegments.map((segment) => (
                <div key={segment.id} className={bubbleRow}>
                  <span className={speakerIcon}>
                    <User size={14} />
                  </span>
                  <div className={bubbleBody}>
                    <p
                      className={segment.lowConfidence ? bubbleTextLow : bubbleText}
                      onClick={
                        segment.lowConfidence
                          ? () =>
                              setConfirmDeleteId((id) => (id === segment.id ? null : segment.id))
                          : undefined
                      }
                    >
                      {segment.text}
                    </p>
                    <p className={sourceTag}>
                      {segment.source === "stt_raw" && "실시간 인식"}
                      {segment.source === "ai_corrected" && "AI 분석"}
                      {segment.source === "user_input" && "직접 입력"}
                      {segment.lowConfidence && " · 잘못 들었을 수 있음"}
                    </p>
                    {confirmDeleteId === segment.id && (
                      <div className={deleteRow}>
                        <button
                          type="button"
                          className={deleteButton}
                          onClick={() =>
                            handleDeleteSegment(segment.id, turn.recommendation?.id)
                          }
                        >
                          <Trash2 size={12} />
                          이 말과 답변 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {turn.recommendation && (
                <button
                  type="button"
                  className={`${answerMarker} ${
                    shown?.id === turn.recommendation.id ? answerMarkerActive : ""
                  }`}
                  onClick={() =>
                    setPinned(
                      !latest || turn.recommendation!.id === latest.id
                        ? null
                        : { id: turn.recommendation!.id, latestIdWhenPinned: latest.id },
                    )
                  }
                >
                  <Sparkles size={12} />
                  답변 제안됨
                  {turn.echoConfirmed && (
                    <span className={echoTag}>
                      <Check size={12} />
                      답변함
                    </span>
                  )}
                </button>
              )}
            </Fragment>
          ))
        )}
      </div>

      <button
        type="button"
        className={paneDivider}
        onClick={cyclePaneSize}
        aria-label={`대화 창 크기 바꾸기 (현재 ${PANE_SIZE_LABEL[paneSize]})`}
      >
        <span className={paneHandle} />
        <span className={paneHandleLabel}>{PANE_SIZE_LABEL[paneSize]}</span>
      </button>

      <div className={answerPane} ref={answerRef}>
        {shown ? (
          <>
            {!isShowingLatest && (
              <button
                type="button"
                className={backToLatest}
                onClick={() => setPinned(null)}
              >
                <ArrowDown size={12} />
                최신 답변으로
              </button>
            )}
            <AnswerCard
              recommendation={shown}
              isLatest={isShowingLatest}
              echoConfirmed={echoByRecommendationId.get(shown.id) ?? false}
              editing={editing && isShowingLatest}
              editText={editText}
              onEditTextChange={setEditText}
              detailsOpen={detailsOpen}
              scriptOpen={editing || scriptOpenFor === shown.id}
              onToggleScript={() =>
                setScriptOpenFor((id) => (id === shown.id ? null : shown.id))
              }
              onToggleDetails={() =>
                setDetailsOpenFor((id) => (id === shown.id ? null : shown.id))
              }
              onQuickReply={handleQuickReply}
              quickReplyDisabled={analyzing}
              ttsSupported={ttsSupported}
              onListenCoach={handleCoachSpeakClick}
              onReadCustomer={handleCustomerSpeakClick}
            />
          </>
        ) : (
          <p className={answerEmpty}>
            {analyzing ? "답변을 만들고 있습니다..." : "손님 말이 들어오면 추천 답변이 여기에 뜹니다."}
          </p>
        )}
      </div>
    </MobileFrame>
  );
}

function ResponseModeSelector({
  value,
  onChange,
}: {
  value: ResponseMode;
  onChange: (mode: ResponseMode) => void;
}) {
  return (
    <div className={responseModeBar}>
      <span className={responseModeLabel}>응답 방식</span>
      <div className={responseModeSegments} role="radiogroup" aria-label="응답 방식">
        {([
          ["full", "긴 응대"],
          ["compact", "짧은 안내"],
        ] as const).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={value === mode}
            className={responseModeButton[value === mode ? "active" : "inactive"]}
            onClick={() => onChange(mode)}
          >
            {label}
          </button>
        ))}
      </div>
      <span className={responseModeHint}>다음 추천부터 적용</span>
    </div>
  );
}

/**
 * 마이크 입력 레벨 미터. 값이 초당 수십 번 바뀌므로 React 상태로 두면 화면 전체가 계속
 * 리렌더된다. 그래서 막대의 transform만 직접 건드린다.
 */
function LevelMeter({ getLevel, muted }: { getLevel: () => number; muted: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const container = containerRef.current;
      if (container) {
        const level = muted ? 0 : getLevel();
        const bars = container.children;
        for (let i = 0; i < bars.length; i += 1) {
          // 가운데 막대가 가장 크게 반응하도록 가중치를 준다(파형처럼 보이게).
          const weight = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / bars.length);
          const scale = Math.max(0.1, Math.min(1, level * weight * 1.6));
          (bars[i] as HTMLElement).style.transform = `scaleY(${scale.toFixed(3)})`;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [getLevel, muted]);

  return (
    <div
      className={meter}
      ref={containerRef}
      style={{ opacity: muted ? 0.3 : 1 }}
      aria-hidden
    >
      {Array.from({ length: 16 }).map((_, index) => (
        <span key={index} className={meterBar} />
      ))}
    </div>
  );
}

function AnswerCard({
  recommendation,
  isLatest,
  echoConfirmed,
  editing,
  editText,
  onEditTextChange,
  detailsOpen,
  scriptOpen,
  onToggleScript,
  onToggleDetails,
  onQuickReply,
  quickReplyDisabled,
  ttsSupported,
  onListenCoach,
  onReadCustomer,
}: {
  recommendation: Recommendation;
  isLatest: boolean;
  echoConfirmed: boolean;
  editing: boolean;
  editText: string;
  onEditTextChange: (value: string) => void;
  detailsOpen: boolean;
  scriptOpen: boolean;
  onToggleScript: () => void;
  onToggleDetails: () => void;
  onQuickReply: (text: string) => void;
  quickReplyDisabled: boolean;
  ttsSupported: boolean;
  onListenCoach: () => void;
  onReadCustomer: () => void;
}) {
  const isFixedSafety = recommendation.isFixedSafetyScript;
  const isThreatAlert = recommendation.situation === "threat" && !isFixedSafety;
  const responseMode = recommendation.responseMode ?? "full";
  const isCompact = responseMode === "compact";
  const tone = isFixedSafety ? "danger" : isThreatAlert ? "warning" : "primary";
  const hasDetails =
    recommendation.nextActions.length > 0 || recommendation.doNot.length > 0;
  const glanceItems = (recommendation.glanceSummary?.trim() || recommendation.sayNow)
    .split("→")
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className={answerCard[tone]}>
      <div className={topRow}>
        <SectionTitle>
          {isFixedSafety ? "안전 절차" : isThreatAlert ? "위협성 발언 감지" : "추천 답변"}
        </SectionTitle>
        {!isLatest && <span className={sourceTag}>이전 답변</span>}
      </div>

      {isCompact ? (
        <>
          <section className={glanceCard[tone]} aria-label="지금 할 일">
            <p className={glanceCardTitle}>지금 할 일</p>
            <ol className={glanceSteps}>
              {glanceItems.map((step, index) => (
                <li key={`${index}-${step}`} className={glanceStep}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
          <section className={compactEvidence} aria-label="근거">
            <p className={compactEvidenceTitle}>
              {isFixedSafety ? "안전 절차 근거" : "근거"}
            </p>
            {recommendation.citations.length > 0 ? (
              <CitationList citations={recommendation.citations} collapsibleQuotes />
            ) : (
              <p className={noEvidence}>
                확인된 RAG 근거 없음
                <br />
                일반적인 응대 원칙으로 작성됨 · 상담사 검토 필요
              </p>
            )}
          </section>
          <div className={glanceActions}>
            <button
              type="button"
              className={inlineActionButton}
              onClick={onToggleScript}
              disabled={editing}
            >
              {editing ? "전체 멘트 수정 중" : scriptOpen ? "전체 멘트 닫기" : "전체 멘트 보기"}
            </button>
            <button
              type="button"
              className={inlineActionButton}
              onClick={onListenCoach}
              disabled={!ttsSupported}
              title={ttsSupported ? undefined : "이 브라우저는 음성 읽기를 지원하지 않습니다."}
            >
              <Volume2 size={14} />
              직원 안내 듣기
            </button>
            <button
              type="button"
              className={inlineActionButton}
              onClick={onReadCustomer}
              disabled={!ttsSupported}
              title={ttsSupported ? undefined : "이 브라우저는 음성 읽기를 지원하지 않습니다."}
            >
              <Volume2 size={14} />
              고객에게 읽기
            </button>
          </div>
        </>
      ) : (
        <div className={scriptBlock}>
          <p className={scriptLabel}>{isFixedSafety ? "안전 응대 멘트" : "고객 응대 멘트"}</p>
          {editing ? (
            <textarea
              className={editArea}
              value={editText}
              onChange={(event) => onEditTextChange(event.target.value)}
            />
          ) : (
            <p className={recommendationText}>{recommendation.sayNow}</p>
          )}
          <div className={glanceActions}>
            <button
              type="button"
              className={inlineActionButton}
              onClick={onListenCoach}
              disabled={!ttsSupported}
            >
              <Volume2 size={14} />
              직원 안내 듣기
            </button>
            <button
              type="button"
              className={inlineActionButton}
              onClick={onReadCustomer}
              disabled={!ttsSupported}
            >
              <Volume2 size={14} />
              고객에게 읽기
            </button>
          </div>
        </div>
      )}

      {!isCompact && (
        <section className={compactEvidence} aria-label="근거">
          <p className={compactEvidenceTitle}>
            {isFixedSafety ? "안전 절차 근거" : "근거"}
          </p>
          {recommendation.citations.length > 0 ? (
            <CitationList
              citations={recommendation.citations}
              note={
                recommendation.needsHumanReview
                  ? "상담사가 답변을 검토 중입니다."
                  : undefined
              }
            />
          ) : (
            <p className={noEvidence}>
              확인된 RAG 근거 없음
              <br />
              일반적인 응대 원칙으로 작성됨 · 상담사 검토 필요
            </p>
          )}
        </section>
      )}

      {isCompact && scriptOpen && (
        <div className={scriptBlock}>
          <p className={scriptLabel}>고객 응대 전체 멘트</p>
          {editing ? (
            <textarea
              className={editArea}
              value={editText}
              onChange={(event) => onEditTextChange(event.target.value)}
            />
          ) : (
            <p className={recommendationText}>{recommendation.sayNow}</p>
          )}
        </div>
      )}

      {isThreatAlert && <p className={disclaimer}>※ 법률상 확정 판단이 아닌 운영 안내</p>}

      {echoConfirmed && (
        <p className={echoCheck}>
          <Check size={14} />
          직원이 답변한 것으로 확인됨
        </p>
      )}

      {isLatest && !isFixedSafety && recommendation.expectedReplies.length > 0 && (
        <div>
          <p className={quickReplyLabel}>예상 답변 · 눌러서 바로 입력</p>
          <div className={quickReplyRow}>
            {recommendation.expectedReplies.map((reply) => (
              <Chip
                key={reply}
                disabled={quickReplyDisabled}
                onClick={() => onQuickReply(reply)}
              >
                {reply}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {hasDetails && (
        <>
          <button type="button" className={detailToggle} onClick={onToggleDetails}>
            <span>
              {recommendation.nextActions.length > 0 &&
                `다음 행동 ${recommendation.nextActions.length}`}
              {recommendation.nextActions.length > 0 &&
                recommendation.doNot.length > 0 &&
                " · "}
              {recommendation.doNot.length > 0 && `주의 ${recommendation.doNot.length}`}
            </span>
            {detailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {detailsOpen && (
            <div className={detailBody}>
              {recommendation.nextActions.length > 0 && (
                <div>
                  <p className={detailLabel}>다음 행동</p>
                  <ul className={actionList}>
                    {recommendation.nextActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {recommendation.doNot.length > 0 && (
                <div>
                  <p className={detailLabel}>하지 말 것</p>
                  <ul className={doNotList}>
                    {recommendation.doNot.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
