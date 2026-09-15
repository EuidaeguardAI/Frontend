"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircleQuestionMark, FileText, Settings } from "lucide-react";
import { item, nav } from "./BottomNav.css";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/assistant", label: "물어보기", icon: MessageCircleQuestionMark },
  { href: "/history", label: "상담 기록", icon: FileText },
  { href: "/settings", label: "설정", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={nav}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={item({ active })}>
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
