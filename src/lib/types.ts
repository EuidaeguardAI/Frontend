// 응대가드 AI 도메인 타입
// 백엔드(STT/LLM/RAG) 연동 시에도 그대로 유지되는 계약(contract) 역할을 한다.
// 기획서 8-3절 출력 스키마(situation/risk_level/say_now/next_action/do_not/citations/confidence/needs_human_review)를 그대로 옮김.

export type RiskLevel = "normal" | "dispute" | "abuse" | "threat" | "emergency";

export const RISK_LABEL: Record<RiskLevel, string> = {
  normal: "일반 문의",
  dispute: "규정 분쟁",
  abuse: "폭언",
  threat: "위협",
  emergency: "긴급",
};

export type TranscriptSource = "user_input" | "stt_raw" | "ai_corrected";

export type Speaker = "customer" | "staff" | "ai";

export interface Citation {
  label: string;
  section?: string;
  url?: string;
  /**
   * 근거 문서 본문에서 그대로 옮긴 문장. 검색된 청크에 실제로 있는 문장인지 서버가 대조한
   * 뒤에만 채워진다(백엔드 app/graph/citations.py). 그래서 이 값이 있으면 화면에서
   * 형광펜으로 강조해 "이 문장이 근거"라고 보여줘도 된다.
   */
  quote?: string;
  /** 색인 당시 분류: manual | law | standard | notice | guide */
  sourceType?: string;
}

export interface TranscriptSegment {
  id: string;
  source: TranscriptSource;
  speaker: Speaker;
  text: string;
  confidence?: number;
  /**
   * 말소리가 아주 짧거나 인식 결과가 짧아 "잘못 들었을 수 있는" 구간.
   * 분석은 그대로 진행하되 대화 창에 흐리게 표시해, 직원이 보고 지울 수 있게 한다.
   */
  lowConfidence?: boolean;
  timestampMs: number;
}

export interface Recommendation {
  id: string;
  situation: RiskLevel;
  riskLevel: number; // 1~5
  confidence: number; // 0~1
  sayNow: string;
  nextActions: string[];
  doNot: string[];
  citations: Citation[];
  needsHumanReview: boolean;
  isFixedSafetyScript: boolean; // true면 생성형이 아닌 고정 안전 절차
  /**
   * 손님이 다음에 할 법한 짧은 답변 후보(예: "상했어요" / "안 상했어요").
   * sayNow·nextActions에 사실 확인이 필요한 내용이 있을 때만 채워지며, 터치 한 번으로
   * 그 답변을 손님 발화처럼 입력해 다음 분석을 이어갈 수 있게 하기 위한 것이다.
   */
  expectedReplies: string[];
  createdAtMs: number;
}

export type ProblemType =
  | "refund_exchange"
  | "damage_contamination"
  | "payment_price"
  | "child_guardian"
  | "store_usage_exit"
  | "staff_complaint"
  | "other";

export const PROBLEM_TYPE_LABEL: Record<ProblemType, string> = {
  refund_exchange: "환불·교환",
  damage_contamination: "파손·오염",
  payment_price: "결제·가격",
  child_guardian: "아동·보호자 항의",
  store_usage_exit: "매장 이용·퇴거 요청",
  staff_complaint: "직원 응대 불만",
  other: "기타·잘 모르겠음",
};

export type BehaviorType =
  | "shouting_abuse"
  | "threat"
  | "throwing_damage"
  | "physical_risk"
  | "repeated_demand"
  | "manager_request"
  | "none";

export const BEHAVIOR_TYPE_LABEL: Record<BehaviorType, string> = {
  shouting_abuse: "고성·욕설",
  threat: "협박",
  throwing_damage: "투척·파손",
  physical_risk: "신체 접촉·폭행 위험",
  repeated_demand: "요구 반복",
  manager_request: "관리자 요구",
  none: "위험 행동 없음",
};

export interface BusinessProfile {
  industry: string;
  industryId: string;
  tasks: string[];
  aiFeatures: string[];
  onboardedAtMs: number;
}

export interface SessionIntake {
  inProgress: boolean;
  micAvailable: boolean;
  problemTypes: ProblemType[];
  behaviorTypes: BehaviorType[];
  priorAction?: string;
  /** '긴급해요' 버튼으로 설문을 생략하고 바로 안전 절차로 들어온 경우 true */
  emergencyDeclared: boolean;
}

export interface ConsultationSession {
  id: string;
  title: string;
  profile: BusinessProfile;
  intake: SessionIntake;
  startedAtMs: number;
  endedAtMs?: number;
  transcript: TranscriptSegment[];
  recommendations: Recommendation[];
  actionsTaken: string[];
  reported: boolean;
  status: "active" | "completed";
}

export interface SessionSummary {
  id: string;
  title: string;
  problemTypes: ProblemType[];
  startedAtMs: number;
  durationMs: number;
  hasAudio: boolean;
  hasTranscript: boolean;
  hasRecommendation: boolean;
}

/**
 * '물어보기' 탭(챗봇)의 답변. Recommendation과 달리 손님 발화가 아니라 직원의 질문에 대한
 * 답이라, 설명 본문(answer)과 손님에게 읽어줄 문장(sayNow)이 분리돼 있다.
 */
export interface AskAnswer {
  id: string;
  situation: RiskLevel;
  answer: string;
  sayNow?: string | null;
  nextActions: string[];
  doNot: string[];
  citations: Citation[];
  needsHumanReview: boolean;
  isFixedSafetyScript: boolean;
  createdAtMs: number;
}

export type AskChatMessage =
  | { id: string; role: "user"; text: string; createdAtMs: number }
  | { id: string; role: "assistant"; answer: AskAnswer; createdAtMs: number };

/** '물어보기' 탭의 대화 한 건. Drawer의 세션 목록에 그대로 올라간다. */
export interface AskChatSession {
  id: string;
  title: string;
  messages: AskChatMessage[];
  createdAtMs: number;
  updatedAtMs: number;
}
