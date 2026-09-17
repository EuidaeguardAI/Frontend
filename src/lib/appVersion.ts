// next.config.ts의 env 블록에서 빌드 시점에 심어 준다. 배포한 게 최신 수정인지 설정 화면에서
// 눈으로 확인하는 용도라, 값이 없어도 화면이 깨지지 않도록 항상 문자열을 반환한다.
export const APP_VERSION = "0.0.1";
export const COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH ?? "unknown";
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;

export function formatBuildTime(): string {
  if (!BUILD_TIME) return "알 수 없음";
  return new Date(BUILD_TIME).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
