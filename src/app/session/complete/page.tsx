"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSessionStore } from "@/lib/store/sessionStore";
import { formatDuration } from "@/lib/format";
import { vars } from "@/styles/theme.css";
import { footerStack, list, row, successIcon, title, wrap } from "./page.css";

export default function SessionCompletePage() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const resetSession = useSessionStore((state) => state.reset);

  useEffect(() => {
    // 마운트 시점에만 세션 유무를 확인한다. goHome/goToDetail이 세션을 리셋한 뒤
    // 페이지를 떠나는 과정에서 이 effect가 다시 실행되어 router.push와 경합하면 안 되므로
    // session을 의존성에 넣지 않는다.
    if (!useSessionStore.getState().session) router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  const duration = session.endedAtMs
    ? session.endedAtMs - session.startedAtMs
    : 0;

  const items = [
    { label: "상담 시간", value: formatDuration(duration), checked: false },
    { label: "원본 음성 저장", value: null, checked: session.intake.micAvailable },
    { label: "전체 자막 저장", value: null, checked: session.transcript.length > 0 },
    {
      label: "AI 추천 답변 저장",
      value: null,
      checked: session.recommendations.length > 0,
    },
  ];

  const goHome = () => {
    resetSession();
    router.push("/");
  };

  const goToDetail = () => {
    const id = session.id;
    resetSession();
    router.push(`/history/${id}`);
  };

  return (
    <MobileFrame>
      <div className={wrap}>
        <span className={successIcon}>
          <CheckCircle2 size={48} />
        </span>
        <p className={title}>상담 기록이 저장되었습니다.</p>

        <Card style={{ width: "100%" }}>
          <div className={list}>
            {items.map((item) => (
              <div key={item.label} className={row}>
                <span>{item.label}</span>
                {item.value ? (
                  <span>{item.value}</span>
                ) : (
                  item.checked && <Check size={18} color={vars.color.success} />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className={footerStack}>
          <Button variant="primary" size="lg" fullWidth onClick={goToDetail}>
            기록 확인
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={goHome}>
            홈으로
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
}
