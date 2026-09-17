import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// 마이크를 못 쓸 때 쓰는 직접 입력줄. 예전에는 대화 목록 아래 본문에 있어서 스크롤에 묻혔다.
// 지금은 액션바 바로 위에 고정으로 붙어 항상 같은 자리에 있다.
export const manualBar = style({
  padding: `${vars.space.xs} ${vars.space.md}`,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

export const manualRow = style({
  display: "flex",
  alignItems: "flex-end",
  gap: vars.space.xs,
});

export const manualInput = style({
  flex: 1,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  fontSize: vars.fontSize.sm,
  fontFamily: vars.font.body,
  resize: "none",
  overflow: "hidden",
  maxHeight: "120px",
  lineHeight: 1.4,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
});

export const manualSendButton = style({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  border: "none",
  background: vars.color.primary,
  color: vars.color.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});
