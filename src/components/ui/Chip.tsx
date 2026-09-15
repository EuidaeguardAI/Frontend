import type { ButtonHTMLAttributes } from "react";
import { chip } from "./Chip.css";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      className={`${chip({ selected })} ${className ?? ""}`}
      {...props}
    />
  );
}
