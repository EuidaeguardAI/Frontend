import type {
  AskAnswer,
  BusinessProfile,
  Recommendation,
  RiskLevel,
  SessionIntake,
  Speaker,
} from "@/lib/types";

// 클라이언트(consultationClient)와 서버(API 라우트)가 함께 쓰는 요청/응답 타입.
export interface AnalyzeRequestBody {
  profile: BusinessProfile;
  intake: SessionIntake;
  recentTranscript: { speaker: Speaker; text: string }[];
  recentSituations: RiskLevel[];
  latestText: string;
}

export interface AnalyzeResponseBody {
  recommendation: Recommendation;
}

export interface SttResponseBody {
  text: string;
  /** 서버가 무음 구간의 환각 문구로 보고 걸러냈으면 true (text는 빈 문자열). */
  filtered?: boolean;
}

export interface ReportRequestBody {
  sessionId: string;
}

export interface ReportResponseBody {
  success: boolean;
}

export interface AskRequestBody {
  profile: BusinessProfile | null;
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}

export interface AskResponseBody {
  answer: AskAnswer;
}
