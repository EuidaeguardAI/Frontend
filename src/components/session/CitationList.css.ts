import { style } from "@vanilla-extract/css";

import { vars } from "@/styles/theme.css";

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const item = style({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: vars.space.xs,
  borderRadius: vars.radius.sm,
  // 카드 안의 다른 블록과 구분되게 아주 옅은 바탕만 깐다. 강조는 형광펜이 맡는다.
  background: vars.color.surfaceMuted,
  border: `1px solid ${vars.color.border}`,
});

export const sourceRow = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "6px",
  fontSize: vars.fontSize.xs,
  lineHeight: 1.5,
});

export const kindBadge = style({
  flexShrink: 0,
  padding: "1px 6px",
  borderRadius: vars.radius.pill,
  background: vars.color.highlight,
  color: "#713f12",
  fontSize: "11px",
  fontWeight: 700,
});

export const sourceTitle = style({
  color: vars.color.text,
  fontWeight: 600,
});

export const sourceSection = style({
  color: vars.color.textMuted,
});

export const quoteText = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.7,
  color: vars.color.text,
});

/**
 * 형광펜 효과. 배경을 통째로 칠하면 글자가 묻혀서, 아래쪽 45%만 칠하고 밑줄을 덧그린다.
 * 브라우저 기본 mark 스타일(노란 배경 + 검은 글자)을 덮어쓰기 위해 background를 다시 지정한다.
 */
export const highlight = style({
  background: `linear-gradient(transparent 55%, ${vars.color.highlight} 55%)`,
  borderBottom: `2px solid ${vars.color.highlightLine}`,
  color: vars.color.text,
  padding: "0 1px",
  // 줄바꿈될 때 밑줄이 각 줄에 이어지도록.
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
});

export const caption = style({
  fontSize: "11px",
  color: vars.color.textMuted,
  lineHeight: 1.5,
});

export const note = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});
