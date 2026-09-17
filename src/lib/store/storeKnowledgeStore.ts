import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { KnowledgeCategory, StoreKnowledgeEntry } from "@/lib/types";

/**
 * 직원이 직접 등록한 매장 규정. 이 기기의 localStorage에만 저장된다(서버 DB 없음).
 *
 * 공식 고시·법령 지식베이스는 구하기도 어렵고 매장마다 다른 실제 운영 기준은 담을 수
 * 없다. 그 빈자리를 사용자가 직접 채우게 하는 것이 이 스토어의 목적이다.
 */

/** 분석 요청에 실어 보낼 최대 건수. 프롬프트가 길어지면 응답이 그만큼 늦어진다. */
export const MAX_SENT_ENTRIES = 20;
/** 분석 요청에 실어 보낼 본문 합계 상한(자). 위 건수 제한보다 먼저 걸릴 수 있다. */
export const MAX_SENT_CHARS = 2000;

interface StoreKnowledgeState {
  entries: StoreKnowledgeEntry[];
  add: (input: { category: KnowledgeCategory; title: string; body: string }) => void;
  update: (
    id: string,
    patch: Partial<Pick<StoreKnowledgeEntry, "category" | "title" | "body">>,
  ) => void;
  remove: (id: string) => void;
  toggleEnabled: (id: string) => void;
}

export const useStoreKnowledgeStore = create<StoreKnowledgeState>()(
  persist(
    (set) => ({
      entries: [],

      add: ({ category, title, body }) =>
        set((state) => ({
          entries: [
            {
              id: `knowledge-${Date.now()}`,
              category,
              title: title.trim(),
              body: body.trim(),
              enabled: true,
              createdAtMs: Date.now(),
              updatedAtMs: Date.now(),
            },
            ...state.entries,
          ],
        })),

      update: (id, patch) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...patch, updatedAtMs: Date.now() } : entry,
          ),
        })),

      remove: (id) =>
        set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) })),

      toggleEnabled: (id) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, enabled: !entry.enabled, updatedAtMs: Date.now() }
              : entry,
          ),
        })),
    }),
    { name: "euidaeguard-store-knowledge" },
  ),
);

/**
 * 분석 요청에 실을 항목을 고른다. 켜져 있는 것만, 오래된 것부터(먼저 등록한 규정이
 * 더 기본적인 규정일 가능성이 높다) 상한까지 담는다.
 */
export function selectKnowledgeForAnalysis(
  entries: StoreKnowledgeEntry[],
): StoreKnowledgeEntry[] {
  const enabled = entries
    .filter((entry) => entry.enabled && entry.body.trim().length > 0)
    .sort((a, b) => a.createdAtMs - b.createdAtMs);

  const selected: StoreKnowledgeEntry[] = [];
  let chars = 0;
  for (const entry of enabled) {
    if (selected.length >= MAX_SENT_ENTRIES) break;
    const cost = entry.title.length + entry.body.length;
    if (chars + cost > MAX_SENT_CHARS) break;
    selected.push(entry);
    chars += cost;
  }
  return selected;
}
