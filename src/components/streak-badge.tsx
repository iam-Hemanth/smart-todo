"use client";

import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface StreakState {
  /** Set of ISO date strings (YYYY-MM-DD) on which at least one task was completed. */
  completionDays: string[];
  record: (date?: Date) => void;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set) => ({
      completionDays: [],
      record: (date) => {
        const day = isoDay(date ?? new Date());
        set((s) =>
          s.completionDays.includes(day)
            ? s
            : { completionDays: [...s.completionDays, day] },
        );
      },
    }),
    { name: "smart-todo-streak:v1" },
  ),
);

export function computeStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const today = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - 86400000);

  // Allow streak to count from today OR yesterday (so it doesn't break until 48h elapsed)
  let cursor: Date;
  if (set.has(isoDay(today))) {
    cursor = today;
  } else if (set.has(isoDay(yesterday))) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (set.has(isoDay(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

export function last7Days(days: string[]): { date: Date; done: boolean; label: string }[] {
  const set = new Set(days);
  const out: { date: Date; done: boolean; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(new Date(Date.now() - i * 86400000));
    out.push({
      date: d,
      done: set.has(isoDay(d)),
      label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 1),
    });
  }
  return out;
}

export function StreakBadge() {
  const completionDays = useStreakStore((s) => s.completionDays);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const streak = useMemo(() => computeStreak(completionDays), [completionDays]);
  const week = useMemo(() => last7Days(completionDays), [completionDays]);

  if (!hydrated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur px-2.5 py-1.5 text-xs font-medium hover:bg-background transition-colors"
          aria-label={`Current streak: ${streak} day${streak === 1 ? "" : "s"}`}
        >
          <motion.span
            animate={
              streak > 0
                ? { scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] }
                : { scale: 1 }
            }
            transition={{
              duration: 1.4,
              repeat: streak > 0 ? Infinity : 0,
              repeatDelay: 1.5,
            }}
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full",
              streak > 0
                ? "bg-orange-500/15 text-orange-500"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Flame
              className="h-3.5 w-3.5"
              fill={streak > 0 ? "currentColor" : "none"}
            />
          </motion.span>
          <span className="tabular-nums">{streak}</span>
          <span className="text-muted-foreground text-[10px] hidden sm:inline">
            day{streak === 1 ? "" : "s"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
            <Flame className="h-4 w-4" fill="currentColor" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {streak}-day streak
            </p>
            <p className="text-[11px] text-muted-foreground">
              Complete a task daily to keep it alive
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-1">
          {week.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-semibold",
                  d.done
                    ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white"
                    : "bg-muted text-muted-foreground/70",
                )}
              >
                {d.label}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {d.date.getDate()}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground">
          Streak resets only after 48h with no completion — don’t break the chain!
        </p>
      </PopoverContent>
    </Popover>
  );
}
