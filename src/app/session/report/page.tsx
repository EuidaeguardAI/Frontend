"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportPanel } from "@/components/session/ReportPanel";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useHistoryStore } from "@/lib/store/historyStore";

export default function SessionReportPage() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const markReported = useSessionStore((state) => state.markReported);
  const completeSession = useSessionStore((state) => state.complete);
  const addHistorySession = useHistoryStore((state) => state.addSession);

  useEffect(() => {
    if (!session) router.replace("/");
  }, [session, router]);

  if (!session) return null;

  return (
    <MobileFrame>
      <PageHeader title="신고 접수" />
      <ReportPanel
        session={session}
        onCancel={() => router.back()}
        onReported={() => {
          markReported();
          const completed = completeSession();
          if (completed) addHistorySession(completed);
          router.push("/session/complete");
        }}
      />
    </MobileFrame>
  );
}
