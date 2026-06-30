"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfYear,
  endOfYear,
  format,
  startOfWeek,
  addDays,
  isAfter,
} from "date-fns";
import { useFitnessStore } from "@/store/fitness-store";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getStepIntensity(steps: number): number {
  if (steps === 0) return 0;
  if (steps < 3000) return 1;
  if (steps < 6000) return 2;
  if (steps < 10000) return 3;
  if (steps < 15000) return 4;
  return 5;
}

function getIntensityStyle(level: number): React.CSSProperties | undefined {
  if (level === 0) return undefined;
  const opacities = {
    1: "15%",
    2: "38%",
    3: "60%",
    4: "82%",
    5: "100%",
  };
  return {
    backgroundColor: `color-mix(in srgb, var(--accent-custom, #10b981) ${opacities[level as 1|2|3|4|5]}, transparent)`
  };
}

export function FitnessHeatmap() {
  const insights = useFitnessStore((s) => s.insights);
  const insightsLoading = useFitnessStore((s) => s.insightsLoading);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Build a date→steps map from heatmap data
  const stepsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (insights?.heatmap) {
      for (const entry of insights.heatmap) {
        map.set(entry.date, entry.steps);
      }
    }
    return map;
  }, [insights?.heatmap]);

  // Determine available year range
  const yearRange = useMemo(() => {
    if (!insights?.heatmap || insights.heatmap.length === 0) return { min: currentYear, max: currentYear };
    const dates = insights.heatmap.map((h) => parseInt(h.date.substring(0, 4), 10));
    return { min: Math.min(...dates), max: Math.max(...dates) };
  }, [insights?.heatmap, currentYear]);

  // Build grid data for the selected year
  const gridData = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const today = new Date();

    // Find the Monday on or before Jan 1
    const gridStart = startOfWeek(yearStart, { weekStartsOn: 1 });

    // Build all weeks
    const weeks: { date: Date; dateStr: string; steps: number; isCurrentYear: boolean; isFuture: boolean }[][] = [];
    let current = gridStart;

    while (true) {
      const week: typeof weeks[0] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = format(current, "yyyy-MM-dd");
        const inYear = current.getFullYear() === year;
        week.push({
          date: current,
          dateStr,
          steps: stepsMap.get(dateStr) || 0,
          isCurrentYear: inYear,
          isFuture: isAfter(current, today),
        });
        current = addDays(current, 1);
      }
      weeks.push(week);

      // Stop after we've passed the end of the year
      if (isAfter(current, yearEnd) && week[6].date.getFullYear() > year) break;
      if (weeks.length > 54) break; // Safety valve
    }

    return weeks;
  }, [year, stepsMap]);

  // Compute month label positions
  const monthPositions = useMemo(() => {
    const positions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    gridData.forEach((week, weekIdx) => {
      // Use the first day of the week that's in the current year
      const representativeDay = week.find((d) => d.isCurrentYear) || week[0];
      const month = representativeDay.date.getMonth();
      if (month !== lastMonth && representativeDay.isCurrentYear) {
        positions.push({ label: MONTH_LABELS[month], col: weekIdx });
        lastMonth = month;
      }
    });
    return positions;
  }, [gridData]);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; steps: number } | null>(null);

  if (insightsLoading) {
    return <div className="h-36 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.1 }}
      className="rounded-2xl border border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03] p-4 sm:p-5 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Activity Heatmap
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => Math.max(yearRange.min, y - 1))}
            disabled={year <= yearRange.min}
            className="h-7 w-7 rounded-lg border border-border bg-background/50 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-bold tracking-tight min-w-[3ch] text-center">{year}</span>
          <button
            onClick={() => setYear((y) => Math.min(yearRange.max, y + 1))}
            disabled={year >= yearRange.max}
            className="h-7 w-7 rounded-lg border border-border bg-background/50 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Month labels */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="flex ml-8 mb-1">
            {monthPositions.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-muted-foreground font-medium"
                style={{
                  position: "relative",
                  left: `${m.col * 14}px`,
                  marginRight: i < monthPositions.length - 1
                    ? `${((monthPositions[i + 1]?.col || 0) - m.col) * 14 - 24}px`
                    : 0,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5 relative" onMouseLeave={() => setTooltip(null)}>
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0">
              {["M", "", "W", "", "F", "", "S"].map((label, i) => (
                <div key={i} className="h-[12px] w-5 text-[9px] text-muted-foreground font-medium flex items-center justify-end pr-0.5">
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {gridData.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.map((day, dayIdx) => {
                  const intensity = getStepIntensity(day.steps);
                  return (
                    <div
                      key={day.dateStr}
                      className={cn(
                        "h-[12px] w-[12px] rounded-sm transition-colors",
                        day.isFuture || !day.isCurrentYear
                          ? "bg-transparent"
                          : intensity === 0
                            ? "bg-muted/20 dark:bg-muted/10"
                            : ""
                      )}
                      style={
                        day.isFuture || !day.isCurrentYear || intensity === 0
                          ? undefined
                          : getIntensityStyle(intensity)
                      }
                      onMouseEnter={(e) => {
                        if (!day.isFuture && day.isCurrentYear) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            date: day.dateStr,
                            steps: day.steps,
                          });
                        }
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Tooltip */}
            {tooltip && (
              <div
                className="fixed z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-lg px-2.5 py-1.5 text-xs -translate-x-1/2 -translate-y-full"
                style={{ left: tooltip.x, top: tooltip.y - 6 }}
              >
                <div className="font-semibold">{format(new Date(tooltip.date + "T00:00:00"), "MMM d, yyyy")}</div>
                <div className="text-muted-foreground">{tooltip.steps.toLocaleString()} steps</div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-8">
            <span className="text-[10px] text-muted-foreground font-medium">Less</span>
            <div className="h-[12px] w-[12px] rounded-sm bg-muted/20 dark:bg-muted/10" />
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className="h-[12px] w-[12px] rounded-sm"
                style={getIntensityStyle(level)}
              />
            ))}
            <span className="text-[10px] text-muted-foreground font-medium">More</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
