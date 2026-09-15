import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
});

export const backButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: vars.radius.md,
  border: "none",
  background: "transparent",
  color: vars.color.text,
});

export const titleText = style({
  flex: 1,
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  textAlign: "center",
});

export const spacer = style({
  width: "36px",
  height: "36px",
  flexShrink: 0,
});
