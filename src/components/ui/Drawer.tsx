"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  backdrop,
  body,
  closeButton,
  header,
  panel,
  panelLeft,
  panelRight,
  title as titleStyle,
} from "./Drawer.css";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 어느 쪽에서 밀려 나올지. 기본은 오른쪽(상담 화면의 세션 목록). */
  side?: "left" | "right";
  children: ReactNode;
}

export function Drawer({ open, onClose, title, side = "right", children }: DrawerProps) {
  return (
    <>
      <div
        className={backdrop}
        data-open={open}
        aria-hidden={!open}
        onClick={onClose}
      />
      <div
        className={`${panel} ${side === "left" ? panelLeft : panelRight}`}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className={header}>
          <span className={titleStyle}>{title}</span>
          <button type="button" className={closeButton} aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className={body}>{children}</div>
      </div>
    </>
  );
}
