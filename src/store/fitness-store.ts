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

export interface FitnessInsights {
  range: string;
  records: {
    bestDaySteps: { date: string; steps: number } | null;
    bestWeekSteps: { startDate: string; endDate: string; steps: number } | null;
    currentStreakDays: number;
    longestStreakDays: number;
    streakGoal: number;
  };
  heatmap: { date: string; steps: number }[];
  dayOfWeek: { day: number; label: string; avgSteps: number; count: number }[];
}

export type InsightsRange = "30d" | "90d" | "6mo" | "1yr" | "all";

interface FitnessState {
  logs: FitnessLog[];
  loading: boolean;
  insights: FitnessInsights | null;
  insightsLoading: boolean;
  selectedRange: InsightsRange;
  loadFromServer: () => Promise<void>;
  loadInsights: (range?: InsightsRange) => Promise<void>;
  setRange: (range: InsightsRange) => void;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
  logs: [],
  loading: true,
  insights: null,
  insightsLoading: true,
  selectedRange: "all",

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

  loadInsights: async (range?: InsightsRange) => {
    const r = range || get().selectedRange;
    try {
      set({ insightsLoading: true });
      const res = await apiFetch(`/api/fitness/insights?range=${r}`);
      if (!res.ok) throw new Error("Failed to load fitness insights");
      const data = await res.json();
      set({ insights: data, insightsLoading: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fitness insights.");
      set({ insightsLoading: false });
    }
  },

  setRange: (range: InsightsRange) => {
    set({ selectedRange: range });
    get().loadInsights(range);
  },
}));
