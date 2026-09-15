import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "@/styles/global.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "응대가드 AI",
  description: "고객응대근로자를 위한 실시간 응대 코파일럿",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body>{children}</body>
    </html>
  );
}
