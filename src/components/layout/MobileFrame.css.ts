import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const backdrop = style({
  minHeight: "100dvh",
  display: "flex",
  justifyContent: "center",
  background: vars.color.background,
  "@media": {
    "screen and (min-width: 560px)": {
      padding: `${vars.space.xxl} ${vars.space.md}`,
    },
  },
});

export const frame = style({
  width: "100%",
  maxWidth: "430px",
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  background: vars.color.surfaceMuted,
  "@media": {
    "screen and (min-width: 560px)": {
      minHeight: "844px",
      maxHeight: "844px",
      borderRadius: vars.radius.xl,
      boxShadow: vars.shadow.raised,
      overflow: "hidden",
    },
  },
});

export const scrollArea = style({
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
});

export const content = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: vars.space.lg,
  gap: vars.space.lg,
});
