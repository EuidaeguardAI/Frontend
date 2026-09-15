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
