import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const header = style({
  textAlign: "center",
});

export const brand = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 900,
  color: vars.color.primaryDark,
});

export const hero = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.lg,
  textAlign: "center",
});

export const greeting = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 700,
  lineHeight: 1.4,
});

export const micCircleOuter = style({
  width: "160px",
  height: "160px",
  borderRadius: "50%",
  background: vars.color.primaryLight,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const micCircleInner = style({
  width: "104px",
  height: "104px",
  borderRadius: "50%",
  background: vars.color.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.color.white,
  boxShadow: vars.shadow.raised,
});

export const recentHeading = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  color: vars.color.textMuted,
});

export const recentRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space.sm} 0`,
});

export const recentLeft = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
});

export const emptyState = style({
  color: vars.color.textFaint,
  fontSize: vars.fontSize.sm,
  padding: `${vars.space.sm} 0`,
});
