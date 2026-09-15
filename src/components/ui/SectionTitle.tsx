import type { ReactNode } from "react";
import { title } from "./SectionTitle.css";

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className={title}>{children}</h3>;
}
