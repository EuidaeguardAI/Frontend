import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const topRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const wave = keyframes({
  "0%, 100%": { transform: "scaleY(0.3)" },
  "50%": { transform: "scaleY(1)" },
});

export const waveform = style({
  display: "flex",
  alignItems: "center",
  gap: "3px",
  height: "36px",
  padding: `0 ${vars.space.xs}`,
});

export const waveBar = style({
  flex: 1,
  minWidth: "2px",
  maxWidth: "4px",
  height: "100%",
  borderRadius: vars.radius.pill,
  background: vars.color.primary,
  animation: `${wave} 1s ease-in-out infinite`,
  transformOrigin: "center",
});

export const transcriptArea = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  overflowY: "auto",
  minHeight: "120px",
});

export const bubbleRow = style({
  display: "flex",
  gap: vars.space.sm,
  alignItems: "flex-start",
});

export const speakerIcon = style({
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export const bubbleText = style({
  fontSize: vars.fontSize.md,
  lineHeight: 1.5,
});

export const sourceTag = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  marginTop: "2px",
});

export const recommendationText = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  lineHeight: 1.5,
});

export const citationRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  cursor: "pointer",
});

export const citationDetail = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const disclaimer = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.warning,
  fontWeight: 600,
});

export const actionList = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.8,
  paddingLeft: vars.space.md,
});

export const quickReplyLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  marginTop: vars.space.sm,
  marginBottom: "4px",
});

export const quickReplyRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs,
});

export const actionBar = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: vars.space.xs,
  padding: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

export const twoColActionBar = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space.sm,
  padding: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

export const actionButton = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: `${vars.space.sm} 0`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontWeight: 600,
});

export const editArea = style({
  width: "100%",
  minHeight: "72px",
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.md,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  padding: vars.space.sm,
  resize: "vertical",
});
