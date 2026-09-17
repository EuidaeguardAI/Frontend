import { createGlobalTheme } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  color: {
    primary: "#2563eb",
    primaryDark: "#1e3a8a",
    primaryLight: "#eff6ff",
    success: "#16a34a",
    successLight: "#ecfdf5",
    danger: "#dc2626",
    dangerLight: "#fef2f2",
    warning: "#d97706",
    warningLight: "#fffbeb",
    // 답변 근거 문장에 긋는 형광펜. 경고(warning)와 섞이지 않게 별도 토큰으로 둔다.
    highlight: "#fef08a",
    highlightLine: "#ca8a04",
    text: "#111827",
    textMuted: "#6b7280",
    textFaint: "#9ca3af",
    border: "#e5e7eb",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
    background: "#f1f5f9",
    white: "#ffffff",
  },
  space: {
    xxs: "4px",
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
    xxl: "32px",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    pill: "999px",
  },
  shadow: {
    card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
    raised: "0 8px 24px rgba(15, 23, 42, 0.10)",
  },
  font: {
    body: "var(--font-noto-sans-kr), -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif",
  },
  fontSize: {
    xs: "12px",
    sm: "13px",
    md: "15px",
    lg: "17px",
    xl: "20px",
    xxl: "24px",
  },
});
