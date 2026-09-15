import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const centerHeader = style({
  textAlign: "center",
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
});

export const body = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.lg,
  textAlign: "center",
});

export const micCircle = style({
  width: "128px",
  height: "128px",
  borderRadius: "50%",
  background: vars.color.primaryLight,
  color: vars.color.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 700,
});

export const description = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const noticeRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  color: vars.color.success,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
});

export const linkRow = style({
  display: "flex",
  alignItems: "center",
  gap: "2px",
  color: vars.color.primary,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  background: "none",
  border: "none",
});

export const footerStack = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

export const emergencyButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.xs,
  width: "100%",
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.danger}`,
  background: vars.color.dangerLight,
  color: vars.color.danger,
  fontWeight: 700,
});
