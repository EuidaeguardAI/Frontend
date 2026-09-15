import { style } from "@vanilla-extract/css";
import { keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const pulse = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.35 },
});

export const pill = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  borderRadius: vars.radius.pill,
  padding: `6px ${vars.space.md}`,
  background: vars.color.primaryLight,
  color: vars.color.primary,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
});

export const dot = style({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: vars.color.primary,
  animation: `${pulse} 1.4s ease-in-out infinite`,
});
