"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Search } from "lucide-react";
import { vars } from "@/styles/theme.css";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProfileStore } from "@/lib/store/profileStore";
import {
  AI_FEATURE_OPTIONS,
  DEFAULT_TASKS,
  INDUSTRIES,
  TASK_OPTIONS,
} from "@/lib/mock/onboardingOptions";
import {
  checklistRow,
  checkDot,
  chipRow,
  completeWrap,
  featureList,
  featureRow,
  footerRow,
  grow,
  industryCard,
  industryGrid,
  linkButton,
  question,
  searchInput,
  stepLabel,
  subText,
  successIcon,
  summaryTitle,
} from "./page.css";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useProfileStore((state) => state.setProfile);

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id);
  const [tasks, setTasks] = useState<string[]>(DEFAULT_TASKS);
  const [aiFeatures, setAiFeatures] = useState<string[]>(AI_FEATURE_OPTIONS);

  const filteredIndustries = useMemo(
    () =>
      INDUSTRIES.filter((industry) =>
        industry.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const industry = INDUSTRIES.find((item) => item.id === industryId)!;

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  };

  const handleComplete = () => {
    setProfile({
      industry: industry.label,
      industryId: industry.id,
      tasks,
      aiFeatures,
      onboardedAtMs: Date.now(),
    });
  };

  return (
    <MobileFrame>
      <PageHeader
        title="서비스 맞춤 설정"
        onBack={() => (step === 1 ? router.push("/") : setStep(step - 1))}
        rightSlot={<span className={stepLabel}>{step} / {TOTAL_STEPS}</span>}
      />
      <ProgressBar value={step / TOTAL_STEPS} />

      {step === 1 && (
        <>
          <p className={question}>어느 업종에 종사하고 계신가요?</p>
          <p className={subText}>가장 가까운 업종 하나를 선택해 주세요.</p>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 12, top: 12, opacity: 0.5 }}
            />
            <input
              className={searchInput}
              style={{ paddingLeft: 36 }}
              placeholder="업종 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={industryGrid}>
            {filteredIndustries.map(({ id, label, icon: Icon }) => {
              const selected = id === industryId;
              return (
                <button
                  key={id}
                  type="button"
                  className={industryCard}
                  data-selected={selected}
                  onClick={() => setIndustryId(id)}
                >
                  {selected && <Check size={16} className={checkDot} />}
                  <Icon size={26} />
                  {label}
                </button>
              );
            })}
          </div>
          <div className={grow} />
          <Button variant="primary" size="lg" fullWidth onClick={() => setStep(2)}>
            다음
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <Chip selected>{industry.label}</Chip>
          <p className={question}>1. 주로 어떤 업무를 담당하시나요?</p>
          <div className={chipRow}>
            {TASK_OPTIONS.map((task) => (
              <Chip
                key={task}
                selected={tasks.includes(task)}
                onClick={() => toggle(tasks, setTasks, task)}
              >
                {task}
              </Chip>
            ))}
          </div>

          <p className={question}>2. AI가 도와줄 업무를 선택해 주세요.</p>
          <div>
            {AI_FEATURE_OPTIONS.map((feature) => {
              const checked = aiFeatures.includes(feature);
              return (
                <label key={feature} className={checklistRow}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(aiFeatures, setAiFeatures, feature)}
                  />
                  {feature}
                </label>
              );
            })}
          </div>

          <div className={grow} />
          <div className={footerRow}>
            <Button variant="secondary" onClick={() => setStep(1)}>
              이전
            </Button>
            <Button
              variant="primary"
              className={grow}
              onClick={() => setStep(3)}
              disabled={tasks.length === 0}
            >
              다음
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className={completeWrap}>
          <span className={successIcon}>
            <CheckCircle2 size={48} />
          </span>
          <p className={summaryTitle}>
            {industry.label} 상담 설정이
            <br />
            완료되었습니다.
          </p>
          <div className={featureList}>
            <p className={stepLabel}>적용된 AI 기능</p>
            {aiFeatures.map((feature) => (
              <div key={feature} className={featureRow}>
                {feature}
                <Check size={16} color={vars.color.success} />
              </div>
            ))}
          </div>
          <button
            type="button"
            className={linkButton}
            onClick={() => setStep(1)}
          >
            설정 변경
          </button>
          <div className={grow} />
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={() => {
              handleComplete();
              router.push("/session/prepare");
            }}
          >
            AI 상담 시작하기
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {
              handleComplete();
              router.push("/");
            }}
          >
            홈으로
          </Button>
        </div>
      )}
    </MobileFrame>
  );
}
