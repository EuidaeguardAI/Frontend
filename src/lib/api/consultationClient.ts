import type {
  AnalyzeRequestBody,
  AnalyzeResponseBody,
  AnalyzeStreamEvent,
  AskRequestBody,
  AskResponseBody,
  ReportRequestBody,
  ReportResponseBody,
  SttResponseBody,
} from "@/lib/api/schemas";
import type { AskAnswer, Recommendation, RiskLevel } from "@/lib/types";

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

export interface AnalyzeStreamHandlers {
  /** 답변 문장이 자라는 동안 여러 번 호출된다. 아직 완성본이 아니다. */
  onPartial?: (partial: { situation: RiskLevel; sayNow: string }) => void;
}

export interface ConsultationClient {
  transcribeChunk: (audioBlob: Blob) => Promise<string>;
  analyze: (params: AnalyzeRequestBody) => Promise<Recommendation>;
  /**
   * 분석 결과를 스트리밍으로 받는다. 첫 문장(sayNow)이 완성되기 전부터 onPartial로
   * 흘러들어오고, 완성된 Recommendation이 반환값으로 나온다.
   * 스트리밍을 쓸 수 없는 서버/환경이면 조용히 analyze()로 물러난다.
   */
  analyzeStream: (
    params: AnalyzeRequestBody,
    handlers?: AnalyzeStreamHandlers,
  ) => Promise<Recommendation>;
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

/**
 * SSE 프레임을 직접 파싱한다. EventSource는 GET만 되는데 분석 요청은 본문이 커서
 * POST여야 하므로, fetch 응답 본문을 읽으며 "event: x\ndata: {...}\n\n" 단위로 자른다.
 */
async function* readSseEvents(response: Response): AsyncGenerator<AnalyzeStreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      // 프레임은 "event: <이름>" 줄과 "data: <JSON>" 줄로 이루어진다.
      // 이름은 data 안의 type과 중복되므로 data만 읽으면 된다.
      const dataLine = frame
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      try {
        yield JSON.parse(dataLine.slice(5).trim()) as AnalyzeStreamEvent;
      } catch {
        // 깨진 프레임 하나 때문에 스트림 전체를 버리지는 않는다.
      }
    }
  }
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

  async analyzeStream(params, handlers) {
    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}/analyze/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    } catch (error) {
      // 네트워크 자체가 안 되면 폴백도 실패한다. 그래도 한 번은 시도해 본다.
      console.warn("[consultationClient] stream request failed, falling back", error);
      return realConsultationClient.analyze(params);
    }

    // 스트리밍을 지원하지 않는 서버(구버전)에서는 404가 온다. 조용히 기존 경로로.
    if (!response.ok || !response.body) {
      if (response.status === 404) return realConsultationClient.analyze(params);
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? "분석에 실패했습니다.");
    }

    let recommendation: Recommendation | null = null;
    for await (const event of readSseEvents(response)) {
      if (event.type === "partial") {
        handlers?.onPartial?.({ situation: event.situation, sayNow: event.sayNow });
      } else if (event.type === "done") {
        recommendation = event.recommendation;
      } else if (event.type === "error") {
        throw new Error(event.detail);
      }
    }

    // done 없이 스트림이 끊겼다 — 부분 문장만 들고 있으면 잘못된 답변을 보여주게 되므로
    // 한 번에 받는 경로로 다시 물어본다.
    if (!recommendation) {
      console.warn("[consultationClient] stream ended without result, falling back");
      return realConsultationClient.analyze(params);
    }
    return recommendation;
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
