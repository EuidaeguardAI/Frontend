import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConsultationSession } from "@/lib/types";

interface HistoryState {
  sessions: ConsultationSession[];
  addSession: (session: ConsultationSession) => void;
  updateSession: (id: string, patch: Partial<ConsultationSession>) => void;
  removeSession: (id: string) => void;
  getSession: (id: string) => ConsultationSession | undefined;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...patch } : session,
          ),
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        })),
      getSession: (id) => get().sessions.find((session) => session.id === id),
    }),
    { name: "euidaeguard-history" },
  ),
);
