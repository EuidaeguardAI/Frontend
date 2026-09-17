import { create } from "zustand";
import type {
  BusinessProfile,
  ConsultationSession,
  Recommendation,
  RiskLevel,
  SessionIntake,
  TranscriptSegment,
} from "@/lib/types";
import { PROBLEM_TYPE_LABEL } from "@/lib/types";

/**
 * 스트리밍으로 도착 중인 답변. 아직 완성되지 않았으므로 recommendations에는 넣지 않는다 —
 * 넣으면 미완성 문장이 이력에 저장되고 턴 묶음(feed) 계산도 흔들린다.
 */
export interface DraftRecommendation {
  situation: RiskLevel;
  sayNow: string;
}

interface SessionState {
  session: ConsultationSession | null;
  draft: DraftRecommendation | null;
  initSession: (profile: BusinessProfile, intake: SessionIntake) => ConsultationSession;
  appendTranscript: (segment: TranscriptSegment) => void;
  /** 잘못 인식된 발화와, 그 발화 때문에 만들어진 추천 답변을 함께 지운다. */
  removeTurn: (segmentIds: string[], recommendationId?: string) => void;
  addRecommendation: (recommendation: Recommendation) => void;
  addAction: (action: string) => void;
  setDraft: (draft: DraftRecommendation) => void;
  clearDraft: () => void;
  markReported: () => void;
  complete: () => ConsultationSession | null;
  /** 지금 상담을 마감하고 같은 업종으로 새 상담을 연다. 마감된 상담을 돌려준다. */
  startNext: () => ConsultationSession | null;
  reset: () => void;
}

/**
 * 상시 녹음에서는 손님이 말을 시작하는 순간 상담이 만들어진다. 설문에 답할 사람도,
 * 답할 시간도 없으므로 문제 유형·발생 행동은 비워 둔다. 백엔드가 발화에서 문제 유형을
 * 추론하는 안전망(_infer_problem_types)을 이미 갖고 있어 근거 검색은 그대로 동작한다.
 */
export function blankIntake(micAvailable: boolean): SessionIntake {
  return {
    inProgress: false,
    micAvailable,
    problemTypes: [],
    behaviorTypes: [],
    priorAction: undefined,
    emergencyDeclared: false,
  };
}

function buildTitle(intake: SessionIntake): string {
  if (intake.problemTypes.length === 0) return "상담";
  return intake.problemTypes.map((type) => PROBLEM_TYPE_LABEL[type]).join(" · ");
}

function createSession(
  profile: BusinessProfile,
  intake: SessionIntake,
): ConsultationSession {
  return {
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
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  session: null,
  draft: null,

  initSession: (profile, intake) => {
    const session = createSession(profile, intake);
    set({ session, draft: null });
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
        // 완성본이 들어왔으므로 스트리밍 초안은 역할을 다했다.
        draft: null,
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

  setDraft: (draft) => set({ draft }),

  clearDraft: () => set({ draft: null }),

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
    set({ session: completed, draft: null });
    return completed;
  },

  /**
   * "다음 고객" — 마이크를 건드리지 않은 채 상담 경계만 새로 긋는다.
   * 마감과 새 상담 생성을 한 번의 set으로 처리해, 그 사이에 들어온 발화가 어느 쪽에도
   * 속하지 못하고 사라지는 틈을 만들지 않는다.
   */
  startNext: () => {
    const { session } = get();
    if (!session) return null;
    const completed: ConsultationSession = {
      ...session,
      endedAtMs: Date.now(),
      status: "completed",
    };
    set({
      session: createSession(session.profile, blankIntake(session.intake.micAvailable)),
      draft: null,
    });
    return completed;
  },

  reset: () => set({ session: null, draft: null }),
}));
