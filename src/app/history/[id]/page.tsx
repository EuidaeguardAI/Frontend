"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Mic, Pause, Play, ShieldAlert, Sparkles, Subtitles, User } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ReportPanel } from "@/components/session/ReportPanel";
import { useHistoryStore } from "@/lib/store/historyStore";
import { formatDuration } from "@/lib/format";
import { PROBLEM_TYPE_LABEL, RISK_LABEL } from "@/lib/types";
import {
  badgeToggle,
  badgeToggleRow,
  bubbleMeta,
  bubbleRow,
  footerRow,
  playButton,
  playerRow,
  speakerIcon,
  summaryRow,
  tabButton,
  tabRow,
  timelineArea,
  timeLabel,
  timestamp,
  track,
  trackFill,
} from "./page.css";

type ToggleKey = "audio" | "captions" | "recommendations";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const session = useHistoryStore((state) =>
    state.sessions.find((item) => item.id === params.id),
  );
  const updateSession = useHistoryStore((state) => state.updateSession);

  const [tab, setTab] = useState<"transcript" | "summary">("transcript");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    audio: true,
    captions: true,
    recommendations: true,
  });
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [reporting, setReporting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = session?.endedAtMs ? session.endedAtMs - session.startedAtMs : 0;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPositionMs((prev) => {
          if (prev >= duration) {
            setPlaying(false);
            return duration;
          }
          return prev + 500;
        });
      }, 500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, duration]);

  const timeline = useMemo(() => {
    if (!session) return [];
    const transcriptItems = session.transcript.map((segment) => ({
      type: "segment" as const,
      timeMs: segment.timestampMs,
      segment,
    }));
    const recommendationItems = session.recommendations.map((recommendation) => ({
      type: "recommendation" as const,
      timeMs: recommendation.createdAtMs,
      recommendation,
    }));
    return [...transcriptItems, ...recommendationItems].sort(
      (a, b) => a.timeMs - b.timeMs,
    );
  }, [session]);

  const filteredTimeline = timeline.filter((item) => {
    if (item.type === "recommendation") return toggles.recommendations;
    if (item.segment.source === "stt_raw") return toggles.audio;
    return toggles.captions;
  });

  if (!session) {
    return (
      <MobileFrame>
        <PageHeader title="상담 기록 상세" />
        <p>기록을 찾을 수 없습니다.</p>
      </MobileFrame>
    );
  }

  const toggleFilter = (key: ToggleKey) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <MobileFrame
      footer={
        reporting ? undefined : (
          <div className={footerRow}>
            <button
              type="button"
              className={badgeToggle}
              style={{ flex: 1 }}
              onClick={() => {
                setPositionMs(0);
                setPlaying(true);
              }}
            >
              다시 듣기
            </button>
            <button
              type="button"
              className={badgeToggle}
              style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626" }}
              onClick={() => setReporting(true)}
            >
              <ShieldAlert size={16} />
              신고하기
            </button>
          </div>
        )
      }
    >
      <PageHeader title="상담 기록 상세" />

      {reporting ? (
        <ReportPanel
          session={session}
          onCancel={() => setReporting(false)}
          onReported={() => {
            updateSession(session.id, { reported: true });
            setReporting(false);
          }}
        />
      ) : (
        <>
          <Card>
            <div className={playerRow}>
              <button
                type="button"
                className={playButton}
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? "일시정지" : "재생"}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div className={track}>
                <div
                  className={trackFill}
                  style={{
                    width: duration
                      ? `${Math.min(100, (positionMs / duration) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
              <span className={timeLabel}>
                {formatDuration(positionMs)} / {formatDuration(duration)} · 1.0x
              </span>
            </div>
          </Card>

          <div className={tabRow}>
            <button
              type="button"
              className={tabButton}
              data-active={tab === "transcript"}
              onClick={() => setTab("transcript")}
            >
              전체 자막
            </button>
            <button
              type="button"
              className={tabButton}
              data-active={tab === "summary"}
              onClick={() => setTab("summary")}
            >
              상담 요약
            </button>
          </div>

          {tab === "transcript" ? (
            <>
              <div className={badgeToggleRow}>
                <button
                  type="button"
                  className={badgeToggle}
                  data-active={toggles.audio}
                  onClick={() => toggleFilter("audio")}
                >
                  <Mic size={18} />
                  원본 음성
                </button>
                <button
                  type="button"
                  className={badgeToggle}
                  data-active={toggles.captions}
                  onClick={() => toggleFilter("captions")}
                >
                  <Subtitles size={18} />
                  실시간 자막
                </button>
                <button
                  type="button"
                  className={badgeToggle}
                  data-active={toggles.recommendations}
                  onClick={() => toggleFilter("recommendations")}
                >
                  <Sparkles size={18} />
                  AI 추천 답변
                </button>
              </div>

              <div className={timelineArea}>
                {filteredTimeline.map((item) =>
                  item.type === "segment" ? (
                    <div key={item.segment.id} className={bubbleRow}>
                      <span className={speakerIcon}>
                        <User size={14} />
                      </span>
                      <div>
                        <div className={bubbleMeta}>
                          <span className={timestamp}>
                            {formatDuration(item.segment.timestampMs)}
                          </span>
                        </div>
                        <p>{item.segment.text}</p>
                      </div>
                    </div>
                  ) : (
                    <Card key={item.recommendation.id} tone="primary">
                      <p className={timestamp}>
                        {formatDuration(item.recommendation.createdAtMs)} · AI 추천
                      </p>
                      <p>{item.recommendation.sayNow}</p>
                    </Card>
                  ),
                )}
              </div>
            </>
          ) : (
            <div>
              <div className={summaryRow}>
                <span>업종</span>
                <span>{session.profile.industry}</span>
              </div>
              <div className={summaryRow}>
                <span>문제 유형</span>
                <span>
                  {session.intake.problemTypes
                    .map((type) => PROBLEM_TYPE_LABEL[type])
                    .join(", ") || "-"}
                </span>
              </div>
              <div className={summaryRow}>
                <span>최고 위험도</span>
                <span>
                  {session.recommendations.length > 0
                    ? RISK_LABEL[
                        session.recommendations[session.recommendations.length - 1]
                          .situation
                      ]
                    : "-"}
                </span>
              </div>
              <div className={summaryRow}>
                <span>취한 조치</span>
                <span>{session.actionsTaken.join(", ") || "-"}</span>
              </div>
              <div className={summaryRow}>
                <span>신고 여부</span>
                <span>{session.reported ? "신고 접수됨" : "없음"}</span>
              </div>
            </div>
          )}
        </>
      )}
    </MobileFrame>
  );
}
