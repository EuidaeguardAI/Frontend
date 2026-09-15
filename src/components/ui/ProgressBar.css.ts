import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const track = style({
  width: "100%",
  height: "6px",
  borderRadius: vars.radius.pill,
  background: vars.color.border,
  overflow: "hidden",
});

export const fill = style({
  height: "100%",
  borderRadius: vars.radius.pill,
  background: vars.color.primary,
  transition: "width 0.25s ease",
});
