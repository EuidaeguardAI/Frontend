// 문자 bigram 기반 Dice 계수 유사도. 별도 의존성 없이 한국어 STT 노이즈
// (띄어쓰기·조사 미세 차이)에도 안정적으로 동작한다.

function normalize(text: string): string {
  return text.replace(/\s+/g, "").replace(/[.,!?~…·"'"'()[\]]/g, "").toLowerCase();
}

function bigrams(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  if (text.length < 2) {
    if (text.length === 1) counts.set(text, 1);
    return counts;
  }
  for (let i = 0; i < text.length - 1; i += 1) {
    const gram = text.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

/** 두 문자열의 유사도를 0~1 사이 값으로 반환한다 (1에 가까울수록 동일). */
export function textSimilarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const gramsA = bigrams(normA);
  const gramsB = bigrams(normB);
  let overlap = 0;
  for (const [gram, countA] of gramsA) {
    const countB = gramsB.get(gram);
    if (countB) overlap += Math.min(countA, countB);
  }
  const total = normA.length - 1 + (normB.length - 1);
  if (total <= 0) return 0;
  return (2 * overlap) / total;
}
