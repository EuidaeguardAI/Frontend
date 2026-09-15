import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("html, body", {
  margin: 0,
  padding: 0,
  fontFamily: vars.font.body,
  color: vars.color.text,
  background: vars.color.background,
  WebkitFontSmoothing: "antialiased",
});

globalStyle("body", {
  minHeight: "100dvh",
});

globalStyle("button", {
  fontFamily: "inherit",
  cursor: "pointer",
});

globalStyle("h1, h2, h3, p", {
  margin: 0,
});

globalStyle("a", {
  color: "inherit",
  textDecoration: "none",
});
