"use client";

import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { consultationClient } from "@/lib/api/consultationClient";
import type { ConsultationSession } from "@/lib/types";
import { vars } from "@/styles/theme.css";
import {
  checklistRow,
  confirmTitle,
  description,
  footerRow,
  grow,
  successWrap,
} from "./ReportPanel.css";

interface ReportPanelProps {
  session: ConsultationSession;
  onCancel: () => void;
  onReported: () => void;
}

export function ReportPanel({ session, onCancel, onReported }: ReportPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const checklist = [
    { label: "원본 음성 저장", checked: session.intake.micAvailable },
    { label: "실시간 자막 저장", checked: session.transcript.length > 0 },
    { label: "AI 추천 답변 저장", checked: session.recommendations.length > 0 },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    await consultationClient.submitReport(session.id);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card tone="success">
        <div className={successWrap}>
          <CheckCircle2 size={40} color={vars.color.success} />
          <p className={confirmTitle}>신고가 접수되었습니다.</p>
          <Button variant="success" fullWidth onClick={onReported}>
            확인
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <SectionTitle>저장된 상담 기록</SectionTitle>
        {checklist.map((item) => (
          <div key={item.label} className={checklistRow}>
            {item.label}
            {item.checked && <Check size={16} color={vars.color.success} />}
          </div>
        ))}
      </Card>

      <Card tone="danger">
        <p className={confirmTitle}>신고하시겠습니까?</p>
        <p className={description}>음성, 자막, 상담 기록이 함께 제출됩니다.</p>
        <div className={footerRow} style={{ marginTop: 12 }}>
          <Button variant="secondary" className={grow} onClick={onCancel} disabled={submitting}>
            취소
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "제출 중..." : "신고하기"}
          </Button>
        </div>
      </Card>
    </>
  );
}
