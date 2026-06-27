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
}

const DEFAULT_LOCATION: SelectedLocation = {
  name: "Bangalore",
  admin1: "Karnataka",
  country: "India",
  country_code: "IN",
  lat: 12.9716,
  lon: 77.5946,
  timezone: "Asia/Kolkata",
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,
      setLocation: (loc) => set({ location: loc }),
    }),
    { name: "smart-todo-location:v1" },
  ),
);
