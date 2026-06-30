"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useFitnessStore } from "@/store/fitness-store";

export function FitnessDayOfWeek() {
  const insights = useFitnessStore((s) => s.insights);
  const insightsLoading = useFitnessStore((s) => s.insightsLoading);
  const selectedRange = useFitnessStore((s) => s.selectedRange);

  // Reorder: Open-Meteo/SQLite strftime('%w') gives 0=Sun, we want Mon first
  const chartData = useMemo(() => {
    if (!insights?.dayOfWeek) return [];
    const dowMap = new Map(insights.dayOfWeek.map((d) => [d.day, d]));
    // Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0)
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((dow) => {
      const entry = dowMap.get(dow);
      return {
        label: entry?.label || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
        avgSteps: entry?.avgSteps || 0,
      };
    });
  }, [insights?.dayOfWeek]);

  const rangeLabel = {
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    "6mo": "Last 6 Months",
    "1yr": "Last Year",
    "all": "All Time",
  }[selectedRange];

  if (insightsLoading) {
    return <div className="h-52 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />;
  }

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.15 }}
      className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03] p-4 sm:p-5"
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
        Activity by Day of Week
        <span className="ml-2 text-[10px] font-medium normal-case tracking-normal opacity-70">
          ({rangeLabel})
        </span>
      </h3>
      <div className="h-52 sm:h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
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
              formatter={(value: number) => [value.toLocaleString(), "Avg Steps"]}
            />
            <Bar
              dataKey="avgSteps"
              fill="var(--accent-custom, #10b981)"
              radius={[6, 6, 0, 0]}
              name="Avg Steps"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
