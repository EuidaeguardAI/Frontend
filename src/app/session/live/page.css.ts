import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// 라이브 상담 화면은 위아래 두 패널(대화 / 추천 답변)로 화면을 고정 분할한다.
// 목적은 하나다 — "지금 인식된 손님 말"과 "지금 읽어야 할 답변"이 스크롤 없이 동시에 보일 것.
// 그래서 이 파일의 모든 패널에는 minHeight: 0이 붙는다. flex 자식은 기본적으로 내용보다
// 작아지지 않기 때문에(min-height: auto), 이게 빠지면 패널이 내용만큼 늘어나 화면 전체가
// 다시 길어지고 예전처럼 위아래로 스크롤하게 된다.

/* ── 상단 상태바 ─────────────────────────────────────────── */

export const statusBar = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  flexShrink: 0,
});

export const meter = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "2px",
  height: "22px",
  transition: "opacity 200ms ease",
});

export const meterBar = style({
  flex: 1,
  minWidth: "2px",
  maxWidth: "4px",
  height: "100%",
  borderRadius: vars.radius.pill,
  background: vars.color.primary,
  transformOrigin: "center",
  // 실제 마이크 입력 레벨로 JS가 scaleY를 갱신한다(무음이면 납작하게 눕는다).
  transform: "scaleY(0.1)",
  transition: "transform 90ms linear",
});

export const topRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.xs,
});

/* ── 대화 패널 ──────────────────────────────────────────── */

const transcriptPaneBase = style({
  minHeight: 0,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface,
  boxShadow: vars.shadow.card,
});

// 대화 패널의 세로 비중(추천 답변 패널의 flexGrow는 65 고정). 구분선을 눌러 3단으로 바꾼다.
// 세로가 짧은 기기에서는 비율 대신 고정 높이를 써서 추천 답변이 밀려나지 않게 한다.
export const transcriptPane = styleVariants({
  sm: [
    transcriptPaneBase,
    {
      flex: "22 1 0",
      "@media": { "screen and (max-height: 640px)": { flex: "0 0 72px" } },
    },
  ],
  md: [
    transcriptPaneBase,
    {
      flex: "35 1 0",
      "@media": { "screen and (max-height: 640px)": { flex: "0 0 96px" } },
    },
  ],
  lg: [
    transcriptPaneBase,
    {
      flex: "55 1 0",
      "@media": { "screen and (max-height: 640px)": { flex: "0 0 150px" } },
    },
  ],
});

export const transcriptEmpty = style({
  margin: "auto",
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  textAlign: "center",
  lineHeight: 1.6,
});

export const bubbleRow = style({
  display: "flex",
  gap: vars.space.xs,
  alignItems: "flex-start",
});

export const speakerIcon = style({
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: vars.color.surfaceMuted,
  color: vars.color.textMuted,
});

export const bubbleBody = style({
  flex: 1,
  minWidth: 0,
});

export const bubbleText = style({
  fontSize: vars.fontSize.md,
  lineHeight: 1.45,
  wordBreak: "break-word",
});

// 잘못 들었을 수 있는 구간. 지워도 되는 것이라는 뜻이라 흐리게 두고 점선으로 표시한다.
export const bubbleTextLow = style([
  bubbleText,
  {
    color: vars.color.textMuted,
    borderBottom: `1px dashed ${vars.color.textFaint}`,
    cursor: "pointer",
  },
]);

export const sourceTag = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  marginTop: "1px",
});

export const deleteRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  marginTop: "4px",
});

export const deleteButton = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 10px",
  borderRadius: vars.radius.pill,
  border: `1px solid ${vars.color.danger}`,
  background: vars.color.white,
  color: vars.color.danger,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
});

// 지난 추천 답변은 대화 창에 본문 대신 이 한 줄만 남긴다. 누르면 아래 답변 패널이 그 답변으로 바뀐다.
export const answerMarker = style({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  alignSelf: "flex-start",
  marginLeft: "32px",
  padding: "2px 8px",
  borderRadius: vars.radius.pill,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.surfaceMuted,
  color: vars.color.textMuted,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
});

export const answerMarkerActive = style({
  borderColor: vars.color.primary,
  color: vars.color.primary,
  background: vars.color.primaryLight,
});

export const echoTag = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  color: vars.color.success,
  fontWeight: 600,
});

/* ── 패널 구분선(탭해서 대화 창 크기 전환) ─────────────────── */

export const paneDivider = style({
  flexShrink: 0,
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.xs,
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
});

export const paneHandle = style({
  width: "44px",
  height: "4px",
  borderRadius: vars.radius.pill,
  background: vars.color.textFaint,
});

export const paneHandleLabel = style({
  fontSize: "11px",
  color: vars.color.textFaint,
});

/* ── 추천 답변 패널 ─────────────────────────────────────── */

export const answerPane = style({
  flex: "65 1 0",
  minHeight: 0,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

const answerCardBase = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  borderRadius: vars.radius.lg,
  padding: vars.space.md,
  background: vars.color.surface,
  boxShadow: vars.shadow.card,
});

export const answerCard = styleVariants({
  primary: [answerCardBase, { background: vars.color.primaryLight }],
  warning: [
    answerCardBase,
    { background: vars.color.warningLight, border: `1px solid ${vars.color.warning}33` },
  ],
  danger: [
    answerCardBase,
    { background: vars.color.dangerLight, border: `1px solid ${vars.color.danger}33` },
  ],
});

export const answerEmpty = style({
  margin: "auto",
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  textAlign: "center",
  lineHeight: 1.7,
});

export const backToLatest = style({
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 10px",
  borderRadius: vars.radius.pill,
  border: `1px solid ${vars.color.primary}`,
  background: vars.color.white,
  color: vars.color.primary,
  fontSize: vars.fontSize.xs,
  fontWeight: 700,
});

export const recommendationText = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  lineHeight: 1.5,
});

export const actionList = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.7,
  paddingLeft: vars.space.md,
});

// 다음 행동·근거는 기본으로 접어 둔다. 첫 화면에서 답변 문장과 예상 답변만 보이게 해
// 카드 높이를 낮추는 것이 이 화면의 핵심이다.
export const detailToggle = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.xs,
  width: "100%",
  padding: `${vars.space.xs} 0 0`,
  marginTop: "2px",
  // 위쪽 구분선만 남긴다. border를 지우지 않으면 브라우저 기본 버튼 테두리가 남아
  // 접힘 토글이 select 상자처럼 보인다.
  border: "none",
  borderTop: `1px solid ${vars.color.border}`,
  background: "transparent",
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontWeight: 600,
  cursor: "pointer",
});

export const detailBody = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const disclaimer = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.warning,
  fontWeight: 600,
});

export const echoCheck = style({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.success,
});

export const quickReplyLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  marginTop: "2px",
  marginBottom: "4px",
});

export const quickReplyRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.xs,
});

export const editArea = style({
  width: "100%",
  minHeight: "72px",
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.md,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  padding: vars.space.sm,
  resize: "vertical",
});

/* ── 하단 액션바 ────────────────────────────────────────── */

export const actionBar = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: vars.space.xs,
  padding: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

export const twoColActionBar = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space.sm,
  padding: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.white,
});

export const actionButton = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: `${vars.space.sm} 0`,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.white,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  fontWeight: 600,
});
