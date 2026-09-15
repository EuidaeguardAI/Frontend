import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const checklistRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space.xs} 0`,
  fontSize: vars.fontSize.sm,
});

export const confirmTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
});

export const description = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const footerRow = style({
  display: "flex",
  gap: vars.space.sm,
});

export const grow = style({ flex: 1 });

export const successWrap = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space.md,
  textAlign: "center",
});
