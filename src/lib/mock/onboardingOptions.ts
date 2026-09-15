import {
  Store,
  ShoppingCart,
  Coffee,
  Stethoscope,
  GraduationCap,
  Building2,
  Plane,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface IndustryOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const INDUSTRIES: IndustryOption[] = [
  { id: "convenience_store", label: "편의점·마트", icon: Store },
  { id: "online_shopping", label: "온라인 쇼핑몰", icon: ShoppingCart },
  { id: "restaurant_cafe", label: "음식점·카페", icon: Coffee },
  { id: "hospital", label: "병원·의료", icon: Stethoscope },
  { id: "education", label: "교육", icon: GraduationCap },
  { id: "real_estate", label: "부동산", icon: Building2 },
  { id: "lodging_travel", label: "숙박·여행", icon: Plane },
  { id: "professional_service", label: "전문 서비스", icon: Briefcase },
];

export const TASK_OPTIONS = [
  "고객 상담",
  "주문 관리",
  "배송 관리",
  "교환·환불",
  "기타",
];

export const DEFAULT_TASKS = ["고객 상담", "교환·환불"];

export const AI_FEATURE_OPTIONS = [
  "고객 문의 답변 추천",
  "환불 규정 안내",
  "위협성 발언 감지",
  "상담 녹음 및 자막",
];
