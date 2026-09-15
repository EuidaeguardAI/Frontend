import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const searchInput = style({
  width: "100%",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  fontSize: vars.fontSize.md,
  fontFamily: vars.font.body,
});

export const chipRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.sm,
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

export const itemRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
});

export const playCircle = style({
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: vars.color.primaryLight,
  color: vars.color.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export const itemBody = style({
  flex: 1,
  minWidth: 0,
});

export const itemTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
});

export const itemMeta = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  display: "flex",
  gap: vars.space.xs,
  marginTop: "2px",
});

export const deleteButton = style({
  border: "none",
  background: "none",
  color: vars.color.textFaint,
  padding: vars.space.xs,
});

export const emptyState = style({
  textAlign: "center",
  color: vars.color.textFaint,
  fontSize: vars.fontSize.sm,
  padding: vars.space.xxl,
});
