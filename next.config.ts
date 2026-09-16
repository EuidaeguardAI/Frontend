import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import packageJson from "./package.json";

const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

// 백엔드(FastAPI)가 다른 호스트/포트에 있으면 BACKEND_ORIGIN으로 덮어쓴다.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

// 설정 화면에 커밋 해시·빌드 시각을 보여줘서, 배포된 게 최신 수정인지 눈으로 확인할 수 있게 한다.
// package.json의 version은 수동으로 올려야 해서 매 수정마다 바뀐다는 보장이 없다 — 커밋 해시가
// 훨씬 믿을 수 있는 신호다. 커밋 정보를 못 구하는 환경(git 없는 배포 아카이브 등)에서는 조용히
// "unknown"으로 빠진다 — 빌드 자체를 막을 이유는 아니다.
function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  // 개발 서버는 기본적으로 localhost가 아닌 오리진의 요청(dev 전용 asset·HMR 등)을 막는다.
  // LAN IP(폰 테스트)와 Cloudflare Quick Tunnel 도메인을 열어줘야 하이드레이션이 정상 동작한다.
  allowedDevOrigins: ["172.30.1.25", "*.trycloudflare.com"],

  // 빌드 시점 값을 클라이언트 번들에 그대로 심는다(공식 방식 — process.env를 직접 건드리는
  // 것보다 webpack/turbopack 양쪽에서 안정적으로 동작한다).
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_COMMIT_HASH: getCommitHash(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // /backend/* 를 FastAPI로 프록시한다. 브라우저에서 보면 동일 오리진 호출이 되므로
  // 폰에서 Cloudflare 터널로 접속할 때 프론트용 터널 하나만 있으면 된다(백엔드 터널 불필요).
  // CORS도 타지 않는다.
  rewrites() {
    return [{ source: "/backend/:path*", destination: `${BACKEND_ORIGIN}/:path*` }];
  },
};

export default withVanillaExtract(nextConfig);
