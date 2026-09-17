import type { ReactNode } from "react";
import { backdrop, content, fixedArea, fixedContent, frame, scrollArea } from "./MobileFrame.css";

interface MobileFrameProps {
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  /**
   * "scroll"(기본): 본문이 길어지면 화면 전체가 세로로 스크롤된다.
   * "fixed": 본문 영역의 높이를 화면에 맞춰 고정하고 스크롤을 만들지 않는다.
   *   스크롤이 필요한 부분은 자식이 직접 만든다(라이브 상담 화면의 대화/답변 패널).
   *   화면 안에서 항상 보여야 하는 것이 있는 페이지에 쓴다.
   */
  variant?: "scroll" | "fixed";
}

export function MobileFrame({
  children,
  footer,
  overlay,
  variant = "scroll",
}: MobileFrameProps) {
  const isFixed = variant === "fixed";
  return (
    <div className={backdrop}>
      <div className={frame}>
        <div className={isFixed ? fixedArea : scrollArea}>
          <div className={isFixed ? fixedContent : content}>{children}</div>
        </div>
        {footer}
        {overlay}
      </div>
    </div>
  );
}
