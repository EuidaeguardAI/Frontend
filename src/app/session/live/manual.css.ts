import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const manualRow = style({
  display: "flex",
  gap: vars.space.xs,
  marginTop: vars.space.sm,
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
