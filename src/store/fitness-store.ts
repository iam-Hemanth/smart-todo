"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export interface FitnessLog {
  id: string;
  date: string;
  steps: number;
  calories: number;
  distanceKm: number;
  flightsClimbed: number | null;
  createdAt: number;
  updatedAt: number;
}

interface FitnessState {
  logs: FitnessLog[];
  loading: boolean;
  loadFromServer: () => Promise<void>;
}

export const useFitnessStore = create<FitnessState>((set) => ({
  logs: [],
  loading: true,

  loadFromServer: async () => {
    try {
      set({ loading: true });
      const res = await apiFetch("/api/fitness?days=30");
      if (!res.ok) throw new Error("Failed to load fitness logs");
      const data = await res.json();
      set({ logs: data.logs || [], loading: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fitness data.");
      set({ loading: false });
    }
  },
}));
