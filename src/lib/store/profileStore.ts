import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BusinessProfile } from "@/lib/types";

interface ProfileState {
  profile: BusinessProfile | null;
  setProfile: (profile: BusinessProfile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: "euidaeguard-profile" },
  ),
);
