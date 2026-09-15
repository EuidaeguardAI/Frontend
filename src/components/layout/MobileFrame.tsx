import type { ReactNode } from "react";
import { backdrop, content, frame, scrollArea } from "./MobileFrame.css";

interface MobileFrameProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function MobileFrame({ children, footer }: MobileFrameProps) {
  return (
    <div className={backdrop}>
      <div className={frame}>
        <div className={scrollArea}>
          <div className={content}>{children}</div>
        </div>
        {footer}
      </div>
    </div>
  );
}
