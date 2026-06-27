"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedLocation {
  id?: number | string;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  lat: number;
  lon: number;
  timezone?: string;
}

interface LocationState {
  location: SelectedLocation;
  setLocation: (loc: SelectedLocation) => void;
  resetToDefault: () => void;
}

export const DEFAULT_LOCATION: SelectedLocation = {
  name: "Kittaganuru",
  admin1: "Karnataka",
  country: "India",
  country_code: "IN",
  lat: 13.0373,
  lon: 77.7105,
  timezone: "Asia/Kolkata",
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,
      setLocation: (loc) => set({ location: loc }),
      resetToDefault: () => set({ location: DEFAULT_LOCATION }),
    }),
    {
      name: "smart-todo-location:v1",
      version: 2,
      migrate: (persisted: unknown) => {
        // v1 defaulted to Bangalore; v2 defaults to Kittaganuru.
        // Reset any old Bangalore default to the new default so users see the change.
        const p = (persisted ?? {}) as { location?: SelectedLocation };
        if (
          p.location &&
          p.location.name === "Bangalore" &&
          Math.abs(p.location.lat - 12.9716) < 0.01
        ) {
          return { location: DEFAULT_LOCATION };
        }
        return p;
      },
    },
  ),
);
