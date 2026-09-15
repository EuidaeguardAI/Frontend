import type {
  AnalyzeRequestBody,
  AnalyzeResponseBody,
  AskRequestBody,
  AskResponseBody,
  ReportRequestBody,
  ReportResponseBody,
  SttResponseBody,
} from "@/lib/api/schemas";
import type { AskAnswer, Recommendation } from "@/lib/types";

/**
 * Python 백엔드(FastAPI + LangChain/LangGraph, euidaeguard-backend/)를 직접 호출하는 클라이언트.
 * 브라우저가 이 서버로 바로 fetch하므로 백엔드가 CORS를 열어줘야 한다.
 *
 * NEXT_PUBLIC_API_BASE_URL이 설정돼 있으면 그 값을 그대로 쓰고, 없으면 지금 이 페이지를 연 주소의
 * 호스트를 그대로 재사용한다(포트만 8000으로). PC에서 localhost:3000으로 열면 localhost:8000을,
 * 휴대폰에서 http://192.168.x.x:3000처럼 LAN IP로 열면 같은 IP의 8000번을 자동으로 가리키게 되어,
 * IP를 하드코딩하지 않아도 같은 컴퓨터에서 실행 중인 백엔드를 찾아간다.
 */
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export interface ConsultationClient {
  transcribeChunk: (audioBlob: Blob) => Promise<string>;
  analyze: (params: AnalyzeRequestBody) => Promise<Recommendation>;
  ask: (params: AskRequestBody) => Promise<AskAnswer>;
  submitReport: (sessionId: string) => Promise<{ success: boolean }>;
}

async function parseJsonOrThrow<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? body?.error ?? errorMessage);
  }
  return response.json() as Promise<T>;
}

const realConsultationClient: ConsultationClient = {
  async transcribeChunk(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "chunk.webm");
    const response = await fetch(`${getApiBaseUrl()}/stt`, {
      method: "POST",
      body: formData,
    });
    const data = await parseJsonOrThrow<SttResponseBody>(response, "음성 인식에 실패했습니다.");
    return data.text;
  },

  async analyze(params) {
    const response = await fetch(`${getApiBaseUrl()}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await parseJsonOrThrow<AnalyzeResponseBody>(
      response,
      "분석에 실패했습니다.",
    );
    return data.recommendation;
  },

  async ask(params) {
    const response = await fetch(`${getApiBaseUrl()}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await parseJsonOrThrow<AskResponseBody>(
      response,
      "답변을 가져오지 못했습니다.",
    );
    return data.answer;
  },

  async submitReport(sessionId) {
    const response = await fetch(`${getApiBaseUrl()}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId } satisfies ReportRequestBody),
    });
    return parseJsonOrThrow<ReportResponseBody>(response, "신고 접수에 실패했습니다.");
  },
};

export const consultationClient: ConsultationClient = realConsultationClient;
