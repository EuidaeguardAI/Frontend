import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const playerRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
});

export const playButton = style({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: vars.color.primary,
  color: vars.color.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "none",
});

export const track = style({
  flex: 1,
  height: "6px",
  borderRadius: vars.radius.pill,
  background: vars.color.border,
  position: "relative",
  overflow: "hidden",
});

export const trackFill = style({
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  background: vars.color.primary,
});

export const timeLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  minWidth: "88px",
  textAlign: "right",
});

export const tabRow = style({
  display: "flex",
  borderBottom: `1px solid ${vars.color.border}`,
});

export const tabButton = style({
  flex: 1,
  padding: `${vars.space.sm} 0`,
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  color: vars.color.textFaint,
  selectors: {
    "&[data-active='true']": {
      color: vars.color.primary,
      borderBottomColor: vars.color.primary,
    },
  },
});

export const badgeToggleRow = style({
  display: "flex",
  gap: vars.space.sm,
});

export const badgeToggle = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.textFaint,
  selectors: {
    "&[data-active='true']": {
      borderColor: vars.color.success,
      color: vars.color.success,
      background: vars.color.successLight,
    },
  },
});

export const timelineArea = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  overflowY: "auto",
});

export const bubbleRow = style({
  display: "flex",
  gap: vars.space.sm,
  alignItems: "flex-start",
});

export const speakerIcon = style({
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: vars.color.surfaceMuted,
  color: vars.color.textMuted,
});

export const bubbleMeta = style({
  display: "flex",
  gap: vars.space.xs,
  alignItems: "baseline",
});

export const timestamp = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
});

export const summaryRow = style({
  display: "flex",
  justifyContent: "space-between",
  fontSize: vars.fontSize.sm,
  padding: `${vars.space.xs} 0`,
});

export const footerRow = style({
  display: "flex",
  gap: vars.space.sm,
  padding: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});
