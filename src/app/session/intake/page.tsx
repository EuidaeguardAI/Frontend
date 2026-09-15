"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Siren } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useProfileStore } from "@/lib/store/profileStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useIntakeDraftStore } from "@/lib/store/intakeDraftStore";
import {
  BEHAVIOR_TYPE_LABEL,
  PROBLEM_TYPE_LABEL,
  type BehaviorType,
  type ProblemType,
} from "@/lib/types";
import { vars } from "@/styles/theme.css";
import {
  chipRow,
  grow,
  helperText,
  skipButton,
  skipRow,
  textInput,
  toggleButton,
  toggleRow,
} from "./page.css";

const PROBLEM_TYPES = Object.keys(PROBLEM_TYPE_LABEL) as ProblemType[];
const BEHAVIOR_TYPES = Object.keys(BEHAVIOR_TYPE_LABEL) as BehaviorType[];

export default function SessionIntakePage() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const micAvailable = useIntakeDraftStore((state) => state.micAvailable);
  const initSession = useSessionStore((state) => state.initSession);

  const [inProgress, setInProgress] = useState(true);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [behaviorTypes, setBehaviorTypes] = useState<BehaviorType[]>([]);
  const [priorAction, setPriorAction] = useState("");

  const toggleBehavior = (value: BehaviorType) => {
    if (value === "none") {
      setBehaviorTypes(["none"]);
      return;
    }
    setBehaviorTypes((prev) => {
      const withoutNone = prev.filter((item) => item !== "none");
      return withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
    });
  };

  const start = (emergencyDeclared: boolean) => {
    if (!profile) return;
    initSession(profile, {
      inProgress: emergencyDeclared ? false : inProgress,
      micAvailable,
      problemTypes: emergencyDeclared ? [] : problemTypes,
      behaviorTypes: emergencyDeclared ? [] : behaviorTypes,
      priorAction: emergencyDeclared ? undefined : priorAction.trim() || undefined,
      emergencyDeclared,
    });
    router.push("/session/live");
  };

  if (!profile) {
    return (
      <MobileFrame>
        <PageHeader title="빠른 상황 입력" />
        <Card tone="warning">
          <p className={helperText}>먼저 업종 설정을 완료해 주세요.</p>
        </Card>
        <Button variant="primary" onClick={() => router.push("/onboarding")}>
          업종 설정으로 이동
        </Button>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <PageHeader title="빠른 상황 입력" />

      {!micAvailable && (
        <Card tone="warning">
          <p className={helperText} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <AlertTriangle size={14} /> 녹음이 없어 입력 내용 기준으로 진행합니다.
          </p>
        </Card>
      )}

      <button
        type="button"
        onClick={() => start(true)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "12px",
          borderRadius: 12,
          border: `1px solid ${vars.color.danger}`,
          background: vars.color.dangerLight,
          color: vars.color.danger,
          fontWeight: 700,
        }}
      >
        <Siren size={18} />
        지금 긴급해요 — 설문 없이 바로 시작
      </button>

      <div>
        <SectionTitle>현재 고객 응대가 진행 중인가요?</SectionTitle>
        <div className={toggleRow}>
          <button
            type="button"
            className={toggleButton}
            data-active={inProgress}
            onClick={() => setInProgress(true)}
          >
            예
          </button>
          <button
            type="button"
            className={toggleButton}
            data-active={!inProgress}
            onClick={() => setInProgress(false)}
          >
            아니요
          </button>
        </div>
        <p className={helperText}>
          {inProgress
            ? "이전 상황을 간단히 입력하면 맥락을 보충합니다."
            : "바로 녹음을 시작합니다."}
        </p>
      </div>

      {inProgress && (
        <>
          <div>
            <SectionTitle>문제 유형 (복수 선택)</SectionTitle>
            <div className={chipRow}>
              {PROBLEM_TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={problemTypes.includes(type)}
                  onClick={() =>
                    setProblemTypes((prev) =>
                      prev.includes(type)
                        ? prev.filter((item) => item !== type)
                        : [...prev, type],
                    )
                  }
                >
                  {PROBLEM_TYPE_LABEL[type]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>발생 행동 (복수 선택)</SectionTitle>
            <div className={chipRow}>
              {BEHAVIOR_TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={behaviorTypes.includes(type)}
                  onClick={() => toggleBehavior(type)}
                >
                  {BEHAVIOR_TYPE_LABEL[type]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>지금까지 어떤 안내나 조치를 했나요?</SectionTitle>
            <input
              className={textInput}
              placeholder="한 문장으로 입력 (선택)"
              value={priorAction}
              onChange={(event) => setPriorAction(event.target.value)}
            />
            <div className={skipRow}>
              <button
                type="button"
                className={skipButton}
                onClick={() => setPriorAction("")}
              >
                건너뛰기
              </button>
            </div>
          </div>
        </>
      )}

      <div className={grow} />
      <Button variant="primary" size="lg" fullWidth onClick={() => start(false)}>
        상담 시작
      </Button>
    </MobileFrame>
  );
}
