"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { backdrop, body, closeButton, header, panel, title as titleStyle } from "./Drawer.css";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <>
      <div
        className={backdrop}
        data-open={open}
        aria-hidden={!open}
        onClick={onClose}
      />
      <div
        className={panel}
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
