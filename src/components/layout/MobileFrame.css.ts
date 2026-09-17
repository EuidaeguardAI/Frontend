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
  position: "relative",
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

// variant="fixed" — 본문을 화면 높이에 가두고, 스크롤은 자식이 직접 만들게 한다.
// minHeight: 0이 없으면 flex 자식이 내용 높이 아래로 줄어들지 않아 결국 프레임이 늘어난다.
export const fixedArea = style({
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

export const fixedContent = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  padding: vars.space.md,
  gap: vars.space.sm,
});
