"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Search, Trash2 } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { useHistoryStore } from "@/lib/store/historyStore";
import { formatDuration, formatRelativeDay } from "@/lib/format";
import { PROBLEM_TYPE_LABEL } from "@/lib/types";
import {
  chipRow,
  deleteButton,
  emptyState,
  itemBody,
  itemMeta,
  itemRow,
  itemTitle,
  list,
  playCircle,
  searchInput,
} from "./page.css";

export default function HistoryPage() {
  const router = useRouter();
  const sessions = useHistoryStore((state) => state.sessions);
  const removeSession = useHistoryStore((state) => state.removeSession);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("전체");

  const filterOptions = useMemo(() => {
    const labels = new Set<string>();
    sessions.forEach((session) =>
      session.intake.problemTypes.forEach((type) =>
        labels.add(PROBLEM_TYPE_LABEL[type]),
      ),
    );
    return ["전체", ...Array.from(labels)];
  }, [sessions]);

  const filtered = sessions.filter((session) => {
    const matchesQuery = session.title.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === "전체" ||
      session.intake.problemTypes.some(
        (type) => PROBLEM_TYPE_LABEL[type] === filter,
      );
    return matchesQuery && matchesFilter;
  });

  return (
    <MobileFrame footer={<BottomNav />}>
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 12, opacity: 0.5 }} />
        <input
          className={searchInput}
          style={{ paddingLeft: 36 }}
          placeholder="상담 기록 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={chipRow}>
        {filterOptions.map((option) => (
          <Chip
            key={option}
            selected={filter === option}
            onClick={() => setFilter(option)}
          >
            {option}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={emptyState}>상담 기록이 없습니다.</p>
      ) : (
        <div className={list}>
          {filtered.map((session) => (
            <Card key={session.id} className={itemRow}>
              <span className={playCircle}>
                <Play size={16} />
              </span>
              <button
                type="button"
                className={itemBody}
                style={{ textAlign: "left", background: "none", border: "none", padding: 0 }}
                onClick={() => router.push(`/history/${session.id}`)}
              >
                <p className={itemTitle}>{session.title}</p>
                <p className={itemMeta}>
                  <span>{formatRelativeDay(session.startedAtMs)}</span>
                  {session.endedAtMs && (
                    <span>
                      {formatDuration(session.endedAtMs - session.startedAtMs)}
                    </span>
                  )}
                  <span>음성·자막 저장</span>
                </p>
              </button>
              <button
                type="button"
                className={deleteButton}
                aria-label="삭제"
                onClick={() => {
                  if (window.confirm("이 상담 기록을 삭제할까요?")) {
                    removeSession(session.id);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </MobileFrame>
  );
}
