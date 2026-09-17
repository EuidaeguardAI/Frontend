import { create } from "zustand";
import type {
  BusinessProfile,
  ConsultationSession,
  Recommendation,
  SessionIntake,
  TranscriptSegment,
} from "@/lib/types";
import { PROBLEM_TYPE_LABEL } from "@/lib/types";

interface SessionState {
  session: ConsultationSession | null;
  muted: boolean;
  initSession: (profile: BusinessProfile, intake: SessionIntake) => ConsultationSession;
  appendTranscript: (segment: TranscriptSegment) => void;
  /** 잘못 인식된 발화와, 그 발화 때문에 만들어진 추천 답변을 함께 지운다. */
  removeTurn: (segmentIds: string[], recommendationId?: string) => void;
  addRecommendation: (recommendation: Recommendation) => void;
  addAction: (action: string) => void;
  toggleMute: () => void;
  markReported: () => void;
  complete: () => ConsultationSession | null;
  reset: () => void;
}

function buildTitle(intake: SessionIntake): string {
  if (intake.problemTypes.length === 0) return "상담";
  return intake.problemTypes.map((type) => PROBLEM_TYPE_LABEL[type]).join(" · ");
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  session: null,
  muted: false,

  initSession: (profile, intake) => {
    const session: ConsultationSession = {
      id: `session-${Date.now()}`,
      title: buildTitle(intake),
      profile,
      intake,
      startedAtMs: Date.now(),
      transcript: [],
      recommendations: [],
      actionsTaken: [],
      reported: false,
      status: "active",
    };
    set({ session, muted: false });
    return session;
  },

  appendTranscript: (segment) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          transcript: [...state.session.transcript, segment],
        },
      };
    }),

  removeTurn: (segmentIds, recommendationId) =>
    set((state) => {
      if (!state.session) return state;
      const removed = new Set(segmentIds);
      return {
        session: {
          ...state.session,
          transcript: state.session.transcript.filter((segment) => !removed.has(segment.id)),
          recommendations: recommendationId
            ? state.session.recommendations.filter(
                (recommendation) => recommendation.id !== recommendationId,
              )
            : state.session.recommendations,
        },
      };
    }),

  addRecommendation: (recommendation) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          recommendations: [...state.session.recommendations, recommendation],
        },
      };
    }),

  addAction: (action) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          actionsTaken: [...state.session.actionsTaken, action],
        },
      };
    }),

  toggleMute: () => set((state) => ({ muted: !state.muted })),

  markReported: () =>
    set((state) =>
      state.session ? { session: { ...state.session, reported: true } } : state,
    ),

  complete: () => {
    const { session } = get();
    if (!session) return null;
    const completed: ConsultationSession = {
      ...session,
      endedAtMs: Date.now(),
      status: "completed",
    };
    set({ session: completed });
    return completed;
  },

  reset: () => set({ session: null, muted: false }),
}));
