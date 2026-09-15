import { recipe } from "@vanilla-extract/recipes";
import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const button = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: vars.space.xs,
    border: "none",
    borderRadius: vars.radius.md,
    fontFamily: vars.font.body,
    fontWeight: 600,
    transition: "transform 0.05s ease, opacity 0.15s ease",
    selectors: {
      "&:active": { transform: "scale(0.98)" },
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
    },
  },
  variants: {
    variant: {
      primary: {
        background: vars.color.primary,
        color: vars.color.white,
      },
      success: {
        background: vars.color.success,
        color: vars.color.white,
      },
      danger: {
        background: vars.color.danger,
        color: vars.color.white,
      },
      secondary: {
        background: vars.color.surfaceMuted,
        color: vars.color.text,
        border: `1px solid ${vars.color.border}`,
      },
      ghost: {
        background: "transparent",
        color: vars.color.textMuted,
        border: `1px solid ${vars.color.border}`,
      },
      outlineDanger: {
        background: vars.color.white,
        color: vars.color.danger,
        border: `1px solid ${vars.color.danger}`,
      },
    },
    size: {
      md: { fontSize: vars.fontSize.md, padding: `12px ${vars.space.lg}` },
      lg: { fontSize: vars.fontSize.lg, padding: `16px ${vars.space.lg}` },
      sm: { fontSize: vars.fontSize.sm, padding: `8px ${vars.space.md}` },
    },
    fullWidth: {
      true: { width: "100%" },
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export const iconOnly = style({
  padding: vars.space.sm,
});
