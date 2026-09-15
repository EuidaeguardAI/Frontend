import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { vars } from "@/styles/theme.css";

export const nav = style({
  display: "flex",
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  padding: `${vars.space.sm} 0`,
});

export const item = recipe({
  base: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    fontSize: vars.fontSize.xs,
    color: vars.color.textFaint,
  },
  variants: {
    active: {
      true: { color: vars.color.primary, fontWeight: 700 },
    },
  },
});
