import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const headerRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const clearButton = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xxs,
  border: "none",
  background: "transparent",
  color: vars.color.textFaint,
  fontSize: vars.fontSize.xs,
  padding: 0,
});

export const feed = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
});

export const emptyWrap = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: vars.space.md,
});

export const emptyTitle = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 700,
  lineHeight: 1.4,
});

export const emptyHint = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const suggestionList = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: vars.space.xs,
});

export const suggestionChip = style({
  textAlign: "left",
  lineHeight: 1.4,
});

export const userRow = style({
  display: "flex",
  justifyContent: "flex-end",
});

export const userBubble = style({
  maxWidth: "80%",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.lg,
  borderTopRightRadius: vars.radius.sm,
  background: vars.color.primary,
  color: vars.color.white,
  fontSize: vars.fontSize.md,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
});

export const answerHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: vars.space.xs,
});

export const answerText = style({
  fontSize: vars.fontSize.md,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
});

export const sayNowBox = style({
  marginTop: vars.space.sm,
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  background: vars.color.white,
  border: `1px solid ${vars.color.border}`,
});

export const sayNowLabel = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontWeight: 600,
  marginBottom: vars.space.xxs,
});

export const sayNowText = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  lineHeight: 1.5,
});

export const speakButton = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xxs,
  border: "none",
  background: "transparent",
  color: vars.color.primary,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  padding: 0,
});

export const blockLabel = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 700,
  color: vars.color.textMuted,
  marginTop: vars.space.sm,
});

export const actionList = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.8,
  paddingLeft: vars.space.md,
  margin: 0,
});

export const doNotList = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.8,
  paddingLeft: vars.space.md,
  margin: 0,
  color: vars.color.danger,
});

export const citationRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.xs,
  marginTop: vars.space.sm,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  cursor: "pointer",
});

export const citationDetail = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

const blink = keyframes({
  "0%, 80%, 100%": { opacity: 0.25 },
  "40%": { opacity: 1 },
});

export const pendingRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const pendingDot = style({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: vars.color.primary,
  animation: `${blink} 1.2s ease-in-out infinite`,
});

export const errorText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
  lineHeight: 1.6,
});

export const composer = style({
  display: "flex",
  alignItems: "flex-end",
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

// 입력창은 다섯 줄까지 따라 늘어나고, 그 이상은 입력창 안에서 스크롤한다.
const COMPOSER_MAX_LINES = 5;
const COMPOSER_LINE_HEIGHT = 1.5;

export const composerInput = style({
  flex: 1,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.xl,
  border: `1px solid ${vars.color.border}`,
  fontSize: vars.fontSize.md,
  fontFamily: vars.font.body,
  minWidth: 0,
  display: "block",
  resize: "none",
  lineHeight: COMPOSER_LINE_HEIGHT,
  // 글자 다섯 줄 + 위아래 여백 + 테두리. box-sizing이 border-box라 전부 더해 준다.
  maxHeight: `calc(${COMPOSER_MAX_LINES} * ${COMPOSER_LINE_HEIGHT} * ${vars.fontSize.md} + 2 * ${vars.space.sm} + 2px)`,
  overflowY: "auto",
});

export const sendButton = style({
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  border: "none",
  background: vars.color.primary,
  color: vars.color.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  selectors: {
    "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
  },
});

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
});

export const sessionTrigger = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.pill,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  color: vars.color.text,
  flexShrink: 0,
});

export const newChatButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: "none",
  background: vars.color.primary,
  color: vars.color.white,
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
});

export const sessionListLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontWeight: 600,
  marginTop: vars.space.sm,
});

export const sessionRow = style({
  display: "flex",
  alignItems: "stretch",
  gap: vars.space.xxs,
});

export const sessionItem = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  textAlign: "left",
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

export const sessionItemActive = style({
  borderColor: vars.color.primary,
  background: vars.color.primaryLight,
});

export const sessionItemTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  color: vars.color.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const sessionItemMeta = style({
  display: "flex",
  gap: vars.space.xs,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
});

export const sessionDeleteButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  color: vars.color.textFaint,
  flexShrink: 0,
});

export const sessionEmptyState = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textAlign: "center",
  padding: vars.space.lg,
});
