"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Shield, Store } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useProfileStore } from "@/lib/store/profileStore";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);

  return (
    <MobileFrame footer={<BottomNav />}>
      <SectionTitle>설정</SectionTitle>

      <Card
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => router.push("/onboarding")}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Store size={18} />
          업종 재설정 {profile ? `· ${profile.industry}` : ""}
        </span>
        <ChevronRight size={16} />
      </Card>

      <Card>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <Shield size={18} />
          개인정보 처리 안내
        </span>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
          응대가드 AI는 음성·자막을 상담 목적에 한해서만 사용하며, 사용자는 상담 기록
          목록에서 언제든지 삭제할 수 있습니다. 이 화면의 데이터는 이 기기의 브라우저에만
          저장됩니다.
        </p>
      </Card>
    </MobileFrame>
  );
}
