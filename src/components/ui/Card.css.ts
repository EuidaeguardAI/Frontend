import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const card = recipe({
  base: {
    borderRadius: vars.radius.lg,
    background: vars.color.surface,
    boxShadow: vars.shadow.card,
    padding: vars.space.lg,
  },
  variants: {
    tone: {
      neutral: {},
      primary: { background: vars.color.primaryLight },
      success: { background: vars.color.successLight },
      danger: {
        background: vars.color.dangerLight,
        border: `1px solid ${vars.color.danger}33`,
      },
      warning: {
        background: vars.color.warningLight,
        border: `1px solid ${vars.color.warning}33`,
      },
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});
