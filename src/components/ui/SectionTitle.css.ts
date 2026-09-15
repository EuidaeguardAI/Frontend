import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const title = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  color: vars.color.textMuted,
  marginBottom: vars.space.sm,
  display: "flex",
  alignItems: "center",
  gap: vars.space.xxs,
});
