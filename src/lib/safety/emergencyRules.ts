import type { Recommendation, RiskLevel } from "@/lib/types";
import {
  THREAT,
  WEAPON,
  detectCategories,
  matchSevereProfanity,
  matchThreat,
  matchWeapon,
} from "@/lib/safety/abusiveLexicon";

// 반복 폭언/위협 감지 시 생성형 답변 대신 이 고정 절차를 우선 표시한다.
// (기획서 안전 원칙: "긴급 상황은 고정된 안전 절차를 우선 표시한다")
// 키워드 목록은 abusiveLexicon.ts로 분리했다(백엔드 app/safety/abusive_lexicon.py에서 생성).

// 하위 호환용 별칭. 실제 매칭은 abusiveLexicon의 정규화 매칭을 쓴다.
export const THREAT_KEYWORDS = [...THREAT, ...WEAPON];

const ESCALATING_SITUATIONS: RiskLevel[] = ["abuse", "threat"];

export function containsThreatKeyword(text: string): boolean {
  return matchThreat(text).length > 0;
}

export function containsWeaponKeyword(text: string): boolean {
  return matchWeapon(text).length > 0;
}

export function isRepeatedEscalation(recentSituations: RiskLevel[]): boolean {
  const lastTwo = recentSituations.slice(-2);
  return (
    lastTwo.length === 2 &&
    lastTwo.every((situation) => ESCALATING_SITUATIONS.includes(situation))
  );
}

export function shouldTriggerFixedSafety(
  latestText: string,
  recentSituations: RiskLevel[],
): boolean {
  return containsThreatKeyword(latestText) || isRepeatedEscalation(recentSituations);
}

/** 감지된 위험 표현 한 줄 요약. 없으면 빈 문자열. */
export function describeDetectedRisk(text: string): string {
  const categories = Object.entries(detectCategories(text));
  if (categories.length === 0) return "";
  return categories
    .map(([category, words]) => category + "(" + words.slice(0, 5).join(", ") + ")")
    .join(" / ");
}

/** 고정 안전 절차. 흉기·강한 위협이 감지되면 112 신고를 첫 조치로 올린다. */
export function buildFixedSafetyRecommendation(
  latestText = "",
): Omit<Recommendation, "id" | "createdAtMs"> {
  const weaponDetected = containsWeaponKeyword(latestText);
  const severe = weaponDetected || matchSevereProfanity(latestText).length > 0;

  const nextActions = weaponDetected
    ? ["즉시 112 신고", "고객과 거리 확보 후 대피", "응대 중단", "관리자 즉시 호출"]
    : ["고객과 거리 확보", "응대 중단", "관리자 즉시 호출", "위험 시 112 신고"];

  const doNot = ["논쟁하지 않기", "혼자 제지하려 하지 않기"];
  if (severe) doNot.push("등을 보이거나 좁은 공간으로 이동하지 않기");

  return {
    situation: "emergency",
    riskLevel: 5,
    confidence: 0.95,
    sayNow: "지금은 대응하지 않고 거리를 확보하겠습니다.",
    nextActions,
    doNot,
    citations: [
      { label: "산업안전보건법 제41조", section: "건강장해 예방조치", sourceType: "law" },
    ],
    needsHumanReview: true,
    isFixedSafetyScript: true,
    expectedReplies: [],
  };
}
