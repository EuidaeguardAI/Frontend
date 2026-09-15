"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { backButton, header, spacer, titleText } from "./PageHeader.css";

interface PageHeaderProps {
  title: string;
  rightSlot?: ReactNode;
  onBack?: () => void;
}

export function PageHeader({ title, rightSlot, onBack }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={header}>
      <button
        type="button"
        className={backButton}
        onClick={onBack ?? (() => router.back())}
        aria-label="뒤로 가기"
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className={titleText}>{title}</h1>
      {rightSlot ?? <div className={spacer} />}
    </div>
  );
}
