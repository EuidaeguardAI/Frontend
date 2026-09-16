import type { ReactNode } from "react";
import { backdrop, content, frame, scrollArea } from "./MobileFrame.css";

interface MobileFrameProps {
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
}

export function MobileFrame({ children, footer, overlay }: MobileFrameProps) {
  return (
    <div className={backdrop}>
      <div className={frame}>
        <div className={scrollArea}>
          <div className={content}>{children}</div>
        </div>
        {footer}
        {overlay}
      </div>
    </div>
  );
}
