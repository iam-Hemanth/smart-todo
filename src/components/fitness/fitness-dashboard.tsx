"use client";

import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Footprints,
  Flame,
  Route,
  ArrowUpFromDot,
  HeartPulse,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useFitnessStore, type FitnessLog } from "@/store/fitness-store";
import { FitnessRecords } from "./fitness-records";
import { FitnessHeatmap } from "./fitness-heatmap";
import { FitnessDayOfWeek } from "./fitness-day-of-week";
import { cn } from "@/lib/utils";

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export function FitnessDashboard() {
  const logs = useFitnessStore((s) => s.logs);
  const loading = useFitnessStore((s) => s.loading);

  const today = useMemo(() => todayStr(), []);

  const todayLog = useMemo(
    () => logs.find((l) => l.date === today),
    [logs, today]
  );

  // Build 7-day chart data (most recent 7 days, oldest → newest)
  const chartData = useMemo(() => {
    const logMap = new Map<string, FitnessLog>();
    for (const l of logs) logMap.set(l.date, l);

    const points: { label: string; date: string; steps: number; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const log = logMap.get(d);
      points.push({
        label: format(subDays(new Date(), i), "EEE"),
        date: d,
        steps: log?.steps ?? 0,
        calories: log?.calories ?? 0,
      });
    }
    return points;
  }, [logs]);

  const stats = [
    {
      label: "Steps",
      value: todayLog?.steps ?? 0,
      icon: <Footprints className="h-5 w-5" />,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Active Cal",
      value: todayLog?.calories ?? 0,
      icon: <Flame className="h-5 w-5" />,
      format: (v: number) => `${v.toLocaleString()} kcal`,
    },
    {
      label: "Distance",
      value: todayLog?.distanceKm ?? 0,
      icon: <Route className="h-5 w-5" />,
      format: (v: number) => `${v.toFixed(1)} km`,
    },
    {
      label: "Flights",
      value: todayLog?.flightsClimbed ?? 0,
      icon: <ArrowUpFromDot className="h-5 w-5" />,
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : !todayLog ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/40 px-6 py-14 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent-custom, #10b981) 15%, transparent)",
              color: "var(--accent-custom, #10b981)",
            }}
          >
            <HeartPulse className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No fitness data for today</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Run your iOS Shortcut to push today's health data here.
          </p>
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
                "anim-lift rounded-2xl border p-4 flex flex-col gap-2",
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
                {stat.format(stat.value)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* 7-Day Line Chart */}
      {!loading && logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.15 }}
          className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03] p-4 sm:p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Last 7 Days — Steps & Active Calories
          </h3>
          <div className="h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke="var(--accent-custom, #10b981)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--accent-custom, #10b981)", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Steps"
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  name="Calories"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Calendar Heatmap (Largest, Information-dense Hero Element) */}
      <FitnessHeatmap />

      {/* Side-by-side: Records & Streaks (2/3 width) & Day-of-Week Pattern (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FitnessRecords />
        </div>
        <div className="lg:col-span-1">
          <FitnessDayOfWeek />
        </div>
      </div>
    </div>
  );
}
