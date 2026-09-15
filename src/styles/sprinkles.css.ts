import { defineProperties, createSprinkles } from "@vanilla-extract/sprinkles";
import { vars } from "./theme.css";

const responsiveProperties = defineProperties({
  properties: {
    display: ["none", "flex", "block", "inline-flex", "grid"],
    flexDirection: ["row", "column"],
    alignItems: ["flex-start", "center", "flex-end", "stretch"],
    justifyContent: [
      "flex-start",
      "center",
      "flex-end",
      "space-between",
      "space-around",
    ],
    flexWrap: ["wrap", "nowrap"],
    gap: vars.space,
    padding: vars.space,
    paddingTop: vars.space,
    paddingBottom: vars.space,
    paddingLeft: vars.space,
    paddingRight: vars.space,
    margin: vars.space,
    marginTop: vars.space,
    marginBottom: vars.space,
    width: ["100%", "auto"],
    textAlign: ["left", "center", "right"],
  },
});

const colorProperties = defineProperties({
  properties: {
    color: vars.color,
    background: vars.color,
  },
});

export const sprinkles = createSprinkles(responsiveProperties, colorProperties);
export type Sprinkles = Parameters<typeof sprinkles>[0];
