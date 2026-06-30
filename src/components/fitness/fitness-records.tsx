"use client";

import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Trophy, TrendingUp, Zap, Crown } from "lucide-react";
import {
  useFitnessStore,
  type InsightsRange,
} from "@/store/fitness-store";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: { value: InsightsRange; label: string }[] = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "6mo", label: "6 Months" },
  { value: "1yr", label: "1 Year" },
  { value: "all", label: "All Time" },
];

export function FitnessRecords() {
  const insights = useFitnessStore((s) => s.insights);
  const insightsLoading = useFitnessStore((s) => s.insightsLoading);
  const selectedRange = useFitnessStore((s) => s.selectedRange);
  const setRange = useFitnessStore((s) => s.setRange);

  const records = insights?.records;

  const stats = [
    {
      label: "Best Day",
      value: records?.bestDaySteps
        ? records.bestDaySteps.steps.toLocaleString()
        : "—",
      subtitle: records?.bestDaySteps
        ? format(parseISO(records.bestDaySteps.date), "MMM d, yyyy")
        : "No data",
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      label: "Best Week",
      value: records?.bestWeekSteps
        ? records.bestWeekSteps.steps.toLocaleString()
        : "—",
      subtitle: records?.bestWeekSteps
        ? `${format(parseISO(records.bestWeekSteps.startDate), "MMM d")} – ${format(parseISO(records.bestWeekSteps.endDate), "MMM d")}`
        : "No data",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: "Current Streak",
      value: records ? `${records.currentStreakDays}` : "—",
      subtitle: records ? `days ≥ ${(records.streakGoal / 1000).toFixed(0)}K steps` : "",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      label: "Longest Streak",
      value: records ? `${records.longestStreakDays}` : "—",
      subtitle: records ? `days ≥ ${(records.streakGoal / 1000).toFixed(0)}K steps` : "",
      icon: <Crown className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header + Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Records & Streaks
        </h3>
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                selectedRange === opt.value
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      {insightsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28, delay: i * 0.04 }}
              className={cn(
                "anim-lift rounded-2xl border p-4 flex flex-col gap-1.5",
                "border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]",
                "hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05] transition-all"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "color-mix(in srgb, var(--accent-custom, #10b981) 15%, transparent)" }}
                >
                  <span style={{ color: "var(--accent-custom, #10b981)" }}>{stat.icon}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium truncate">
                {stat.subtitle}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
