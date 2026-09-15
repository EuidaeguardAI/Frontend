import type { HTMLAttributes } from "react";
import type { RecipeVariants } from "@vanilla-extract/recipes";
import { badge } from "./Badge.css";

type BadgeVariants = NonNullable<RecipeVariants<typeof badge>>;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, BadgeVariants {}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={`${badge({ tone })} ${className ?? ""}`} {...props} />;
}
