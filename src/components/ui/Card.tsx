import type { HTMLAttributes } from "react";
import type { RecipeVariants } from "@vanilla-extract/recipes";
import { card } from "./Card.css";

type CardVariants = NonNullable<RecipeVariants<typeof card>>;

interface CardProps extends HTMLAttributes<HTMLDivElement>, CardVariants {}

export function Card({ tone, className, ...props }: CardProps) {
  return <div className={`${card({ tone })} ${className ?? ""}`} {...props} />;
}
