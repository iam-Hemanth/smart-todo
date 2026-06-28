"use client";

import { useMemo, useId } from "react";
import { motion } from "framer-motion";
import { getWeatherInfo } from "@/lib/weather";

interface WeatherEffectsProps {
  weatherCode: number;
  isDay: boolean;
  temperature: number;
}

/**
 * Premium weather scenes using CSS-blurred circle clouds (Apple Weather technique)
 * instead of SVG turbulence filters. Each cloud is a cluster of 5-7 overlapping
 * white circles with heavy blur for naturally soft, fluffy edges.
 */
export function WeatherEffects({ weatherCode, isDay, temperature }: WeatherEffectsProps) {
  const scene = classifyScene(weatherCode, isDay, temperature);
  const filterId = useId();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <radialGradient id={`${filterId}-sun-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
            <stop offset="30%" stopColor="#fef3c7" stopOpacity="1" />
            <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${filterId}-sun-hot`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="20%" stopColor="#fef3c7" stopOpacity="1" />
            <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#f97316" stopOpacity="0.7" />
            <stop offset="90%" stopColor="#ea580c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${filterId}-moon-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#fde68a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {scene === "clear-night" && <ClearNightScene filterId={filterId} />}
      {scene === "cloudy-night" && <CloudyNightScene filterId={filterId} />}
      {scene === "clear-sunny" && <ClearSunnyDayScene filterId={filterId} />}
      {scene === "hot-sunny" && <HotSunnyDayScene filterId={filterId} />}
      {scene === "partly-cloudy-day" && <PartlyCloudyDayScene />}
      {scene === "overcast-day" && <OvercastDayScene />}
      {scene === "fog" && <FogScene />}
      {(scene === "rain" || scene === "storm") && (
        <RainScene isStorm={scene === "storm"} />
      )}
      {scene === "snow" && <SnowScene />}
    </div>
  );
}

type Scene =
  | "clear-night" | "cloudy-night" | "clear-sunny" | "hot-sunny"
  | "partly-cloudy-day" | "overcast-day" | "fog" | "rain" | "storm" | "snow";

function classifyScene(weatherCode: number, isDay: boolean, temperature: number): Scene {
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return "rain";
  if ([95, 96, 99].includes(weatherCode)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "snow";
  if ([45, 48].includes(weatherCode)) return "fog";
  if (weatherCode === 3) return isDay ? "overcast-day" : "cloudy-night";
  if (weatherCode === 2) return isDay ? "partly-cloudy-day" : "cloudy-night";
  if (weatherCode === 0 || weatherCode === 1) {
    if (!isDay) return "clear-night";
    if (temperature >= 32) return "hot-sunny";
    return "clear-sunny";
  }
  return isDay ? "clear-sunny" : "clear-night";
}

/* ============ CSS-Blurred Cloud System ============
   Each cloud is a cluster of 5-7 overlapping white circles with heavy blur.
   This produces naturally soft, fluffy edges without SVG filters.
   5 distinct shape variants ensure variety. */

interface CloudPuff {
  cx: number; // center x (% of cloud width)
  cy: number; // center y (% of cloud height)
  r: number;  // radius (% of cloud width)
}

const CLOUD_VARIANTS: CloudPuff[][] = [
  // Variant 0: wide spread, tall center
  [
    { cx: 20, cy: 65, r: 30 }, { cx: 45, cy: 45, r: 38 }, { cx: 70, cy: 50, r: 35 },
    { cx: 88, cy: 68, r: 25 }, { cx: 50, cy: 30, r: 28 },
  ],
  // Variant 1: compact round
  [
    { cx: 25, cy: 60, r: 28 }, { cx: 50, cy: 45, r: 35 }, { cx: 75, cy: 55, r: 30 },
    { cx: 50, cy: 30, r: 25 },
  ],
  // Variant 2: long stretched
  [
    { cx: 12, cy: 58, r: 24 }, { cx: 30, cy: 50, r: 28 }, { cx: 50, cy: 54, r: 30 },
    { cx: 70, cy: 50, r: 27 }, { cx: 88, cy: 58, r: 23 }, { cx: 50, cy: 38, r: 20 },
  ],
  // Variant 3: tall towering
  [
    { cx: 28, cy: 72, r: 28 }, { cx: 52, cy: 55, r: 35 }, { cx: 72, cy: 40, r: 30 },
    { cx: 82, cy: 62, r: 25 }, { cx: 55, cy: 28, r: 24 },
  ],
  // Variant 4: small wispy
  [
    { cx: 25, cy: 55, r: 26 }, { cx: 50, cy: 42, r: 32 }, { cx: 75, cy: 52, r: 26 },
    { cx: 50, cy: 28, r: 20 },
  ],
];

interface CloudData {
  id: number;
  top: number;
  scale: number;
  duration: number;
  opacity: number;
  layer: number;
  variant: number;
  width: number;
  height: number;
}

function useClouds(count: number): CloudData[] {
  return useMemo(() => Array.from({ length: count }, (_, i) => {
    const layer = i < count / 2 ? 0 : 1;
    const variant = i % 5;
    return {
      id: i,
      top: 3 + Math.random() * 42,
      scale: layer === 0 ? 0.55 + Math.random() * 0.3 : 0.85 + Math.random() * 0.5,
      duration: layer === 0 ? 32 + Math.random() * 14 : 18 + Math.random() * 10,
      opacity: layer === 0 ? 0.3 + Math.random() * 0.15 : 0.6 + Math.random() * 0.2,
      layer,
      variant,
      width: 200 + variant * 20,
      height: 100,
    };
  }), [count]);
}

/**
 * A single cloud rendered as CSS-blurred circle cluster.
 * Puffs are white circles with blur; a shadow div sits underneath for depth.
 */
function BlurredCloud({
  data,
  color = "white",
  shadowColor = "rgba(71,85,105,0.25)",
  highlight = true,
}: {
  data: CloudData;
  color?: string;
  shadowColor?: string;
  highlight?: boolean;
}) {
  const puffs = CLOUD_VARIANTS[data.variant];
  const w = data.width;
  const h = data.height;

  return (
    <motion.div
      key={data.id}
      className="absolute"
      style={{
        top: `${data.top}%`,
        width: `${w}px`,
        height: `${h}px`,
        opacity: data.opacity,
        transform: `scale(${data.scale})`,
      }}
      initial={{ x: "-500px", opacity: 0 }}
      animate={{
        x: `calc(100% + 500px)`,
        opacity: [0, data.opacity, data.opacity, 0],
      }}
      transition={{
        x: { duration: data.duration, repeat: Infinity, ease: "linear" },
        opacity: {
          duration: data.duration,
          times: [0, 0.08, 0.92, 1],
          repeat: Infinity,
          ease: "linear",
        },
      }}
    >
      {/* Shadow layer — gray, offset down */}
      <div className="absolute inset-0" style={{ filter: "blur(12px)" }}>
        {puffs.map((p, i) => (
          <div
            key={`sh-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${p.cx - p.r}%`,
              top: `${p.cy - p.r + 8}%`,
              width: `${p.r * 2}%`,
              height: `${p.r * 2}%`,
              backgroundColor: shadowColor,
            }}
          />
        ))}
      </div>

      {/* Main cloud body — white circles with heavy blur for soft edges */}
      <div className="absolute inset-0" style={{ filter: "blur(6px)" }}>
        {puffs.map((p, i) => (
          <div
            key={`body-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${p.cx - p.r}%`,
              top: `${p.cy - p.r}%`,
              width: `${p.r * 2}%`,
              height: `${p.r * 2}%`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* Highlight layer — brighter white on top, less blur for definition */}
      {highlight && (
        <div className="absolute inset-0" style={{ filter: "blur(3px)" }}>
          {puffs.map((p, i) => (
            <div
              key={`hl-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${p.cx - p.r * 0.6}%`,
                top: `${p.cy - p.r * 0.9}%`,
                width: `${p.r * 1.2}%`,
                height: `${p.r * 0.8}%`,
                backgroundColor: "rgba(255,255,255,0.6)",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ============ Stars ============ */
interface Star { id: number; left: number; top: number; size: number; delay: number; duration: number; layer: number; }
function useStars(count: number): Star[] {
  return useMemo(() => Array.from({ length: count }, (_, i) => {
    const layer = i % 3;
    return {
      id: i, left: Math.random() * 100, top: Math.random() * 75,
      size: layer === 0 ? 0.8 + Math.random() : layer === 1 ? 1.5 + Math.random() * 1.5 : 2 + Math.random() * 2.5,
      delay: Math.random() * 4, duration: 2.5 + Math.random() * 4, layer,
    };
  }), [count]);
}

/* ============ CLEAR NIGHT ============ */
function ClearNightScene({ filterId }: { filterId: string }) {
  const stars = useStars(90);
  const moonGlowUrl = `url(#${filterId}-moon-glow)`;

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_15%,rgba(99,102,241,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_70%,rgba(168,85,247,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(30,27,75,0.3),transparent_60%)]" />

      <motion.div className="absolute right-12 top-8" animate={{ y: [0, -8, 0] }} transition={{ duration: 14, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}>
        <div className="absolute inset-0 -m-16 rounded-full bg-amber-100/10 blur-2xl" />
        <svg className="absolute -inset-12" viewBox="0 0 200 200" style={{ filter: "blur(8px)" }}>
          <circle cx="100" cy="100" r="80" fill={moonGlowUrl} />
        </svg>
        <div className="relative h-20 w-20 rounded-full shadow-[0_0_60px_rgba(254,243,199,0.45)]"
          style={{ background: "radial-gradient(circle at 35% 35%, #fffbeb 0%, #fef3c7 40%, #fde68a 70%, #d4a574 100%)", boxShadow: "inset -6px -6px 16px rgba(180,140,80,0.35), 0 0 50px rgba(254,243,199,0.4)" }}>
          <div className="absolute left-4 top-5 h-3.5 w-3.5 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(180,140,80,0.25), rgba(180,140,80,0.1))" }} />
          <div className="absolute right-5 top-9 h-2.5 w-2.5 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(180,140,80,0.22), rgba(180,140,80,0.08))" }} />
          <div className="absolute left-8 bottom-4 h-2 w-2 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(180,140,80,0.2), rgba(180,140,80,0.05))" }} />
        </div>
      </motion.div>

      {stars.map((s) => (
        <motion.span key={s.id} className="absolute rounded-full"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.size}px`, height: `${s.size}px`,
            backgroundColor: s.layer === 2 ? "#ffffff" : s.layer === 1 ? "rgba(255,255,255,0.92)" : "rgba(200,210,255,0.7)",
            boxShadow: s.layer === 2 ? "0 0 8px rgba(255,255,255,1), 0 0 16px rgba(150,180,255,0.6)" : s.layer === 1 ? "0 0 5px rgba(255,255,255,0.7)" : "0 0 2px rgba(200,210,255,0.4)" }}
          animate={{ opacity: s.layer === 0 ? [0.25, 0.65, 0.25] : [0.45, 1, 0.45], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}

      <motion.div className="absolute h-px" style={{ top: "12%", left: "-15%", width: "100px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)", boxShadow: "0 0 6px rgba(255,255,255,0.8)" }}
        animate={{ x: ["0vw", "130vw"], y: ["0vh", "15vh"], opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 10 + Math.random() * 12, ease: [0.2, 0, 0.8, 1] }} />
    </>
  );
}

/* ============ CLOUDY NIGHT ============ */
function CloudyNightScene({ filterId }: { filterId: string }) {
  const stars = useStars(60);
  const clouds = useClouds(7);
  const moonGlowUrl = `url(#${filterId}-moon-glow)`;

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_12%,rgba(99,102,241,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(168,85,247,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(30,27,75,0.35),transparent_60%)]" />

      <motion.div className="absolute right-12 top-8" animate={{ y: [0, -6, 0] }} transition={{ duration: 13, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}>
        <svg className="absolute -inset-20" viewBox="0 0 240 240" style={{ filter: "blur(10px)" }}>
          <circle cx="120" cy="120" r="90" fill={moonGlowUrl} opacity="0.7" />
        </svg>
        <svg className="absolute -inset-10" viewBox="0 0 180 180" style={{ filter: "blur(5px)" }}>
          <circle cx="90" cy="90" r="65" fill={moonGlowUrl} opacity="0.85" />
        </svg>
        <div className="relative h-16 w-16 rounded-full"
          style={{ background: "radial-gradient(circle at 35% 35%, #fffbeb 0%, #fef3c7 40%, #fde68a 70%, #c4a05a 100%)", boxShadow: "0 0 50px rgba(254,243,199,0.55), inset -5px -5px 14px rgba(160,120,60,0.3)", filter: "blur(1px)" }}>
          <div className="absolute left-3 top-4 h-2.5 w-2.5 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(160,120,60,0.22), rgba(160,120,60,0.08))" }} />
          <div className="absolute right-4 top-7 h-2 w-2 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(160,120,60,0.2), rgba(160,120,60,0.05))" }} />
        </div>
      </motion.div>

      {stars.map((s) => (
        <motion.span key={s.id} className="absolute rounded-full"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.size}px`, height: `${s.size}px`,
            backgroundColor: s.layer === 2 ? "#ffffff" : "rgba(255,255,255,0.85)",
            boxShadow: s.layer === 2 ? "0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(150,180,255,0.4)" : "0 0 3px rgba(255,255,255,0.5)" }}
          animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}

      {/* Dark moonlit clouds — CSS blurred clusters */}
      {clouds.map((c) => (
        <BlurredCloud
          key={c.id}
          data={c}
          color="rgba(100,116,139,0.85)"
          shadowColor="rgba(30,41,59,0.5)"
          highlight={false}
        />
      ))}
    </>
  );
}

/* ============ CLEAR SUNNY DAY ============ */
function ClearSunnyDayScene({ filterId }: { filterId: string }) {
  const dustMotes = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: 30 + Math.random() * 60,
    duration: 7 + Math.random() * 5, delay: i * 0.4,
  })), []);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 dark:from-sky-700 dark:via-sky-600 dark:to-sky-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgba(254,243,199,0.25),transparent_45%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sky-100/40 to-transparent dark:from-sky-300/20" />

      <motion.div className="absolute right-6 top-6" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}>
        <svg className="absolute -inset-20" viewBox="0 0 250 250" style={{ filter: "blur(14px)" }}>
          <circle cx="125" cy="125" r="100" fill={`url(#${filterId}-sun-core)`} opacity="0.45" />
        </svg>
        <svg className="absolute -inset-8" viewBox="0 0 180 180" style={{ filter: "blur(5px)" }}>
          <circle cx="90" cy="90" r="70" fill={`url(#${filterId}-sun-core)`} opacity="0.75" />
        </svg>
        <div className="relative h-16 w-16 rounded-full"
          style={{ background: `radial-gradient(circle at 40% 40%, #ffffff 0%, #fffbeb 20%, #fef3c7 45%, #fbbf24 70%, rgba(245,158,11,0) 100%)`, boxShadow: "0 0 50px rgba(254,243,199,0.8), 0 0 90px rgba(251,191,36,0.4)" }} />
      </motion.div>

      {dustMotes.map((m) => (
        <motion.span key={m.id} className="absolute h-1 w-1 rounded-full bg-white/40"
          style={{ left: `${m.left}%`, top: `${m.top}%` }}
          animate={{ y: [0, -20, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}
    </>
  );
}

/* ============ HOT SUNNY DAY ============ */
function HotSunnyDayScene({ filterId }: { filterId: string }) {
  const heatWaves = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
  const sparkles = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, left: Math.random() * 100, bottom: Math.random() * 40,
    duration: 4 + Math.random() * 3, delay: i * 0.35,
  })), []);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-orange-100 dark:from-sky-800 dark:via-sky-700 dark:to-orange-900/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgba(251,146,60,0.3),transparent_50%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-orange-200/30 to-transparent dark:from-orange-800/20" />

      <motion.div className="absolute right-5 top-5" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}>
        <svg className="absolute -inset-28" viewBox="0 0 350 350" style={{ filter: "blur(18px)" }}>
          <circle cx="175" cy="175" r="140" fill={`url(#${filterId}-sun-hot)`} opacity="0.5" />
        </svg>
        <svg className="absolute -inset-12" viewBox="0 0 260 260" style={{ filter: "blur(7px)" }}>
          <circle cx="130" cy="130" r="95" fill={`url(#${filterId}-sun-hot)`} opacity="0.8" />
        </svg>
        <div className="relative h-20 w-20 rounded-full"
          style={{ background: `radial-gradient(circle at 40% 40%, #ffffff 0%, #fef3c7 15%, #fbbf24 35%, #f97316 60%, #ea580c 85%, rgba(220,38,38,0) 100%)`, boxShadow: "0 0 70px rgba(249,115,22,0.8), 0 0 120px rgba(234,88,12,0.45)" }} />
      </motion.div>

      {heatWaves.map((i) => (
        <motion.div key={i} className="absolute bottom-0" style={{ left: `${i * 13 - 3}%`, width: "18%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0], y: [0, -40, -80], scaleX: [1, 1.15, 1], skewX: [0, 4, -4, 0] }}
          transition={{ duration: 4, delay: i * 0.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}>
          <div className="h-28 w-full bg-gradient-to-t from-orange-300/40 via-amber-200/20 to-transparent blur-md" />
        </motion.div>
      ))}

      {sparkles.map((s) => (
        <motion.span key={s.id} className="absolute h-1 w-1 rounded-full bg-orange-300/60"
          style={{ left: `${s.left}%`, bottom: `${s.bottom}%`, boxShadow: "0 0 4px rgba(249,115,22,0.5)" }}
          animate={{ y: [0, -30, -60], opacity: [0, 0.8, 0] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}
    </>
  );
}

/* ============ PARTLY CLOUDY DAY ============ */
function PartlyCloudyDayScene() {
  const clouds = useClouds(7);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 dark:from-sky-700 dark:via-sky-600 dark:to-sky-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgba(254,243,199,0.2),transparent_45%)]" />

      {/* Sun peeking top-right */}
      <SunCore size={56} top={20} right={24} />

      {/* Fluffy white clouds — CSS blurred clusters */}
      {clouds.map((c) => (
        <BlurredCloud key={c.id} data={c} />
      ))}
    </>
  );
}

/* ============ OVERCAST DAY ============ */
function OvercastDayScene() {
  const clouds = useClouds(8);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-200 dark:from-slate-600 dark:via-slate-500 dark:to-slate-400" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(241,245,249,0.25),transparent_60%)]" />

      {/* Dense gray clouds */}
      {clouds.map((c) => (
        <BlurredCloud
          key={c.id}
          data={{ ...c, top: c.top * 0.7, scale: c.scale * 1.3, opacity: Math.min(c.opacity + 0.3, 0.95) }}
          color="rgba(226,232,240,0.95)"
          shadowColor="rgba(71,85,105,0.4)"
          highlight={false}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-300/20 to-transparent" />
    </>
  );
}

/* ============ Sun core helper ============ */
function SunCore({ size, top, right }: { size: number; top: number; right: number }) {
  const filterId = useId();
  return (
    <motion.div
      className="absolute"
      style={{ top: `${top}px`, right: `${right}px` }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
    >
      <svg className="absolute -inset-16" viewBox="0 0 220 220" style={{ filter: "blur(12px)" }}>
        <circle cx="110" cy="110" r="85" fill={`url(#${filterId}-sc)`} opacity="0.45" />
      </svg>
      <svg className="absolute -inset-6" viewBox="0 0 160 160" style={{ filter: "blur(4px)" }}>
        <circle cx="80" cy="80" r="60" fill={`url(#${filterId}-sc)`} opacity="0.75" />
      </svg>
      <svg className="absolute h-0 w-0">
        <defs>
          <radialGradient id={`${filterId}-sc`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
            <stop offset="30%" stopColor="#fef3c7" stopOpacity="1" />
            <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <div
        className="relative rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: `radial-gradient(circle at 40% 40%, #ffffff 0%, #fffbeb 20%, #fef3c7 45%, #fbbf24 70%, rgba(245,158,11,0) 100%)`,
          boxShadow: "0 0 45px rgba(254,243,199,0.7), 0 0 80px rgba(251,191,36,0.3)",
        }}
      />
    </motion.div>
  );
}

/* ============ FOG ============ */
function FogScene() {
  const fogLayers = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i, top: 5 + i * 13, duration: 18 + i * 4, delay: i * 1.5,
    opacity: 0.15 + i * 0.04, blur: 15 + i * 4, direction: i % 2 === 0 ? 1 : -1,
  })), []);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(241,245,249,0.2),transparent_70%)]" />

      {fogLayers.map((f) => (
        <motion.div key={f.id} className="absolute h-32 w-[180%] rounded-full"
          style={{ top: `${f.top}%`, left: "-40%",
            background: `linear-gradient(to right, transparent, rgba(226,232,240,${f.opacity}), rgba(203,213,225,${f.opacity * 1.2}), rgba(226,232,240,${f.opacity}), transparent)`,
            filter: `blur(${f.blur}px)` }}
          animate={{ x: f.direction === 1 ? ["0%", "40%", "0%"] : ["0%", "-40%", "0%"] }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}

      <motion.div className="absolute inset-x-0 bottom-0 h-40 rounded-t-[50%]"
        style={{ background: "linear-gradient(to top, rgba(226,232,240,0.4), transparent)", filter: "blur(20px)" }}
        animate={{ opacity: [0.6, 0.8, 0.6], scaleX: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
    </>
  );
}

/* ============ RAIN / STORM ============ */
function RainScene({ isStorm }: { isStorm: boolean }) {
  const drops = useMemo(() => Array.from({ length: isStorm ? 100 : 70 }, (_, i) => {
    const layer = i % 3;
    return {
      id: i, left: Math.random() * 110 - 5, delay: Math.random() * 2,
      duration: layer === 0 ? 0.9 + Math.random() * 0.3 : layer === 1 ? 0.55 + Math.random() * 0.25 : 0.35 + Math.random() * 0.2,
      length: layer === 0 ? 14 + Math.random() * 10 : layer === 1 ? 22 + Math.random() * 14 : 30 + Math.random() * 22,
      opacity: layer === 0 ? 0.15 + Math.random() * 0.15 : layer === 1 ? 0.3 + Math.random() * 0.2 : 0.5 + Math.random() * 0.25,
      layer,
    };
  }), [isStorm]);

  const splashes = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: i * 0.15, size: 8 + Math.random() * 8,
  })), []);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-600 via-slate-500 to-slate-400 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700" />
      {isStorm && <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-800/60 to-transparent" />}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(147,197,253,0.08),transparent_60%)]" />

      <div className="absolute inset-0" style={{ transform: "skewX(-10deg)" }}>
        {drops.map((d) => (
          <motion.span key={d.id} className="absolute top-0"
            style={{ left: `${d.left}%`, width: d.layer === 2 ? "2px" : "1px", height: `${d.length}px`,
              background: d.layer === 2 ? "linear-gradient(to bottom, transparent, rgba(125,211,252,1) 30%, rgba(96,165,250,1))" : "linear-gradient(to bottom, transparent, rgba(147,197,253,0.85))",
              opacity: d.opacity + 0.1, boxShadow: d.layer === 2 ? "0 0 5px rgba(125,211,252,0.6)" : "none", borderRadius: "1px" }}
            initial={{ y: -80 }} animate={{ y: "140%" }}
            transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "linear" }} />
        ))}
      </div>

      {splashes.map((s) => (
        <motion.span key={`sp-${s.id}`} className="absolute bottom-3 rounded-full border-2 border-sky-200/70"
          style={{ left: `${s.left}%`, width: `${s.size}px`, height: `${s.size}px`, boxShadow: "0 0 4px rgba(125,211,252,0.3)" }}
          animate={{ scale: [0, 1.2, 3], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1, delay: s.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}

      {isStorm && (
        <>
          <motion.div className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0, 0.8, 0, 0, 0.5, 0, 0, 0.7, 0] }}
            transition={{ duration: 9, repeat: Infinity, repeatDelay: 4, times: [0, 0.3, 0.35, 0.4, 0.55, 0.57, 0.6, 0.75, 0.77, 1] }} />
          <motion.svg className="absolute left-[25%] top-0 h-60 w-32" viewBox="0 0 100 220"
            animate={{ opacity: [0, 0, 1, 0, 0, 0.9, 0] }}
            transition={{ duration: 9, repeat: Infinity, repeatDelay: 4, times: [0, 0.3, 0.35, 0.4, 0.55, 0.57, 1] }}>
            <path d="M 55 0 L 30 90 L 55 90 L 20 220 L 70 100 L 42 100 Z"
              fill="white" stroke="rgba(255,255,200,0.9)" strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 12px rgba(255,255,200,0.95))" }} />
          </motion.svg>
        </>
      )}
    </>
  );
}

/* ============ SNOW ============ */
function SnowScene() {
  const flakes = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const layer = i % 3;
    return {
      id: i, left: Math.random() * 100, delay: Math.random() * 7,
      duration: layer === 0 ? 9 + Math.random() * 5 : layer === 1 ? 6 + Math.random() * 4 : 4 + Math.random() * 3,
      size: layer === 0 ? 2 + Math.random() * 1.5 : layer === 1 ? 3.5 + Math.random() * 2.5 : 5 + Math.random() * 3.5,
      drift: (Math.random() - 0.5) * (layer === 0 ? 35 : layer === 1 ? 55 : 85), layer,
    };
  }), []);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(186,230,253,0.15),transparent_60%)]" />

      {flakes.map((f) => (
        <motion.span key={f.id} className="absolute top-0 rounded-full"
          style={{ left: `${f.left}%`, width: `${f.size}px`, height: `${f.size}px`,
            backgroundColor: f.layer === 2 ? "#ffffff" : "rgba(255,255,255,0.88)",
            boxShadow: f.layer === 2 ? "0 0 6px rgba(255,255,255,0.85), 0 0 12px rgba(186,230,253,0.4)" : "none",
            opacity: f.layer === 0 ? 0.5 : 0.9 }}
          initial={{ y: -20, x: 0 }}
          animate={{ y: "130%", x: [0, f.drift, 0], rotate: [0, 180, 360] }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(186,230,253,0.12))]" />
    </>
  );
}
