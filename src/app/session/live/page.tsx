"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Pencil,
  PhoneOff,
  Send,
  ShieldAlert,
  User,
  Volume2,
} from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusPill } from "@/components/ui/StatusPill";
import { consultationClient } from "@/lib/api/consultationClient";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import {
  RISK_LABEL,
  type Recommendation,
  type RiskLevel,
  type TranscriptSegment,
} from "@/lib/types";
import { buildFixedSafetyRecommendation } from "@/lib/safety/emergencyRules";
import { vars } from "@/styles/theme.css";
import {
  actionBar,
  actionButton,
  bubbleRow,
  bubbleText,
  citationDetail,
  citationRow,
  disclaimer,
  editArea,
  actionList,
  quickReplyLabel,
  quickReplyRow,
  recommendationText,
  sourceTag,
  speakerIcon,
  topRow,
  transcriptArea,
  twoColActionBar,
  waveBar,
  waveform,
} from "./page.css";
import { manualInput, manualRow, manualSendButton } from "./manual.css";

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
  const addRecommendation = useSessionStore((state) => state.addRecommendation);
  const addAction = useSessionStore((state) => state.addAction);
  const toggleMute = useSessionStore((state) => state.toggleMute);
  const completeSession = useSessionStore((state) => state.complete);
  const addHistorySession = useHistoryStore((state) => state.addSession);

  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [warningSent, setWarningSent] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [manualText, setManualText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const runAnalysis = async (latestText: string) => {
    const current = useSessionStore.getState().session;
    if (!current) return;
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
      });
      addRecommendation(recommendation);
      if (recommendation.isFixedSafetyScript) stoppedRef.current = true;
    } catch (error) {
      console.error("[session/live] analyze failed", error);
    } finally {
      setAnalyzing(false);
    }
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
        ...buildFixedSafetyRecommendation(),
        id: `rec-${Date.now()}`,
        createdAtMs: Date.now() - session.startedAtMs,
      });
      stoppedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // 실시간 녹음 → STT → 분석 루프
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
        const mimeType = pickMimeType();

        while (!stoppedRef.current && !cancelled) {
          if (useSessionStore.getState().muted) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }

          const blob = await recordChunk(stream, CHUNK_MS, mimeType);
          if (stoppedRef.current || cancelled) break;
          if (blob.size < MIN_CHUNK_BYTES) continue;

          let text = "";
          try {
            text = await consultationClient.transcribeChunk(blob);
          } catch (error) {
            console.error("[session/live] transcribe failed", error);
            continue;
          }
          if (stoppedRef.current || cancelled || !text.trim()) continue;

          const current = useSessionStore.getState().session;
          const segment: TranscriptSegment = {
            id: `segment-${Date.now()}`,
            source: "stt_raw",
            speaker: "customer",
            text: text.trim(),
            timestampMs: current ? Date.now() - current.startedAtMs : 0,
          };
          appendTranscript(segment);
          await runAnalysis(text.trim());
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
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.transcript.length, session?.recommendations.length]);

  const recommendations = session?.recommendations ?? [];
  const latest = recommendations[recommendations.length - 1];

  const isThreatAlert = latest?.situation === "threat" && !latest.isFixedSafetyScript;
  const isFixedSafety = Boolean(latest?.isFixedSafetyScript);
  const showManualInput = !session?.intake.micAvailable || Boolean(micError);

  // 자막과 추천 답변을 하나의 대화 피드로 시간순 병합한다.
  // 새 추천이 오면 기존 카드를 덮어쓰는 대신 챗봇 히스토리처럼 아래로 쌓인다.
  const feed = useMemo(() => {
    if (!session) return [];
    type FeedItem =
      | { kind: "transcript"; ts: number; segment: TranscriptSegment }
      | { kind: "recommendation"; ts: number; recommendation: Recommendation };
    const items: FeedItem[] = [
      ...session.transcript.map(
        (segment): FeedItem => ({ kind: "transcript", ts: segment.timestampMs, segment }),
      ),
      ...session.recommendations.map(
        (recommendation): FeedItem => ({
          kind: "recommendation",
          ts: recommendation.createdAtMs,
          recommendation,
        }),
      ),
    ];
    return items.sort((a, b) => a.ts - b.ts);
  }, [session]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEditToggle = () => {
    if (!editing && latest) setEditText(latest.sayNow);
    setEditing((value) => !value);
  };

  const handleSpeakClick = () => {
    if (!latest) return;
    speak(editing ? editText : latest.sayNow);
    addAction("음성으로 답변");
  };

  const handleMuteClick = () => {
    toggleMute();
    addAction(muted ? "음소거 해제" : "음소거");
  };

  const handleEnd = () => {
    stoppedRef.current = true;
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

  const handleManualSubmit = async () => {
    const text = manualText.trim();
    const current = useSessionStore.getState().session;
    if (!text || !current) return;
    const segment: TranscriptSegment = {
      id: `segment-${Date.now()}`,
      source: "user_input",
      speaker: "customer",
      text,
      timestampMs: Date.now() - current.startedAtMs,
    };
    appendTranscript(segment);
    setManualText("");
    await runAnalysis(text);
  };

  // AI가 제시한 "예상 답변" 칩을 눌렀을 때: 직접 타이핑/녹음하지 않고도 그 문장을 손님 발화로
  // 바로 넣어 다음 분석까지 이어간다(수동 입력창에 채운 뒤 전송하는 것과 동일한 동작).
  const handleQuickReply = async (text: string) => {
    if (analyzing) return;
    const current = useSessionStore.getState().session;
    if (!current) return;
    const segment: TranscriptSegment = {
      id: `segment-${Date.now()}`,
      source: "user_input",
      speaker: "customer",
      text,
      timestampMs: Date.now() - current.startedAtMs,
    };
    appendTranscript(segment);
    await runAnalysis(text);
  };

  const riskTone = latest ? RISK_TONE[latest.situation] : "primary";

  const summary = useMemo(() => {
    if (analyzing) return "분석 중...";
    if (!latest) return "듣고 있어요";
    return RISK_LABEL[latest.situation];
  }, [latest, analyzing]);

  if (!session) return null;

  return (
    <MobileFrame
      footer={
        isThreatAlert ? (
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
            <button type="button" className={actionButton} onClick={handleSpeakClick}>
              <Volume2 size={18} />
              음성으로 답변
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
        )
      }
    >
      <div className={topRow}>
        <StatusPill>{muted ? "음소거됨" : summary}</StatusPill>
        {latest && (
          <Badge tone={riskTone}>
            위험도 {latest.riskLevel} · {RISK_LABEL[latest.situation]}
          </Badge>
        )}
      </div>

      <div className={waveform} aria-hidden>
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            className={waveBar}
            style={{ animationDelay: `${(index % 6) * 0.12}s` }}
          />
        ))}
      </div>

      {micError && (
        <Card tone="warning">
          <p className={sourceTag}>{micError}</p>
        </Card>
      )}

      <div>
        <SectionTitle>대화</SectionTitle>
        <div className={transcriptArea} ref={scrollRef}>
          {feed.map((item) =>
            item.kind === "transcript" ? (
              <div key={item.segment.id} className={bubbleRow}>
                <span
                  className={speakerIcon}
                  style={{
                    background:
                      item.segment.speaker === "ai"
                        ? vars.color.primaryLight
                        : vars.color.surfaceMuted,
                    color:
                      item.segment.speaker === "ai"
                        ? vars.color.primary
                        : vars.color.textMuted,
                  }}
                >
                  <User size={16} />
                </span>
                <div>
                  <p className={bubbleText}>{item.segment.text}</p>
                  <p className={sourceTag}>
                    {item.segment.source === "stt_raw" && "실시간 인식"}
                    {item.segment.source === "ai_corrected" && "AI 분석"}
                    {item.segment.source === "user_input" && "사용자 입력"}
                  </p>
                </div>
              </div>
            ) : (
              <RecommendationBubble
                key={item.recommendation.id}
                recommendation={item.recommendation}
                isLatest={item.recommendation.id === latest?.id}
                editing={editing}
                editText={editText}
                onEditTextChange={setEditText}
                expanded={expandedCitationId === item.recommendation.id}
                onToggleCitations={() =>
                  setExpandedCitationId((id) =>
                    id === item.recommendation.id ? null : item.recommendation.id,
                  )
                }
                onQuickReply={handleQuickReply}
                quickReplyDisabled={analyzing}
              />
            ),
          )}
        </div>

        {showManualInput && !isFixedSafety && (
          <div className={manualRow}>
            <input
              className={manualInput}
              placeholder="고객이 한 말을 입력하세요"
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleManualSubmit();
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
        )}
      </div>

    </MobileFrame>
  );
}

function RecommendationBubble({
  recommendation,
  isLatest,
  editing,
  editText,
  onEditTextChange,
  expanded,
  onToggleCitations,
  onQuickReply,
  quickReplyDisabled,
}: {
  recommendation: Recommendation;
  isLatest: boolean;
  editing: boolean;
  editText: string;
  onEditTextChange: (value: string) => void;
  expanded: boolean;
  onToggleCitations: () => void;
  onQuickReply: (text: string) => void;
  quickReplyDisabled: boolean;
}) {
  const isFixedSafety = recommendation.isFixedSafetyScript;
  const isThreatAlert = recommendation.situation === "threat" && !isFixedSafety;

  return (
    <Card tone={isFixedSafety ? "danger" : isThreatAlert ? "warning" : "primary"}>
      <div className={topRow}>
        <SectionTitle>
          {isFixedSafety ? "안전 절차" : isThreatAlert ? "위협성 발언 감지" : "추천 답변"}
        </SectionTitle>
        {!isLatest && <span className={sourceTag}>이전 답변</span>}
      </div>

      {isLatest && editing ? (
        <textarea
          className={editArea}
          value={editText}
          onChange={(event) => onEditTextChange(event.target.value)}
        />
      ) : (
        <p className={recommendationText}>{recommendation.sayNow}</p>
      )}

      {recommendation.nextActions.length > 0 && (
        <ul className={actionList}>
          {recommendation.nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      )}

      {isThreatAlert && (
        <p className={disclaimer}>※ 법률상 확정 판단이 아닌 운영 안내</p>
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

      {recommendation.citations.length > 0 && (
        <>
          <div className={citationRow} onClick={onToggleCitations}>
            <span>
              답변 근거 · {recommendation.citations[0].label}
              {recommendation.citations[0].section
                ? ` ${recommendation.citations[0].section}`
                : ""}
            </span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {expanded && (
            <div className={citationDetail}>
              {recommendation.citations.map((citation) => (
                <p key={citation.label + citation.section}>
                  {citation.label} {citation.section}
                </p>
              ))}
              {recommendation.needsHumanReview && (
                <p>상담사가 답변을 검토 중입니다.</p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
