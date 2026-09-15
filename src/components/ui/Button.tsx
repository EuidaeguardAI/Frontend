import type { ButtonHTMLAttributes } from "react";
import type { RecipeVariants } from "@vanilla-extract/recipes";
import { button } from "./Button.css";

type ButtonVariants = NonNullable<RecipeVariants<typeof button>>;

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${button({ variant, size, fullWidth })} ${className ?? ""}`}
      {...props}
    />
  );
}
