"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic, ShieldCheck, Siren } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useListeningStore } from "@/lib/store/listeningStore";
import { useProfileStore } from "@/lib/store/profileStore";
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
  const setMicAvailable = useListeningStore((state) => state.setMicAvailable);
  const declareEmergency = useListeningStore((state) => state.declareEmergency);
  const profile = useProfileStore((state) => state.profile);

  // 이 화면이 하는 일은 마이크 권한을 받는 것뿐이다. 상담(세션)은 더 이상 여기서 만들지
  // 않는다 — 상시 녹음으로 바뀌면서 "손님이 말을 시작한 순간"이 상담의 시작이 됐고,
  // 그 판단은 live 화면이 한다.
  const startListening = (micGranted: boolean) => {
    setMicAvailable(micGranted);
    router.push("/session/live");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await hasMicPermission();
      if (cancelled) return;
      if (granted && profile) {
        startListening(true);
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
      // 권한 거부·장치 없음: 녹음 없이 live 화면의 직접 입력 모드로 보낸다.
      startListening(false);
      return;
    }
    rememberMicGranted();
    startListening(true);
  };

  const skipMic = () => startListening(false);

  // 마이크 허용 여부와 무관하게 즉시 고정 안전 절차로 들어간다.
  // live 화면이 마운트되면서 이 플래그를 소비해 안전 절차를 띄운다.
  const startEmergency = () => {
    if (!profile) return;
    declareEmergency();
    setMicAvailable(false);
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
