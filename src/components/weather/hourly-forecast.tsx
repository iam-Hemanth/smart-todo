"use client";

import { motion } from "framer-motion";
import { Droplet } from "lucide-react";
import type { HourlyForecastPoint } from "@/hooks/use-bangalore-weather";
import { getWeatherInfo } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface HourlyForecastProps {
  points: HourlyForecastPoint[];
  isRainingNow: boolean;
}

export function HourlyForecast({ points, isRainingNow }: HourlyForecastProps) {
  if (!points.length) return null;

  // Find the min and max temperature for visual scaling
  const temps = points.map((p) => p.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = Math.max(maxTemp - minTemp, 1);

  return (
    <div className="mt-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Next 8 hours
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {points.map((p, i) => {
          const info = getWeatherInfo(p.weatherCode, p.isDay ? 1 : 0);
          const Icon = info.icon;
          const heightPct = ((p.temperature - minTemp) / range) * 60 + 20;
          const isPeak = p.temperature === maxTemp;
          const isLow = p.temperature === minTemp;
          return (
            <motion.div
              key={p.time}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className={cn(
                "flex shrink-0 snap-start flex-col items-center gap-1 rounded-xl border px-2.5 py-2 min-w-[58px]",
                i === 0
                  ? "border-accent-custom/40 bg-accent-custom/5"
                  : "border-border/40 bg-background/40",
              )}
              style={
                i === 0
                  ? {
                      // @ts-expect-error CSS var
                      "--accent-custom": "var(--accent-custom, #10b981)",
                    }
                  : undefined
              }
            >
              <span className="text-[10px] font-medium text-muted-foreground">
                {i === 0 ? "Now" : p.hourLabel}
              </span>
              <Icon
                className={cn(
                  "h-5 w-5",
                  info.isRaining
                    ? "text-sky-500"
                    : p.isDay
                      ? "text-amber-500"
                      : "text-indigo-500",
                )}
                strokeWidth={1.75}
              />
              <span className="text-xs font-semibold tabular-nums">
                {Math.round(p.temperature)}°
              </span>
              {/* Mini temperature bar */}
              <div className="mt-0.5 h-1 w-full max-w-[36px] overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    height: "100%",
                    width: `${heightPct}%`,
                    backgroundColor: isPeak
                      ? "#f59e0b"
                      : isLow
                        ? "#0ea5e9"
                        : "var(--accent-custom, #10b981)",
                  }}
                />
              </div>
              {p.precipitationProbability > 0 ? (
                <span className="flex items-center gap-0.5 text-[9px] font-medium text-sky-600 dark:text-sky-300 tabular-nums">
                  <Droplet className="h-2 w-2 fill-current" />
                  {p.precipitationProbability}%
                </span>
              ) : (
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                  &nbsp;
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      {isRainingNow && points.some((p) => p.precipitationProbability > 50) && (
        <p className="mt-2 text-[10px] text-sky-600 dark:text-sky-300">
          💧 Rain likely to continue — reschedule outdoor tasks?
        </p>
      )}
    </div>
  );
}
