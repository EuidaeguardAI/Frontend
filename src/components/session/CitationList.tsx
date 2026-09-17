import type { Citation } from "@/lib/types";

import {
  caption,
  disclosure,
  disclosureSummary,
  highlight,
  item,
  kindBadge,
  list,
  note as noteStyle,
  quoteText,
  sourceRow,
  sourceSection,
  sourceTitle,
} from "./CitationList.css";

/**
 * 답변 근거를 "어느 문서의 어느 문장"까지 보여주는 블록.
 * '물어보기'(assistant)와 '녹음'(session/live) 두 화면이 같은 모양을 쓰도록 공용 컴포넌트로 둔다.
 *
 * quote는 백엔드가 검색된 원문 청크와 대조해 실제로 존재하는 문장만 채워 보낸다
 * (euidaeguard-backend/app/graph/citations.py). 그래서 형광펜으로 강조해도 되는 값이고,
 * 비어 있으면 강조하지 않고 문서만 표시한다 - 지어낸 문장을 근거처럼 보여주지 않기 위해서다.
 */

const SOURCE_TYPE_LABEL: Record<string, string> = {
  manual: "응대 매뉴얼",
  law: "법령 가이드",
  standard: "공식 고시",
  notice: "공식 고시",
  guide: "공공기관 가이드",
};

function kindOf(citation: Citation): string {
  return SOURCE_TYPE_LABEL[citation.sourceType ?? ""] ?? "참고 자료";
}

/** 접힌 상태의 한 줄 요약. 예: "응대 매뉴얼 외 1건" */
export function citationSummary(citations: Citation[]): string {
  if (citations.length === 0) return "";
  const head = kindOf(citations[0]);
  return citations.length > 1 ? `${head} 외 ${citations.length - 1}건` : head;
}

export function CitationList({
  citations,
  note,
  collapsibleQuotes = false,
}: {
  citations: Citation[];
  note?: string;
  collapsibleQuotes?: boolean;
}) {
  return (
    <div className={list}>
      {citations.map((citation, index) => (
        <div key={`${citation.label}-${citation.section ?? ""}-${index}`} className={item}>
          <p className={sourceRow}>
            <span className={kindBadge}>{kindOf(citation)}</span>
            <span className={sourceTitle}>{citation.label}</span>
            {citation.section && (
              <span className={sourceSection}>· {citation.section}</span>
            )}
          </p>
          {citation.quote && collapsibleQuotes ? (
            <details className={disclosure}>
              <summary className={disclosureSummary}>근거 문장 보기</summary>
              <p className={quoteText}>
                <mark className={highlight}>{citation.quote}</mark>
              </p>
              <p className={caption}>이 문장을 근거로 위와 같이 안내했습니다.</p>
            </details>
          ) : citation.quote ? (
            <>
              <p className={quoteText}>
                <mark className={highlight}>{citation.quote}</mark>
              </p>
              <p className={caption}>이 문장을 근거로 위와 같이 안내했습니다.</p>
            </>
          ) : (
            <p className={caption}>
              이 문서를 참고했습니다. 원문 문장은 직접 확인하세요.
            </p>
          )}
        </div>
      ))}
      {note && <p className={noteStyle}>{note}</p>}
    </div>
  );
}
