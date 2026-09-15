import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const sectionTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
});

export const helperText = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
});

export const chipRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.sm,
});

export const toggleRow = style({
  display: "flex",
  gap: vars.space.sm,
});

export const toggleButton = style({
  flex: 1,
  padding: `${vars.space.md} 0`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  fontWeight: 700,
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
  selectors: {
    "&[data-active='true']": {
      background: vars.color.primary,
      borderColor: vars.color.primary,
      color: vars.color.white,
    },
  },
});

export const textInput = style({
  width: "100%",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  fontSize: vars.fontSize.md,
  fontFamily: vars.font.body,
});

export const skipRow = style({
  display: "flex",
  justifyContent: "flex-end",
});

export const skipButton = style({
  background: "none",
  border: "none",
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  textDecoration: "underline",
});

export const grow = style({ flex: 1 });
