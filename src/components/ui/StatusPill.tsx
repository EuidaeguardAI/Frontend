import type { ReactNode } from "react";
import { dot, pill } from "./StatusPill.css";

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className={pill}>
      <span className={dot} />
      {children}
    </span>
  );
}
