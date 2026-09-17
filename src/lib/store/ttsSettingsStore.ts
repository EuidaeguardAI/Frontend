import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TtsMode = "coach" | "customer";

interface TtsSettingsState {
  ttsEnabled: boolean;
  ttsMode: TtsMode;
  ttsAutoPlay: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  setTtsMode: (mode: TtsMode) => void;
  setTtsAutoPlay: (autoPlay: boolean) => void;
}

export const useTtsSettingsStore = create<TtsSettingsState>()(
  persist(
    (set) => ({
      ttsEnabled: false,
      ttsMode: "coach",
      ttsAutoPlay: false,
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setTtsMode: (ttsMode) => set({ ttsMode }),
      setTtsAutoPlay: (ttsAutoPlay) => set({ ttsAutoPlay }),
    }),
    { name: "euidaeguard-tts-settings" },
  ),
);
