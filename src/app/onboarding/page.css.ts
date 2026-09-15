import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const stepLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  fontWeight: 700,
});

export const question = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 700,
  lineHeight: 1.4,
});

export const subText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const searchInput = style({
  width: "100%",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  fontSize: vars.fontSize.md,
  fontFamily: vars.font.body,
});

export const industryGrid = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space.sm,
});

export const industryCard = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.xs,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `2px solid ${vars.color.border}`,
  background: vars.color.white,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
  position: "relative",
  selectors: {
    "&[data-selected='true']": {
      borderColor: vars.color.primary,
      color: vars.color.primaryDark,
      background: vars.color.primaryLight,
    },
  },
});

export const checkDot = style({
  position: "absolute",
  top: "8px",
  right: "8px",
  color: vars.color.primary,
});

export const chipRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.sm,
});

export const checklistRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.sm} 0`,
  fontSize: vars.fontSize.md,
});

export const completeWrap = style({
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

export const summaryTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  lineHeight: 1.5,
});

export const featureList = style({
  width: "100%",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const featureRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: vars.fontSize.sm,
  color: vars.color.text,
});

export const linkButton = style({
  background: "none",
  border: "none",
  color: vars.color.primary,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
});

export const footerRow = style({
  display: "flex",
  gap: vars.space.sm,
});

export const grow = style({ flex: 1 });
