import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ResponseMode } from "@/lib/types";

interface ResponseModeState {
  responseMode: ResponseMode;
  setResponseMode: (mode: ResponseMode) => void;
}

export const useResponseModeStore = create<ResponseModeState>()(
  persist(
    (set) => ({
      responseMode: "full",
      setResponseMode: (responseMode) => set({ responseMode }),
    }),
    { name: "euidaeguard-response-mode" },
  ),
);
