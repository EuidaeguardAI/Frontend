import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const chip = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xxs,
    borderRadius: vars.radius.pill,
    padding: `8px ${vars.space.md}`,
    fontSize: vars.fontSize.sm,
    fontWeight: 500,
    border: `1px solid ${vars.color.border}`,
    background: vars.color.white,
    color: vars.color.textMuted,
    transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
  },
  variants: {
    selected: {
      true: {
        background: vars.color.primary,
        borderColor: vars.color.primary,
        color: vars.color.white,
      },
    },
  },
});
