import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const notice = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const chipRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs,
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const entryRow = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: vars.space.xs,
});

export const entryMain = style({
  flex: 1,
  minWidth: 0,
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
});

export const entryCategory = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.primary,
  fontWeight: 700,
});

export const entryTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  lineHeight: 1.4,
  wordBreak: "break-word",
});

export const entryBody = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  marginTop: "4px",
});

// 접었을 때 본문 두 줄까지만 보여 준다. 규정이 쌓여도 목록을 훑을 수 있어야 한다.
export const entryBodyClamped = style([
  entryBody,
  {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
]);

export const entryActions = style({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  flexShrink: 0,
});

export const iconButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  color: vars.color.textMuted,
  cursor: "pointer",
});

export const iconButtonDanger = style([
  iconButton,
  { color: vars.color.danger, borderColor: vars.color.danger },
]);

// 꺼 둔 규정은 분석에 보내지 않는다. 지워진 것과 구분되게 흐리게만 둔다.
export const entryDisabled = style({
  opacity: 0.45,
});

export const textInput = style({
  width: "100%",
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.md,
});

export const textArea = style([
  textInput,
  { minHeight: "96px", resize: "vertical", lineHeight: 1.6 },
]);

export const fieldLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontWeight: 600,
  marginBottom: "4px",
  display: "block",
});

export const field = style({
  marginBottom: vars.space.sm,
});

export const formActions = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space.xs,
});

export const emptyState = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  lineHeight: 1.7,
  textAlign: "center",
  padding: `${vars.space.md} 0`,
});

export const counterRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
});
