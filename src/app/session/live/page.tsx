"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  Check,
  ChevronDown,
  ChevronUp,
  Ear,
  Mic,
  MicOff,
  Pencil,
  PhoneOff,
  Send,
  ShieldAlert,
  Siren,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Volume2,
} from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import {
  CitationList,
  citationSummary,
} from "@/components/session/CitationList";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusPill } from "@/components/ui/StatusPill";
import { consultationClient } from "@/lib/api/consultationClient";
import { blankIntake, useSessionStore } from "@/lib/store/sessionStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { useListeningStore } from "@/lib/store/listeningStore";
import { useProfileStore } from "@/lib/store/profileStore";
import {
  selectKnowledgeForAnalysis,
  useStoreKnowledgeStore,
} from "@/lib/store/storeKnowledgeStore";
import {
  RISK_LABEL,
  type ConsultationSession,
  type Recommendation,
  type RiskLevel,
  type TranscriptSegment,
  type TranscriptSource,
} from "@/lib/types";
import {
  buildFixedSafetyRecommendation,
  shouldTriggerFixedSafety,
} from "@/lib/safety/emergencyRules";
import { textSimilarity } from "@/lib/text/similarity";
import { startListeningLoop, type ListeningLoop } from "@/lib/mic/listeningLoop";
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
  detailToggle,
  disclaimer,
  draftCaret,
  draftLabel,
  echoCheck,
  echoTag,
  editArea,
  emergencyRow,
  meter,
  meterBar,
  paneDivider,
  paneHandle,
  paneHandleLabel,
  primaryActionButton,
  quickReplyLabel,
  quickReplyRow,
  recommendationText,
  sourceTag,
  speakerIcon,
  statusBar,
  toast as toastStyle,
  topRow,
  transcriptEmpty,
  transcriptPane,
  twoColActionBar,
  waitingBadge,
} from "./page.css";
import { manualBar, manualInput, manualRow, manualSendButton } from "./manual.css";

const RISK_TONE: Record<RiskLevel, "primary" | "warning" | "danger"> = {
  normal: "primary",
  dispute: "primary",
  abuse: "warning",
  threat: "warning",
  emergency: "danger",
};

// 새로 인식된 발화가 직전 "추천 답변"을 직원이 그대로 읽은 것인지 판단하는 유사도 기준.
// 마이크가 직원 목소리도 같이 주워서 "손님 말"로 오인되는 걸 막기 위한 것이라 다소 느슨하게 잡는다.
const ECHO_SIMILARITY_THRESHOLD = 0.6;
// 새로 생성된 답변이 직전 답변과 사실상 같은 형태인지 판단하는 유사도 기준.
// 에코 판단보다는 보수적으로 — 진짜 손님 발화에 대한 답인데 우연히 비슷한 경우까지 지우지 않도록.
const DUPLICATE_SIMILARITY_THRESHOLD = 0.75;

// 상시 녹음에서는 상담을 끝내 줄 사람이 없다. 손님이 가고 나면 마지막 발화 이후로 조용해지므로,
// 이만큼 아무 말도 없으면 상담이 끝난 것으로 보고 저장한 뒤 대기 상태로 돌아간다.
// 짧게 잡으면 손님이 잠깐 생각하는 사이에 상담이 둘로 쪼개진다.
const IDLE_CLOSE_MS = 90_000;
const IDLE_CHECK_MS = 10_000;
// 토스트를 띄워 두는 시간.
const TOAST_MS = 4000;

type PaneSize = "sm" | "md" | "lg";
const PANE_SIZE_ORDER: PaneSize[] = ["sm", "md", "lg"];
const PANE_SIZE_LABEL: Record<PaneSize, string> = {
  sm: "대화 작게",
  md: "대화 보통",
  lg: "대화 크게",
};

export default function SessionLivePage() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const draft = useSessionStore((state) => state.draft);
  const initSession = useSessionStore((state) => state.initSession);
  const appendTranscript = useSessionStore((state) => state.appendTranscript);
  const removeTurn = useSessionStore((state) => state.removeTurn);
  const addRecommendation = useSessionStore((state) => state.addRecommendation);
  const addAction = useSessionStore((state) => state.addAction);
  const setDraft = useSessionStore((state) => state.setDraft);
  const clearDraft = useSessionStore((state) => state.clearDraft);
  const completeSession = useSessionStore((state) => state.complete);
  const startNextSession = useSessionStore((state) => state.startNext);
  const resetSession = useSessionStore((state) => state.reset);
  const addHistorySession = useHistoryStore((state) => state.addSession);
  const muted = useListeningStore((state) => state.muted);
  const micAvailable = useListeningStore((state) => state.micAvailable);
  const toggleMute = useListeningStore((state) => state.toggleMute);
  const profile = useProfileStore((state) => state.profile);

  // 아래 세 가지는 "어느 답변에 대한 상태인지"를 함께 들고 있는다. 새 답변이 오면
  // 그 id가 더 이상 맞지 않게 되어 자동으로 초기 상태로 돌아간다(effect에서 초기화하지 않는다).
  const [detailsOpenFor, setDetailsOpenFor] = useState<string | null>(null);
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
  const [toast, setToast] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<ListeningLoop | null>(null);
  const manualInputRef = useRef<HTMLTextAreaElement>(null);
  // 분석 요청 순번. 분석을 더 이상 기다리지 않고 녹음을 이어가므로 두 분석이 겹칠 수 있는데,
  // 그때 늦게 끝난 옛 요청이 최신 답변을 덮어쓰지 않도록 순번으로 막는다.
  const analysisSeqRef = useRef(0);
  // 분석이 돌고 있는지. 유휴 마감 타이머가 interval 클로저 안에서 읽어야 해서
  // state(analyzing)와 별도로 ref로도 들고 있는다.
  const analyzingRef = useRef(false);
  // 고정 안전 절차가 뜬 상담에서는 더 이상 생성형 답변을 만들지 않는다. 녹음은 계속한다 —
  // 위협 상황일수록 기록이 남아야 하고, 마이크를 끄면 신고 자료가 사라진다.
  const safetyLockRef = useRef(false);
  // 유휴 자동 마감 판단용. 손님 발화가 들어올 때마다 갱신한다.
  // 렌더 중에는 Date.now()를 부르지 않는다(React 순수성 규칙). 0으로 두어도 안전하다 —
  // 마감 판정은 활성 상담이 있을 때만 하고, 상담은 첫 발화가 이 값을 채운 뒤에야 생긴다.
  const lastUtteranceAtRef = useRef(0);
  const toastTimerRef = useRef(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const markAnalyzing = useCallback((value: boolean) => {
    analyzingRef.current = value;
    setAnalyzing(value);
  }, []);

  /**
   * 상시 녹음에서는 손님이 말을 시작하는 순간이 곧 상담의 시작이다. 직원이 아무것도
   * 누르지 않아도 되도록, 첫 발화를 받는 이 지점에서 상담을 만든다.
   */
  const ensureSession = useCallback((): ConsultationSession | null => {
    const current = useSessionStore.getState().session;
    if (current && current.status === "active") return current;
    const currentProfile = useProfileStore.getState().profile;
    // 온보딩 전이면 업종을 몰라 근거 검색이 엉뚱해진다. 상담을 만들지 않는다.
    if (!currentProfile) return null;
    return initSession(
      currentProfile,
      blankIntake(useListeningStore.getState().micAvailable),
    );
  }, [initSession]);

  /** 지금 화면에 쌓여 있는 매장 규정 중 분석에 실어 보낼 것만 고른다. */
  const pickStoreKnowledge = useCallback(
    () =>
      selectKnowledgeForAnalysis(useStoreKnowledgeStore.getState().entries).map(
        (entry) => ({ category: entry.category, title: entry.title, body: entry.body }),
      ),
    [],
  );

  const runAnalysis = useCallback(
    async (latestText: string, sessionId: string) => {
      const current = useSessionStore.getState().session;
      if (!current || current.id !== sessionId) return;
      const seq = analysisSeqRef.current + 1;
      analysisSeqRef.current = seq;

      // 이 분석 결과가 아직 유효한지. 순번이 밀렸거나(더 최신 발화가 들어옴)
      // 손님이 바뀌었으면(다음 고객) 버린다. 순번만으로는 "이전 손님의 느린 분석이
      // 새 손님 상담에 붙는" 경우를 개념적으로 막지 못한다.
      const stillCurrent = () =>
        seq === analysisSeqRef.current &&
        useSessionStore.getState().session?.id === sessionId;

      markAnalyzing(true);
      try {
        const recommendation = await consultationClient.analyzeStream(
          {
            profile: current.profile,
            intake: current.intake,
            recentTranscript: current.transcript
              .slice(-8)
              .map((segment) => ({ speaker: segment.speaker, text: segment.text })),
            recentSituations: current.recommendations
              .slice(-4)
              .map((recommendation) => recommendation.situation),
            latestText,
            storeKnowledge: pickStoreKnowledge(),
          },
          {
            // 서버에서 글자가 도착하는 대로 보여준다. 전체 JSON(근거·다음 행동까지)이
            // 완성되기를 기다리면 3~5초를 그냥 흘려보내게 된다.
            onPartial: (partial) => {
              if (!stillCurrent()) return;
              setDraft(partial);
            },
          },
        );
        if (!stillCurrent()) return;

        // 손님 발화는 새로 들어왔지만 결과 답변이 직전 답변과 사실상 같은 형태라면
        // 카드를 또 쌓지 않는다 — 상담원 입장에서는 같은 답변이 반복 노출될 뿐이다.
        const store = useSessionStore.getState().session;
        const prevRecommendation = store?.recommendations[store.recommendations.length - 1];
        const isDuplicate =
          prevRecommendation != null &&
          prevRecommendation.situation === recommendation.situation &&
          textSimilarity(prevRecommendation.sayNow, recommendation.sayNow) >=
            DUPLICATE_SIMILARITY_THRESHOLD;
        if (isDuplicate) {
          clearDraft();
          return;
        }

        // 백엔드는 createdAtMs를 절대 시각(epoch ms)으로 채워 보내지만, 화면과 이력은
        // "상담 시작 후 몇 초"라는 상대 시각을 쓴다(transcript.timestampMs와 같은 축).
        // 그대로 두면 추천이 항상 모든 발화보다 뒤로 정렬돼 손님 말과 짝이 지어지지 않고,
        // 이력 화면의 경과 시간도 엉뚱하게 찍힌다.
        addRecommendation({
          ...recommendation,
          createdAtMs: Date.now() - current.startedAtMs,
        });
        if (recommendation.isFixedSafetyScript) safetyLockRef.current = true;
      } catch (error) {
        console.error("[session/live] analyze failed", error);
        if (stillCurrent()) clearDraft();
      } finally {
        if (seq === analysisSeqRef.current) markAnalyzing(false);
      }
    },
    [addRecommendation, clearDraft, markAnalyzing, pickStoreKnowledge, setDraft],
  );

  /** 고정 안전 절차를 지금 상담에 즉시 붙인다(서버를 거치지 않는다). */
  const pushFixedSafety = useCallback(
    (latestText: string, target: ConsultationSession) => {
      addRecommendation({
        ...buildFixedSafetyRecommendation(latestText),
        id: `rec-${Date.now()}`,
        createdAtMs: Date.now() - target.startedAtMs,
      });
      safetyLockRef.current = true;
    },
    [addRecommendation],
  );

  // STT/수동 입력/예상 답변 칩 — 손님 발화로 취급될 모든 입력이 거치는 공통 경로.
  // 직전 "추천 답변"을 직원이 그대로 읽은 것처럼 들리면(echo) 새 분석 없이 기록만 남긴다.
  const submitCustomerUtterance = useCallback(
    async (
      text: string,
      source: TranscriptSource,
      options?: { lowConfidence?: boolean },
    ) => {
      const current = ensureSession();
      if (!current) return;
      lastUtteranceAtRef.current = Date.now();

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

      // 이미 고정 안전 절차가 떠 있는 상담이면 생성형 답변으로 되돌리지 않는다.
      if (safetyLockRef.current) return;

      // 위협·흉기 표현은 서버에 물어볼 것도 없이 결론이 같다(백엔드 route_after_entry가
      // 같은 사전으로 같은 판정을 한다). 가장 위험한 순간에 왕복 3~5초를 쓰지 않고
      // 바로 안전 절차를 띄운다.
      const recentSituations = current.recommendations
        .slice(-4)
        .map((recommendation) => recommendation.situation);
      if (shouldTriggerFixedSafety(text, recentSituations)) {
        // 늦게 도착할 생성형 분석이 안전 절차를 덮지 않도록 순번을 밀어 둔다.
        analysisSeqRef.current += 1;
        clearDraft();
        markAnalyzing(false);
        pushFixedSafety(text, current);
        return;
      }

      await runAnalysis(text, current.id);
    },
    [
      appendTranscript,
      clearDraft,
      ensureSession,
      markAnalyzing,
      pushFixedSafety,
      runAnalysis,
    ],
  );

  // 다른 화면의 "지금 긴급해요"로 들어온 경우: 설문·분석 없이 고정 안전 절차를 즉시 표시한다.
  useEffect(() => {
    if (!useListeningStore.getState().consumeEmergency()) return;
    const current = ensureSession();
    if (current) pushFixedSafety("", current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 듣기 루프는 한 번만 시작하고 계속 살려 둬야 한다. 그래서 루프에 넘기는 콜백이 첫 렌더의
  // 클로저에 그대로 묶이는데, 그 안에서 읽는 값이 나중에 낡으면 발화가 엉뚱한 상담에 붙는다.
  // 콜백 자체를 ref로 들고 매 렌더 최신으로 갈아끼워, 루프는 건드리지 않으면서 항상 최신
  // 로직을 부르게 한다.
  const submitRef = useRef(submitCustomerUtterance);
  useEffect(() => {
    submitRef.current = submitCustomerUtterance;
  }, [submitCustomerUtterance]);

  // 상시 듣기 루프. 상담이 아니라 이 화면의 수명에 묶인다 — "다음 고객"으로 상담이
  // 바뀌어도 마이크는 끊기지 않는다(예전에는 session.id에 묶여 매번 다시 열었다).
  useEffect(() => {
    if (!micAvailable) return;

    let disposed = false;
    void startListeningLoop({
      isMuted: () => useListeningStore.getState().muted,
      onUtterance: ({ text, lowConfidence }) => {
        void submitRef.current(text, "stt_raw", { lowConfidence });
      },
      onError: (message) => {
        if (!disposed) setMicError(message);
      },
    }).then((loop) => {
      if (disposed) {
        loop.stop();
        return;
      }
      loopRef.current = loop;
    });

    return () => {
      disposed = true;
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [micAvailable]);

  /** 상담을 마감해 이력에 남긴다. 발화가 하나도 없는 상담은 저장하지 않는다. */
  const archive = useCallback(
    (completed: ConsultationSession | null) => {
      if (!completed) return false;
      if (completed.transcript.length === 0 && completed.recommendations.length === 0) {
        return false;
      }
      addHistorySession(completed);
      return true;
    },
    [addHistorySession],
  );

  // 유휴 자동 마감 — 손님이 가고 나면 아무도 "종료"를 눌러 주지 않는다.
  // 조용한 시간이 충분히 이어지면 저장하고 대기 상태로 돌아간다(새 상담은 만들지 않는다).
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = useSessionStore.getState().session;
      if (!current || current.status !== "active") return;
      if (Date.now() - lastUtteranceAtRef.current < IDLE_CLOSE_MS) return;
      // 분석이 아직 돌고 있으면 그 답변이 어디에도 붙지 못하고 사라진다. 한 바퀴 더 기다린다.
      if (analyzingRef.current) return;

      const completed = completeSession();
      const saved = archive(completed);
      resetSession();
      safetyLockRef.current = false;
      loopRef.current?.resetDedupe();
      setPinned(null);
      setEditingFor(null);
      setDetailsOpenFor(null);
      setConfirmDeleteId(null);
      showToast(saved ? "조용해서 상담을 저장했습니다" : "대기 상태로 돌아갑니다");
    }, IDLE_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [archive, completeSession, resetSession, showToast]);

  // 상태 문구("말소리 감지" / "조용함")용. 값이 바뀔 때만 리렌더된다.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setHearing(loopRef.current?.isVoiced() ?? false);
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const recommendations = useMemo(() => session?.recommendations ?? [], [session]);
  const latest = recommendations[recommendations.length - 1];

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
  const showManualInput = !micAvailable || Boolean(micError);

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
  // 스트리밍 중인 답변은 지난 답변을 일부러 띄워 둔 게 아닐 때만 끼워 넣는다
  // (pinned 규칙과 같은 취지 — 직원이 보던 화면을 새 답변이 밀어내지 않는다).
  // isShowingLatest로 판단하면 안 된다: 상담의 첫 답변은 latest 자체가 없어서 그 값이
  // 늘 false이고, 하필 스트리밍이 가장 필요한 순간에 초안이 통째로 안 뜬다.
  const showDraft = draft != null && pinnedRecommendation == null;

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.speak(utterance);
    }
  };

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

  const handleSpeakClick = () => {
    if (!shown) return;
    speak(editing && isShowingLatest ? editText : shown.sayNow);
    addAction("음성으로 답변");
  };

  const handleMuteClick = () => {
    toggleMute();
    addAction(muted ? "음소거 해제" : "음소거");
  };

  const handleEnd = () => {
    const completed = completeSession();
    archive(completed);
    router.push("/session/complete");
  };

  /**
   * "다음 고객" — 마이크를 끊지 않고 상담 경계만 새로 긋는다.
   * 발화자가 바뀌었다는 사실은 직원만 알 수 있으므로(화자 분리를 하지 않는다) 이 버튼이
   * 그 신호 역할을 한다.
   */
  const handleNextCustomer = () => {
    const completed = startNextSession();
    const saved = archive(completed);
    // 이전 손님에 대해 돌고 있던 분석 결과가 새 상담에 붙지 않도록 순번을 밀어 둔다.
    analysisSeqRef.current += 1;
    markAnalyzing(false);
    safetyLockRef.current = false;
    lastUtteranceAtRef.current = Date.now();
    // 새 손님이 우연히 이전 손님과 같은 말을 해도 "반복"으로 걸러지지 않게 한다.
    loopRef.current?.resetDedupe();
    setPinned(null);
    setEditingFor(null);
    setDetailsOpenFor(null);
    setConfirmDeleteId(null);
    setWarningSent(false);
    showToast(saved ? "이전 상담을 저장했습니다" : "새 상담을 시작합니다");
  };

  const handleEmergency = () => {
    const current = ensureSession();
    if (!current) return;
    analysisSeqRef.current += 1;
    clearDraft();
    markAnalyzing(false);
    pushFixedSafety("", current);
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

  const getLevel = useCallback(() => loopRef.current?.level() ?? 0, []);

  const riskTone = shown ? RISK_TONE[shown.situation] : "primary";

  const statusText = useMemo(() => {
    if (muted) return "음소거됨";
    if (analyzing) return "분석 중...";
    if (showManualInput) return "직접 입력 모드";
    if (!session) return hearing ? "말소리 감지" : "대기 중 · 듣는 중";
    return hearing ? "말소리 감지" : "조용함 · 듣는 중";
  }, [muted, analyzing, showManualInput, hearing, session]);

  // 온보딩을 마치지 않으면 업종을 몰라 근거 검색이 엉뚱해진다. 먼저 업종부터 받는다.
  useEffect(() => {
    if (!profile) router.replace("/onboarding");
  }, [profile, router]);
  if (!profile) return null;

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
              <button type="button" className={actionButton} onClick={handleNextCustomer}>
                <UserPlus size={18} />
                다음 고객
              </button>
            </div>
          ) : (
            <div className={actionBar}>
              <button
                type="button"
                className={actionButton}
                onClick={handleEditToggle}
                disabled={!latest}
              >
                <Pencil size={18} />
                수정
              </button>
              <button
                type="button"
                className={actionButton}
                onClick={handleSpeakClick}
                disabled={!shown}
              >
                <Volume2 size={18} />
                읽어주기
              </button>
              <button
                type="button"
                className={primaryActionButton}
                onClick={handleNextCustomer}
                disabled={!session}
              >
                <UserPlus size={18} />
                다음 고객
              </button>
              <button type="button" className={actionButton} onClick={handleMuteClick}>
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
                음소거
              </button>
              <button
                type="button"
                className={actionButton}
                onClick={handleEnd}
                disabled={!session}
                style={{ color: vars.color.danger, borderColor: vars.color.danger }}
              >
                <PhoneOff size={18} />
                종료
              </button>
            </div>
          )}
        </>
      }
    >
      <div className={statusBar}>
        <StatusPill>{statusText}</StatusPill>
        {!showManualInput && <LevelMeter getLevel={getLevel} muted={muted} />}
        {shown && (
          <Badge tone={riskTone}>
            위험도 {shown.riskLevel} · {RISK_LABEL[shown.situation]}
          </Badge>
        )}
      </div>

      {toast && (
        <p className={toastStyle}>
          <Check size={14} />
          {toast}
        </p>
      )}

      {!isFixedSafety && (
        <button type="button" className={emergencyRow} onClick={handleEmergency}>
          <Siren size={16} />
          지금 긴급해요 — 안전 절차 바로 보기
        </button>
      )}

      {micError && (
        <Card tone="warning">
          <p className={sourceTag}>{micError}</p>
        </Card>
      )}

      <div className={transcriptPane[paneSize]} ref={transcriptRef}>
        {feed.length === 0 ? (
          <p className={transcriptEmpty}>
            {session ? (
              <>
                손님 말이 인식되면 여기에 표시됩니다.
                <br />
                조용할 때는 아무것도 기록하지 않습니다.
              </>
            ) : (
              <>
                손님이 말을 시작하면 상담이 자동으로 시작됩니다.
                <br />
                그때까지는 아무것도 기록하지 않습니다.
              </>
            )}
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
        {showDraft ? (
          <DraftCard draft={draft} />
        ) : shown ? (
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
              onToggleDetails={() =>
                setDetailsOpenFor((id) => (id === shown.id ? null : shown.id))
              }
              onQuickReply={handleQuickReply}
              quickReplyDisabled={analyzing}
            />
          </>
        ) : analyzing ? (
          <p className={answerEmpty}>답변을 만들고 있습니다...</p>
        ) : session ? (
          <p className={answerEmpty}>손님 말이 들어오면 추천 답변이 여기에 뜹니다.</p>
        ) : (
          <>
            <span className={waitingBadge}>
              <Ear size={14} />
              듣는 중
            </span>
            <p className={answerEmpty}>
              손님이 말을 시작하면 상담이 자동으로 시작됩니다.
              <br />
              손님이 바뀌면 아래 <strong>다음 고객</strong>을 눌러 주세요.
            </p>
          </>
        )}
      </div>
    </MobileFrame>
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

/**
 * 도착 중인 답변. 완성본과 같은 자리·같은 크기로 그려서, 글자가 다 차는 순간 화면이
 * 덜컥 바뀌지 않게 한다. 아직 근거를 대조하기 전이므로 근거·다음 행동은 보여주지 않는다.
 */
function DraftCard({ draft }: { draft: { situation: RiskLevel; sayNow: string } }) {
  return (
    <div className={answerCard[RISK_TONE[draft.situation]]}>
      <div className={topRow}>
        <SectionTitle>추천 답변</SectionTitle>
        <span className={draftLabel}>작성 중</span>
      </div>
      <p className={recommendationText}>
        {draft.sayNow}
        <span className={draftCaret} />
      </p>
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
  onToggleDetails,
  onQuickReply,
  quickReplyDisabled,
}: {
  recommendation: Recommendation;
  isLatest: boolean;
  echoConfirmed: boolean;
  editing: boolean;
  editText: string;
  onEditTextChange: (value: string) => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onQuickReply: (text: string) => void;
  quickReplyDisabled: boolean;
}) {
  const isFixedSafety = recommendation.isFixedSafetyScript;
  const isThreatAlert = recommendation.situation === "threat" && !isFixedSafety;
  const tone = isFixedSafety ? "danger" : isThreatAlert ? "warning" : "primary";
  const hasDetails =
    recommendation.nextActions.length > 0 || recommendation.citations.length > 0;

  return (
    <div className={answerCard[tone]}>
      <div className={topRow}>
        <SectionTitle>
          {isFixedSafety ? "안전 절차" : isThreatAlert ? "위협성 발언 감지" : "추천 답변"}
        </SectionTitle>
        {!isLatest && <span className={sourceTag}>이전 답변</span>}
      </div>

      {editing ? (
        <textarea
          className={editArea}
          value={editText}
          onChange={(event) => onEditTextChange(event.target.value)}
        />
      ) : (
        <p className={recommendationText}>{recommendation.sayNow}</p>
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
                recommendation.citations.length > 0 &&
                " · "}
              {recommendation.citations.length > 0 &&
                `답변 근거 ${citationSummary(recommendation.citations)}`}
            </span>
            {detailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {detailsOpen && (
            <div className={detailBody}>
              {recommendation.nextActions.length > 0 && (
                <ul className={actionList}>
                  {recommendation.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              )}
              {recommendation.citations.length > 0 && (
                <CitationList
                  citations={recommendation.citations}
                  note={
                    recommendation.needsHumanReview
                      ? "상담사가 답변을 검토 중입니다."
                      : undefined
                  }
                />
              )}
              {recommendation.citations.length === 0 &&
                recommendation.needsHumanReview && <p>상담사가 답변을 검토 중입니다.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
