"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
  Volume2,
} from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import {
  CitationList,
  citationSummary,
} from "@/components/session/CitationList";
import { Badge } from "@/components/ui/Badge";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Drawer } from "@/components/ui/Drawer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { consultationClient } from "@/lib/api/consultationClient";
import { formatRelativeDay } from "@/lib/format";
import { EMPTY_MESSAGES, useAssistantStore } from "@/lib/store/assistantStore";
import { useProfileStore } from "@/lib/store/profileStore";
import { RISK_LABEL, type AskAnswer, type RiskLevel } from "@/lib/types";
import {
  actionList,
  answerHeader,
  answerText,
  blockLabel,
  citationDetail,
  citationRow,
  clearButton,
  composer,
  composerInput,
  doNotList,
  emptyHint,
  emptyTitle,
  emptyWrap,
  errorText,
  feed,
  headerLeft,
  headerRow,
  newChatButton,
  pendingDot,
  pendingRow,
  sayNowBox,
  sayNowLabel,
  sayNowText,
  sendButton,
  sessionDeleteButton,
  sessionEmptyState,
  sessionItem,
  sessionItemActive,
  sessionItemMeta,
  sessionItemTitle,
  sessionListLabel,
  sessionRow,
  sessionTrigger,
  speakButton,
  suggestionChip,
  suggestionList,
  userBubble,
  userRow,
} from "./page.css";

const RISK_TONE: Record<RiskLevel, "primary" | "warning" | "danger"> = {
  normal: "primary",
  dispute: "primary",
  abuse: "warning",
  threat: "warning",
  emergency: "danger",
};

// 응대 중에 한 손으로 누를 수 있게, 매장에서 가장 자주 나오는 질문을 그대로 박아 둔다.
const SUGGESTIONS = [
  "영수증 없이 환불해 달라는데 어떡하죠?",
  "산 지 한참 된 식품이 상했다고 해요",
  "손님이 계속 소리를 지르는데 어떻게 하나요?",
  "점장을 부르라고 계속 요구해요",
];

// 백엔드로 넘길 맥락. 답변 본문만 보내고 근거·조치는 매 턴 다시 검색하게 둔다.
const HISTORY_TURNS = 6;

export default function AssistantPage() {
  const profile = useProfileStore((state) => state.profile);
  const sessions = useAssistantStore((state) => state.sessions);
  const activeId = useAssistantStore((state) => state.activeId);
  const append = useAssistantStore((state) => state.append);
  const clear = useAssistantStore((state) => state.clear);
  const startNewChat = useAssistantStore((state) => state.startNewChat);
  const selectSession = useAssistantStore((state) => state.selectSession);
  const removeSession = useAssistantStore((state) => state.removeSession);

  const activeSession = sessions.find((item) => item.id === activeId) ?? null;
  const messages = activeSession?.messages ?? EMPTY_MESSAGES;
  const pastSessions = sessions.filter((item) => item.id !== activeId);

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 스토어는 skipHydration으로 만들어 뒀다(assistantStore 참고). 화면이 붙은 뒤에 꺼낸다.
  useEffect(() => {
    void useAssistantStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  // 줄이 넘치면 다음 줄로 내려가는 만큼 입력창도 같이 늘어나야 가린 글자가 없다.
  // 최대 높이(다섯 줄)를 넘기면 CSS가 잘라 주고 그때부터 입력창 안에서 스크롤된다.
  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    // scrollHeight에는 테두리가 빠져 있는데 box-sizing이 border-box라 그만큼 더해 준다.
    const borderHeight = element.offsetHeight - element.clientHeight;
    element.style.height = `${element.scrollHeight + borderHeight}px`;
  }, [draft]);

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || pending) return;

    setDraft("");
    setError(null);
    append({
      id: `ask-user-${Date.now()}`,
      role: "user",
      text,
      createdAtMs: Date.now(),
    });
    setPending(true);

    try {
      const state = useAssistantStore.getState();
      const current = state.sessions.find((item) => item.id === state.activeId);
      const history = (current?.messages ?? [])
        .slice(-HISTORY_TURNS - 1, -1)
        .map((message) =>
          message.role === "user"
            ? { role: "user" as const, content: message.text }
            : { role: "assistant" as const, content: message.answer.answer },
        );

      const answer = await consultationClient.ask({
        profile,
        history,
        question: text,
      });
      append({
        id: answer.id,
        role: "assistant",
        answer,
        createdAtMs: Date.now(),
      });
    } catch (caught) {
      console.error("[assistant] ask failed", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleClear = () => {
    clear();
    setError(null);
    setExpandedId(null);
  };

  // Drawer의 "새 채팅": 지금 대화는 목록에 그대로 남겨 두고 빈 화면에서 다시 시작한다.
  const handleNewChat = () => {
    startNewChat();
    setDraft("");
    setError(null);
    setExpandedId(null);
    setSessionDrawerOpen(false);
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    setError(null);
    setExpandedId(null);
    setSessionDrawerOpen(false);
  };

  return (
    <MobileFrame
      footer={
        <>
          <div className={composer}>
            <textarea
              ref={inputRef}
              className={composerInput}
              placeholder="어떻게 해야 할지 물어보세요"
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                // Shift+Enter는 직접 줄을 바꾸고, 그냥 Enter는 전송한다.
                if (event.shiftKey) return;
                event.preventDefault();
                void send(draft);
              }}
            />
            <button
              type="button"
              className={sendButton}
              onClick={() => void send(draft)}
              disabled={pending || draft.trim().length === 0}
              aria-label="질문 보내기"
            >
              <Send size={18} />
            </button>
          </div>
          <BottomNav />
        </>
      }
      overlay={
        <Drawer
          open={sessionDrawerOpen}
          onClose={() => setSessionDrawerOpen(false)}
          title="대화 목록"
          side="left"
        >
          <button type="button" className={newChatButton} onClick={handleNewChat}>
            <Plus size={16} />
            새 채팅
          </button>

          {activeSession && (
            <>
              <p className={sessionListLabel}>진행 중</p>
              {/* sessionItem은 목록 행 안에서 폭을 채우는 스타일이라 여기서도 같은 행으로 감싼다. */}
              <div className={sessionRow}>
                <div className={`${sessionItem} ${sessionItemActive}`}>
                  <span className={sessionItemTitle}>{activeSession.title}</span>
                  <span className={sessionItemMeta}>
                    <span>{formatRelativeDay(activeSession.updatedAtMs)}</span>
                    <span>메시지 {activeSession.messages.length}개</span>
                  </span>
                </div>
              </div>
            </>
          )}

          <p className={sessionListLabel}>지난 대화</p>
          {pastSessions.length === 0 ? (
            <p className={sessionEmptyState}>저장된 대화가 없습니다.</p>
          ) : (
            pastSessions.map((item) => (
              <div key={item.id} className={sessionRow}>
                <button
                  type="button"
                  className={sessionItem}
                  onClick={() => handleSelectSession(item.id)}
                >
                  <span className={sessionItemTitle}>{item.title}</span>
                  <span className={sessionItemMeta}>
                    <span>{formatRelativeDay(item.updatedAtMs)}</span>
                    <span>메시지 {item.messages.length}개</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={sessionDeleteButton}
                  aria-label="대화 삭제"
                  onClick={() => removeSession(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </Drawer>
      }
    >
      <div className={headerRow}>
        <div className={headerLeft}>
          <button
            type="button"
            className={sessionTrigger}
            aria-label="대화 목록"
            onClick={() => setSessionDrawerOpen(true)}
          >
            <History size={16} />
          </button>
          <SectionTitle>물어보기</SectionTitle>
        </div>
        {messages.length > 0 && (
          <button type="button" className={clearButton} onClick={handleClear}>
            <Trash2 size={14} />
            대화 지우기
          </button>
        )}
      </div>

      {messages.length === 0 && !pending ? (
        <div className={emptyWrap}>
          <p className={emptyTitle}>
            지금 어떻게 해야 할지
            <br />
            바로 물어보세요.
          </p>
          <p className={emptyHint}>
            녹음을 켜거나 설문을 채우지 않아도 됩니다. 매장 규정과 관련 법령을 찾아
            바로 할 말과 조치를 알려드립니다.
            {!profile && " 업종을 설정하면 업종에 맞는 근거로 답변합니다."}
          </p>
          <div className={suggestionList}>
            {SUGGESTIONS.map((suggestion) => (
              <Chip
                key={suggestion}
                className={suggestionChip}
                onClick={() => void send(suggestion)}
              >
                {suggestion}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div className={feed}>
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className={userRow}>
                <p className={userBubble}>{message.text}</p>
              </div>
            ) : (
              <AnswerCard
                key={message.id}
                answer={message.answer}
                expanded={expandedId === message.id}
                onToggleCitations={() =>
                  setExpandedId((id) => (id === message.id ? null : message.id))
                }
              />
            ),
          )}

          {pending && (
            <div className={pendingRow}>
              <span className={pendingDot} />
              <span className={pendingDot} style={{ animationDelay: "0.2s" }} />
              <span className={pendingDot} style={{ animationDelay: "0.4s" }} />
              근거를 찾는 중입니다...
            </div>
          )}

          {error && (
            <Card tone="warning">
              <p className={errorText}>{error}</p>
            </Card>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </MobileFrame>
  );
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  window.speechSynthesis.speak(utterance);
}

function AnswerCard({
  answer,
  expanded,
  onToggleCitations,
}: {
  answer: AskAnswer;
  expanded: boolean;
  onToggleCitations: () => void;
}) {
  const isFixedSafety = answer.isFixedSafetyScript;
  const tone = isFixedSafety
    ? "danger"
    : answer.situation === "normal" || answer.situation === "dispute"
      ? "neutral"
      : "warning";

  return (
    <Card tone={tone}>
      <div className={answerHeader}>
        <SectionTitle>
          {isFixedSafety ? (
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ShieldAlert size={16} />
              안전 절차
            </span>
          ) : (
            "답변"
          )}
        </SectionTitle>
        {answer.situation !== "normal" && (
          <Badge tone={RISK_TONE[answer.situation]}>
            {RISK_LABEL[answer.situation]}
          </Badge>
        )}
      </div>

      <p className={answerText}>{answer.answer}</p>

      {answer.sayNow && (
        <div className={sayNowBox}>
          <div className={sayNowLabel}>
            <span>이렇게 말하세요</span>
            <button
              type="button"
              className={speakButton}
              onClick={() => speak(answer.sayNow ?? "")}
            >
              <Volume2 size={14} />
              읽어주기
            </button>
          </div>
          <p className={sayNowText}>{answer.sayNow}</p>
        </div>
      )}

      {answer.nextActions.length > 0 && (
        <>
          <p className={blockLabel}>이렇게 하세요</p>
          <ol className={actionList}>
            {answer.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </>
      )}

      {answer.doNot.length > 0 && (
        <>
          <p className={blockLabel}>하지 마세요</p>
          <ul className={doNotList}>
            {answer.doNot.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {answer.citations.length > 0 && (
        <>
          <div className={citationRow} onClick={onToggleCitations}>
            <span>답변 근거 · {citationSummary(answer.citations)}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {expanded && (
            <CitationList
              citations={answer.citations}
              note={
                answer.needsHumanReview
                  ? "관리자·전문가 확인이 필요한 내용입니다."
                  : undefined
              }
            />
          )}
        </>
      )}

      {answer.citations.length === 0 && answer.needsHumanReview && (
        <p className={citationDetail} style={{ marginTop: 8 }}>
          근거 문서에서 확인되지 않아 일반적인 응대 원칙으로 답했습니다. 관리자 확인이 필요합니다.
        </p>
      )}
    </Card>
  );
}
