"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export interface Habit {
  id: string;
  name: string;
  targetCount?: number;
  unit?: string;
  createdAt: number;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  count: number;
  createdAt: number;
}

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  loading: boolean;
  loadFromServer: () => Promise<void>;
  addHabit: (name: string, targetCount?: number, unit?: string) => Promise<string | null>;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id" | "createdAt">>) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  logProgress: (habitId: string, date: string, count: number) => Promise<boolean>;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  logs: [],
  loading: true,

  loadFromServer: async () => {
    try {
      set({ loading: true });
      const [habitsRes, logsRes] = await Promise.all([
        apiFetch("/api/habits"),
        apiFetch("/api/habits/logs"),
      ]);

      if (!habitsRes.ok || !logsRes.ok) throw new Error("Failed to load habits data");

      const habitsData = await habitsRes.json();
      const logsData = await logsRes.json();

      set({
        habits: habitsData.habits || [],
        logs: logsData.logs || [],
        loading: false,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load habits tracker data.");
      set({ loading: false });
    }
  },

  addHabit: async (name, targetCount, unit) => {
    const newHabit: Habit = {
      id: uid(),
      name: name.trim(),
      targetCount: targetCount || undefined,
      unit: unit?.trim() || undefined,
      createdAt: Date.now(),
      archived: false,
    };

    // Optimistic Update
    set((state) => ({ habits: [...state.habits, newHabit] }));

    try {
      const res = await apiFetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHabit),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return newHabit.id;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to create habit: ${error.message || error}`);
      // Rollback
      set((state) => ({ habits: state.habits.filter((h) => h.id !== newHabit.id) }));
      return null;
    }
  },

  updateHabit: async (id, patch) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return false;

    const previousHabit = { ...habit };

    // Optimistic Update
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));

    try {
      const res = await apiFetch(`/api/habits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to update habit: ${error.message || error}`);
      // Rollback
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? previousHabit : h)),
      }));
      return false;
    }
  },

  deleteHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return false;

    const previousHabits = [...get().habits];
    const previousLogs = [...get().logs];

    // Optimistic Update
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      logs: state.logs.filter((l) => l.habitId !== id),
    }));

    try {
      const res = await apiFetch(`/api/habits/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to delete habit: ${error.message || error}`);
      // Rollback
      set({ habits: previousHabits, logs: previousLogs });
      return false;
    }
  },

  logProgress: async (habitId, date, count) => {
    const existingLog = get().logs.find((l) => l.habitId === habitId && l.date === date);
    const previousLogs = [...get().logs];

    let nextLogs: HabitLog[];
    if (existingLog) {
      nextLogs = get().logs.map((l) =>
        l.habitId === habitId && l.date === date ? { ...l, count } : l
      );
    } else {
      const newLog: HabitLog = {
        id: `${habitId}-${date}`,
        habitId,
        date,
        count,
        createdAt: Date.now(),
      };
      nextLogs = [...get().logs, newLog];
    }

    // Optimistic Update
    set({ logs: nextLogs });

    try {
      const res = await apiFetch("/api/habits/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date, count }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to log progress: ${error.message || error}`);
      // Rollback
      set({ logs: previousLogs });
      return false;
    }
  },
}));
