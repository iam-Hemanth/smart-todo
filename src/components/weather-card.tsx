"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain,
  Droplets,
  MapPin,
  RefreshCw,
  Thermometer,
  AlertTriangle,
  Wind,
  Leaf,
} from "lucide-react";
import { useWeather } from "@/hooks/use-bangalore-weather";
import { getWeatherInfo } from "@/lib/weather";
import { getAqiInfo, type AqiInfo } from "@/lib/aqi";
import { useLocationStore } from "@/store/location-store";
import { LocationSearch } from "./weather/location-search";
import { WeatherEffects } from "./weather/weather-effects";
import { HourlyForecast } from "./weather/hourly-forecast";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface WeatherCardProps {
  onRainChange?: (raining: boolean) => void;
}

function formatTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WeatherCard({ onRainChange }: WeatherCardProps) {
  const location = useLocationStore((s) => s.location);
  const { data, aqi, hourly, loading, error, lastUpdated, refresh } = useWeather(
    location.lat,
    location.lon,
  );

  const info = data ? getWeatherInfo(data.weatherCode, data.isDay ? 1 : 0) : null;
  const isRaining = !!info?.isRaining;
  const aqiInfo = getAqiInfo(aqi?.usAqi);

  useEffect(() => {
    onRainChange?.(isRaining);
  }, [isRaining, onRainChange]);

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
      aria-label={`${location.name} current weather`}
    >
      {/* Animated backdrop */}
      <div
        className={cn(
          "absolute inset-0 -z-10 transition-all duration-1000",
          isRaining
            ? "bg-gradient-to-br from-sky-100 via-cyan-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
            : data && !data.isDay
              ? "bg-gradient-to-br from-indigo-100 via-violet-50 to-rose-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900"
              : "bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950",
        )}
      />

      {/* Weather particle effects */}
      {data && (
        <WeatherEffects weatherCode={data.weatherCode} isDay={data.isDay} />
      )}

      {/* Floating blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Live weather</p>
              <h2 className="text-lg font-semibold tracking-tight">
                {location.name}
                {location.admin1 && location.admin1 !== location.name && (
                  <span className="text-muted-foreground font-normal">
                    {" "}, {location.admin1}
                  </span>
                )}
                {location.country && (
                  <span className="text-muted-foreground font-normal">
                    {" "}, {location.country}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LocationSearch />
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all disabled:opacity-50"
              aria-label="Refresh weather"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span className="hidden sm:inline">{loading ? "Updating…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-200"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Couldn’t load weather</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]"
            >
              {/* Big temperature */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  {info && (
                    <motion.div
                      key={info.label}
                      initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 16 }}
                      className={cn(
                        "flex h-20 w-20 items-center justify-center rounded-2xl",
                        isRaining
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-300"
                          : data && !data.isDay
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
                      )}
                    >
                      <info.icon className="h-10 w-10" strokeWidth={1.75} />
                    </motion.div>
                  )}
                  {loading && (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/40">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  {data ? (
                    <div className="flex items-start gap-1">
                      <span className="text-5xl sm:text-6xl font-semibold tracking-tight tabular-nums">
                        {Math.round(data.temperature)}
                      </span>
                      <span className="mt-1 text-2xl font-medium text-muted-foreground">°C</span>
                    </div>
                  ) : (
                    <div className="h-14 w-32 rounded-xl bg-muted/40 animate-pulse" />
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {info?.label ?? "Loading conditions…"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    Feels like {data ? `${Math.round(data.apparentTemperature)}°C` : "—"}
                  </p>
                </div>
              </div>

              {/* Stats: humidity, AQI, rain */}
              <div className="grid grid-cols-3 gap-3 self-center">
                <Stat
                  icon={<Droplets className="h-4 w-4" />}
                  label="Humidity"
                  value={data ? `${Math.round(data.humidity)}%` : "—"}
                  accent="text-sky-600 dark:text-sky-300"
                />
                <AqiStat aqiInfo={aqiInfo} aqi={aqi} />
                <Stat
                  icon={<Thermometer className="h-4 w-4" />}
                  label="Rain"
                  value={data ? `${data.precipitation.toFixed(1)} mm` : "—"}
                  accent="text-indigo-600 dark:text-indigo-300"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hourly forecast strip */}
        {hourly.length > 0 && (
          <HourlyForecast points={hourly} isRainingNow={isRaining} />
        )}

        {/* Rain banner */}
        <AnimatePresence>
          {isRaining && (
            <motion.div
              key="rain-banner"
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-5 overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/90 dark:border-sky-900/50 dark:bg-sky-950/40 p-3.5 text-sky-800 dark:text-sky-100">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20">
                  <CloudRain className="h-5 w-5" />
                  <span className="absolute inset-0 animate-ping rounded-xl bg-sky-400/30" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold leading-tight">
                    It’s raining in {location.name} right now
                  </p>
                  <p className="text-xs text-sky-700/80 dark:text-sky-200/80">
                    Outdoor tasks below are flagged with a rain warning badge.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live · updates every minute
          </span>
          <span>Updated {formatTime(lastUpdated)}</span>
        </div>
      </div>
    </motion.section>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/40 dark:border-white/5 bg-white/50 dark:bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm">
      <div className={cn("flex items-center gap-1.5 text-xs", accent)}>
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function AqiStat({
  aqiInfo,
  aqi,
}: {
  aqiInfo: AqiInfo | null;
  aqi: {
    usAqi: number | null;
    pm2_5: number | null;
    pm10: number | null;
    ozone: number | null;
    nitrogen_dioxide: number | null;
    sulphur_dioxide: number | null;
  } | null;
}) {
  if (!aqiInfo || !aqi || aqi.usAqi == null) {
    return (
      <Stat
        icon={<Leaf className="h-4 w-4" />}
        label="AQI"
        value="—"
        accent="text-muted-foreground"
      />
    );
  }

  const trigger = (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2.5 backdrop-blur-sm cursor-help",
        aqiInfo.bgClass,
        aqiInfo.borderClass,
      )}
    >
      <div className={cn("flex items-center gap-1.5 text-xs", aqiInfo.textClass)}>
        <Leaf className="h-4 w-4" />
        <span className="font-medium">AQI</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-sm font-semibold tabular-nums">{Math.round(aqi.usAqi)}</span>
        <span className={cn("text-[10px] leading-none", aqiInfo.textClass)}>
          {aqiInfo.label}
        </span>
      </div>
    </div>
  );

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent
        sideOffset={6}
        align="center"
        className="w-64 p-0 text-xs"
      >
        <div className={cn("rounded-t-md px-3 py-2 text-white")} style={{ backgroundColor: aqiInfo.hex }}>
          <p className="font-semibold">
            AQI {Math.round(aqi.usAqi)} · {aqiInfo.label}
          </p>
          <p className="opacity-90 leading-snug mt-0.5">{aqiInfo.advice}</p>
        </div>
        <div className="px-3 py-2.5 space-y-1.5">
          <PollutantRow label="PM2.5" value={aqi.pm2_5} unit="µg/m³" />
          <PollutantRow label="PM10" value={aqi.pm10} unit="µg/m³" />
          <PollutantRow label="Ozone (O₃)" value={aqi.ozone} unit="µg/m³" />
          <PollutantRow label="NO₂" value={aqi.nitrogen_dioxide} unit="µg/m³" />
          <PollutantRow label="SO₂" value={aqi.sulphur_dioxide} unit="µg/m³" />
        </div>
        <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
          US EPA AQI · Open-Meteo Air Quality
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function PollutantRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">
        {value != null ? `${value.toFixed(1)} ` : "— "}
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

// Suppress unused import warnings for icons kept for future use
void Wind;
