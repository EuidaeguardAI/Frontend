import { create } from "zustand";

/** prepare 화면 → intake 화면으로 넘어가는 짧은 순간에만 쓰는 임시 상태(영구 저장 안 함). */
interface IntakeDraftState {
  micAvailable: boolean;
  setMicAvailable: (value: boolean) => void;
}

export const useIntakeDraftStore = create<IntakeDraftState>()((set) => ({
  micAvailable: true,
  setMicAvailable: (value) => set({ micAvailable: value }),
}));
