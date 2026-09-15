"use client";

import { useRouter } from "next/navigation";
import { Mic, Clock } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProfileStore } from "@/lib/store/profileStore";
import { useHistoryStore } from "@/lib/store/historyStore";
import { formatDuration, formatRelativeDay } from "@/lib/format";
import {
  brand,
  emptyState,
  greeting,
  header,
  hero,
  micCircleInner,
  micCircleOuter,
  recentHeading,
  recentLeft,
  recentRow,
} from "./page.css";

export default function HomePage() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const sessions = useHistoryStore((state) => state.sessions);
  const recent = sessions[0];

  const handleStart = () => {
    router.push(profile ? "/session/prepare" : "/onboarding");
  };

  return (
    <MobileFrame footer={<BottomNav />}>
      <div className={header}>
        <span className={brand}>AI 음성 상담</span>
      </div>

      <div className={hero}>
        <p className={greeting}>
          안녕하세요.
          <br />
          무엇을 도와드릴까요?
        </p>
        <button
          type="button"
          className={micCircleOuter}
          onClick={handleStart}
          aria-label="상담 시작"
        >
          <span className={micCircleInner}>
            <Mic size={40} />
          </span>
        </button>
        <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
          상담 시작
        </Button>
      </div>

      <Card>
        <p className={recentHeading}>최근 상담</p>
        {recent ? (
          <div
            className={recentRow}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/history/${recent.id}`)}
          >
            <span className={recentLeft}>
              <Clock size={16} />
              {recent.title} · {formatRelativeDay(recent.startedAtMs)}
            </span>
            {recent.endedAtMs && (
              <span>{formatDuration(recent.endedAtMs - recent.startedAtMs)}</span>
            )}
          </div>
        ) : (
          <p className={emptyState}>아직 상담 기록이 없습니다.</p>
        )}
      </Card>
    </MobileFrame>
  );
}
