"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic, ShieldCheck, Siren } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useIntakeDraftStore } from "@/lib/store/intakeDraftStore";
import { useProfileStore } from "@/lib/store/profileStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { hasMicPermission, rememberMicGranted } from "@/lib/mic/micPermission";
import {
  body,
  centerHeader,
  description,
  emergencyButton,
  footerStack,
  linkRow,
  micCircle,
  noticeRow,
  title,
} from "./page.css";

export default function SessionPreparePage() {
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);
  // 이전 상담에서 이미 허용받은 마이크인지 확인하는 동안에는 버튼 화면을 보여주지 않는다.
  // (허용된 적이 있으면 그대로 녹음 화면으로 넘어가 버리므로, 화면이 잠깐 떴다 사라지는 깜빡임을 막는다)
  const [checkingPermission, setCheckingPermission] = useState(true);
  const setMicAvailable = useIntakeDraftStore((state) => state.setMicAvailable);
  const profile = useProfileStore((state) => state.profile);
  const initSession = useSessionStore((state) => state.initSession);

  // 마이크를 허용하고 시작하는 경로는 "빠른 상황 입력" 화면을 건너뛰고 바로 녹음 화면으로 간다.
  // 녹화 중에는 설문에 답할 시간이 없다는 것이 전제라, 문제 유형·발생 행동·이전 조치는
  // 기본값(빈 값)으로 채운다 — 편의점 식료품 조항 같은 백엔드 고정 인용은 온보딩의 업종
  // 정보만으로도 그대로 동작한다.
  const startRecordingSession = () => {
    if (!profile) return;
    initSession(profile, {
      inProgress: false,
      micAvailable: true,
      problemTypes: [],
      behaviorTypes: [],
      priorAction: undefined,
      emergencyDeclared: false,
    });
    router.push("/session/live");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await hasMicPermission();
      if (cancelled) return;
      if (granted && profile) {
        startRecordingSession();
        return;
      }
      setCheckingPermission(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const requestMicAndStart = async () => {
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      stream?.getTracks().forEach((track) => track.stop());
    } catch {
      // 권한 거부·장치 없음: 녹음 없이 빠른 상황 입력 화면으로 보낸다(기존 수동 입력 경로).
      setMicAvailable(false);
      router.push("/session/intake");
      return;
    }
    rememberMicGranted();
    startRecordingSession();
  };

  const skipMic = () => {
    setMicAvailable(false);
    router.push("/session/intake");
  };

  // 마이크 허용 여부와 무관하게 즉시 고정 안전 절차로 들어간다 — 빠른 상황 입력 화면을
  // 거치지 않게 되면서 그 화면에 있던 "지금 긴급해요" 버튼도 여기로 옮겨 왔다.
  const startEmergency = () => {
    if (!profile) return;
    initSession(profile, {
      inProgress: false,
      micAvailable: false,
      problemTypes: [],
      behaviorTypes: [],
      priorAction: undefined,
      emergencyDeclared: true,
    });
    router.push("/session/live");
  };

  if (checkingPermission) return null;

  return (
    <MobileFrame footer={<BottomNav />}>
      <p className={centerHeader}>상담 시작</p>

      <button type="button" className={emergencyButton} onClick={startEmergency}>
        <Siren size={18} />
        지금 긴급해요 — 설문 없이 바로 시작
      </button>

      <div className={body}>
        <span className={micCircle}>
          <Mic size={48} />
        </span>
        <p className={title}>마이크 사용 권한</p>
        <p className={description}>
          음성 상담을 위해 마이크 권한이 필요합니다.
        </p>
        <span className={noticeRow}>
          <ShieldCheck size={16} />
          음성과 자막이 저장됩니다.
        </span>
        <button
          type="button"
          className={linkRow}
          onClick={() => setShowPrivacy((value) => !value)}
        >
          개인정보 처리 안내
          <ChevronRight size={16} />
        </button>
        {showPrivacy && (
          <Card tone="primary">
            <p className={description}>
              수집 항목은 음성·발화 텍스트로 한정하며, 상담 종료 후 목록에서 언제든 삭제할
              수 있습니다. 실제 개인정보(전화번호·주소 등)는 입력하지 않아도 됩니다.
            </p>
          </Card>
        )}
      </div>

      <div className={footerStack}>
        <Button variant="primary" size="lg" fullWidth onClick={() => void requestMicAndStart()}>
          마이크 허용하고 시작
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={skipMic}>
          나중에
        </Button>
      </div>
    </MobileFrame>
  );
}
