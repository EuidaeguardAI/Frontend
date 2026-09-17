// 음성 인식 결과를 손님 발화로 받아들이기 전에 거르는 규칙.
// 백엔드(app/stt_filters.py)에서 환각 문구 사전으로 한 번 걸러서 오지만, 사전에 없는 형태와
// "같은 문장이 청크마다 반복되는" 환각 루프는 앞뒤 맥락을 아는 프론트에서만 잡을 수 있다.

import { textSimilarity } from "@/lib/text/similarity";

/** 직전 인식 결과와 사실상 같은 문장이면 환각 루프로 본다. */
const REPEAT_SIMILARITY_THRESHOLD = 0.92;

/** 내용이 없는 인식 결과(구두점만, 한두 글자)인지. */
export function isMeaninglessTranscript(text: string): boolean {
  const stripped = text.replace(/[\s.,!?~…·"'"'()[\]\-]/g, "");
  return stripped.length <= 2;
}

/**
 * 직전 청크와 같은 문장이 또 나왔는지. 무음이 이어질 때 모델이 같은 환각을 계속 뱉는 패턴이라,
 * 인식(stt_raw)으로 들어온 직전 결과와만 비교한다. 손님이 진짜로 같은 말을 반복하는 경우도 있지만
 * 그 내용은 이미 한 번 분석돼 답변이 나가 있으므로, 버려도 잃는 것이 없다.
 */
export function isRepeatOfPrevious(text: string, previousSttText: string | null): boolean {
  if (!previousSttText) return false;
  return textSimilarity(text, previousSttText) >= REPEAT_SIMILARITY_THRESHOLD;
}
