import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const badge = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xxs,
    borderRadius: vars.radius.pill,
    padding: `4px ${vars.space.sm}`,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
  },
  variants: {
    tone: {
      neutral: { background: vars.color.surfaceMuted, color: vars.color.textMuted },
      primary: { background: vars.color.primaryLight, color: vars.color.primary },
      success: { background: vars.color.successLight, color: vars.color.success },
      warning: { background: vars.color.warningLight, color: vars.color.warning },
      danger: { background: vars.color.dangerLight, color: vars.color.danger },
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});
