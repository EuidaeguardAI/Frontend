import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const backdrop = style({
  position: "absolute",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  opacity: 0,
  visibility: "hidden",
  transition: "opacity 0.2s ease, visibility 0.2s ease",
  zIndex: 40,
  selectors: {
    '&[data-open="true"]': {
      opacity: 1,
      visibility: "visible",
    },
  },
});

export const panel = style({
  position: "absolute",
  top: 0,
  right: 0,
  height: "100%",
  width: "82%",
  maxWidth: "320px",
  background: vars.color.surface,
  boxShadow: vars.shadow.raised,
  display: "flex",
  flexDirection: "column",
  transform: "translateX(100%)",
  transition: "transform 0.25s ease",
  zIndex: 41,
  selectors: {
    '&[data-open="true"]': {
      transform: "translateX(0)",
    },
  },
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
  flexShrink: 0,
});

export const title = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  color: vars.color.text,
});

export const closeButton = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.pill,
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  flexShrink: 0,
});

export const body = style({
  flex: 1,
  overflowY: "auto",
  padding: vars.space.md,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});
