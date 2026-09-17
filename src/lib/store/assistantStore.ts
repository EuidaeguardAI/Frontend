import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AskChatMessage, AskChatSession } from "@/lib/types";

// 대화가 길어져도 localStorage를 무한정 채우지 않도록 최근 분량만 남긴다.
// 백엔드로 보내는 맥락도 어차피 최근 6턴이라 이보다 더 들고 있을 이유가 없다.
const MAX_MESSAGES = 40;
// 세션 목록도 같은 이유로 최근 것만 남긴다.
const MAX_SESSIONS = 20;

// 셀렉터가 매번 새 빈 배열을 만들면 리렌더가 멈추지 않는다. 하나를 돌려 쓴다.
export const EMPTY_MESSAGES: AskChatMessage[] = [];

const TITLE_MAX = 24;

// 목록에 보일 이름. 첫 질문을 그대로 쓰되 한 줄에 들어갈 만큼만 자른다.
function titleFromMessages(messages: AskChatMessage[]): string {
  const first = messages.find((message) => message.role === "user");
  if (!first || first.role !== "user") return "새 대화";
  const text = first.text.replace(/\s+/g, " ").trim();
  if (text.length === 0) return "새 대화";
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX)}...` : text;
}

interface AssistantState {
  /** 저장된 대화 세션. 최근에 쓴 것이 앞에 온다. */
  sessions: AskChatSession[];
  /** 지금 화면에 떠 있는 세션. 아직 한 마디도 안 했으면 null. */
  activeId: string | null;
  append: (message: AskChatMessage) => void;
  /** 현재 대화만 지운다(세션 자체를 목록에서 뺀다). */
  clear: () => void;
  /** 지금 대화는 목록에 남겨 두고 빈 화면에서 새로 시작한다. */
  startNewChat: () => void;
  selectSession: (id: string) => void;
  removeSession: (id: string) => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      sessions: [],
      activeId: null,

      // 첫 메시지가 들어오는 순간 세션이 만들어지므로, 따로 "저장" 버튼을 누르지 않아도
      // 대화는 항상 목록에 남는다. 빈 세션이 목록을 채우는 일도 없다.
      append: (message) =>
        set((state) => {
          const now = Date.now();
          const active = state.sessions.find((item) => item.id === state.activeId);

          if (!active) {
            const session: AskChatSession = {
              id: `ask-session-${now}`,
              title: titleFromMessages([message]),
              messages: [message],
              createdAtMs: now,
              updatedAtMs: now,
            };
            return {
              sessions: [session, ...state.sessions].slice(0, MAX_SESSIONS),
              activeId: session.id,
            };
          }

          const messages = [...active.messages, message].slice(-MAX_MESSAGES);
          const updated: AskChatSession = {
            ...active,
            title: active.title === "새 대화" ? titleFromMessages(messages) : active.title,
            messages,
            updatedAtMs: now,
          };
          return {
            sessions: [
              updated,
              ...state.sessions.filter((item) => item.id !== active.id),
            ],
          };
        }),

      clear: () =>
        set((state) => ({
          sessions: state.sessions.filter((item) => item.id !== state.activeId),
          activeId: null,
        })),

      startNewChat: () => set({ activeId: null }),

      selectSession: (id) => set({ activeId: id }),

      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((item) => item.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
        })),
    }),
    {
      name: "euidaeguard-assistant",
      // 저장된 대화를 첫 렌더에 바로 꺼내 쓰면 서버가 그린 빈 화면과 어긋나 하이드레이션
      // 오류가 난다. 화면이 붙은 뒤 페이지에서 rehydrate()를 직접 호출한다.
      skipHydration: true,
      version: 2,
      // v1은 대화가 하나(messages)뿐이었다. 쓰던 대화를 잃지 않게 세션 하나로 옮겨 준다.
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as Partial<AssistantState>;
        const legacy = (persisted as { messages?: AskChatMessage[] } | null)?.messages ?? [];
        if (legacy.length === 0) return { sessions: [], activeId: null };
        const createdAtMs = legacy[0]?.createdAtMs ?? Date.now();
        const session: AskChatSession = {
          id: `ask-session-${createdAtMs}`,
          title: titleFromMessages(legacy),
          messages: legacy,
          createdAtMs,
          updatedAtMs: legacy[legacy.length - 1]?.createdAtMs ?? createdAtMs,
        };
        return { sessions: [session], activeId: session.id };
      },
    },
  ),
);
