import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AskChatMessage } from "@/lib/types";

// 대화가 길어져도 localStorage를 무한정 채우지 않도록 최근 분량만 남긴다.
// 백엔드로 보내는 맥락도 어차피 최근 6턴이라 이보다 더 들고 있을 이유가 없다.
const MAX_MESSAGES = 40;

interface AssistantState {
  messages: AskChatMessage[];
  append: (message: AskChatMessage) => void;
  clear: () => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      messages: [],
      append: (message) =>
        set((state) => ({
          messages: [...state.messages, message].slice(-MAX_MESSAGES),
        })),
      clear: () => set({ messages: [] }),
    }),
    {
      name: "euidaeguard-assistant",
      // 저장된 대화를 첫 렌더에 바로 꺼내 쓰면 서버가 그린 빈 화면과 어긋나 하이드레이션
      // 오류가 난다. 화면이 붙은 뒤 페이지에서 rehydrate()를 직접 호출한다.
      skipHydration: true,
    },
  ),
);
