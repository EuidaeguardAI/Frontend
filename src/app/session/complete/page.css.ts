import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const wrap = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.lg,
  textAlign: "center",
});

export const successIcon = style({
  width: "88px",
  height: "88px",
  borderRadius: "50%",
  background: vars.color.successLight,
  color: vars.color.success,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 700,
});

export const list = style({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const row = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: vars.fontSize.md,
});

export const footerStack = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  width: "100%",
});
