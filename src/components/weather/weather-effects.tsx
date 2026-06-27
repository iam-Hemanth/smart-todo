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
 * Apple Weather-quality animated scenes.
 *
 * Key techniques:
 *  - SVG turbulence filters for soft, organic cloud edges (no hard circles)
 *  - Multi-stop radial gradients for HDR-style sun cores with atmospheric bloom
 *  - Layered atmospheric haze (multiple semi-transparent gradients at different depths)
 *  - Parallax depth: 3 layers per particle system with different speed/size/blur
 *  - Smooth organic motion via cubic-bezier easing (not linear)
 *  - Subtle lens flare and god-ray effects for sunny scenes
 */
export function WeatherEffects({ weatherCode, isDay, temperature }: WeatherEffectsProps) {
  const scene = classifyScene(weatherCode, isDay, temperature);
  const filterId = useId();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Shared SVG defs for cloud soft-edge filters */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id={`${filterId}-cloud-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="40" />
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id={`${filterId}-cloud-soft-2`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.025" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="30" />
            <feGaussianBlur stdDeviation="2" />
          </filter>
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
      {scene === "partly-cloudy-day" && <PartlyCloudyDayScene filterId={filterId} />}
      {scene === "overcast-day" && <OvercastDayScene filterId={filterId} />}
      {scene === "fog" && <FogScene />}
      {(scene === "rain" || scene === "storm") && (
        <RainScene isStorm={scene === "storm"} />
      )}
      {scene === "snow" && <SnowScene />}
    </div>
  );
}

type Scene =
  | "clear-night"
  | "cloudy-night"
  | "clear-sunny"
  | "hot-sunny"
  | "partly-cloudy-day"
  | "overcast-day"
  | "fog"
  | "rain"
  | "storm"
  | "snow";

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

/* ============ Shared helpers ============ */

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  layer: number;
}

interface CloudShape {
  id: number;
  top: number;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
  layer: number;
}

function useStars(count: number): Star[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const layer = i % 3;
        return {
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 75,
          size: layer === 0 ? 0.8 + Math.random() : layer === 1 ? 1.5 + Math.random() * 1.5 : 2 + Math.random() * 2.5,
          delay: Math.random() * 4,
          duration: 2.5 + Math.random() * 4,
          layer,
        };
      }),
    [count],
  );
}

function useClouds(count: number): CloudShape[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const layer = i < count / 2 ? 0 : 1;
        return {
          id: i,
          top: 5 + Math.random() * 45,
          scale: layer === 0 ? 0.7 + Math.random() * 0.4 : 1.1 + Math.random() * 0.7,
          duration: layer === 0 ? 55 + Math.random() * 25 : 30 + Math.random() * 20,
          delay: i * 5,
          opacity: layer === 0 ? 0.25 + Math.random() * 0.15 : 0.5 + Math.random() * 0.25,
          layer,
        };
      }),
    [count],
  );
}

/* ============ CLEAR NIGHT ============ */
function ClearNightScene({ filterId }: { filterId: string }) {
  const stars = useStars(90);

  return (
    <>
      {/* Deep space atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_15%,rgba(99,102,241,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_70%,rgba(168,85,247,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(30,27,75,0.3),transparent_60%)]" />

      {/* Moon — HDR-style with multi-layer glow */}
      <motion.div
        className="absolute right-12 top-8"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
      >
        {/* Outer atmospheric bloom */}
        <div className="absolute inset-0 -m-16 rounded-full bg-amber-100/10 blur-2xl" />
        <svg className="absolute -inset-12" viewBox="0 0 200 200" style={{ filter: "blur(8px)" }}>
          <circle cx="100" cy="100" r="80" fill={"url(#" + filterId + "-moon-glow)"} />
        </svg>
        {/* Moon body — radial gradient with subtle texture */}
        <div className="relative h-20 w-20 rounded-full shadow-[0_0_60px_rgba(254,243,199,0.45)]"
          style={{
            background: "radial-gradient(circle at 35% 35%, #fffbeb 0%, #fef3c7 40%, #fde68a 70%, #d4a574 100%)",
            boxShadow: "inset -6px -6px 16px rgba(180,140,80,0.35), 0 0 50px rgba(254,243,199,0.4)",
          }}
        >
          {/* Craters — subtle indented shadows */}
          <div className="absolute left-4 top-5 h-3.5 w-3.5 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(180,140,80,0.25), rgba(180,140,80,0.1))" }} />
          <div className="absolute right-5 top-9 h-2.5 w-2.5 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(180,140,80,0.22), rgba(180,140,80,0.08))" }} />
          <div className="absolute left-8 bottom-4 h-2 w-2 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(180,140,80,0.2), rgba(180,140,80,0.05))" }} />
        </div>
      </motion.div>

      {/* 3-layer parallax stars with HDR glow */}
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.layer === 2 ? "#ffffff" : s.layer === 1 ? "rgba(255,255,255,0.92)" : "rgba(200,210,255,0.7)",
            boxShadow: s.layer === 2
              ? "0 0 8px rgba(255,255,255,1), 0 0 16px rgba(150,180,255,0.6)"
              : s.layer === 1
                ? "0 0 5px rgba(255,255,255,0.7)"
                : "0 0 2px rgba(200,210,255,0.4)",
          }}
          animate={{
            opacity: s.layer === 0 ? [0.25, 0.65, 0.25] : [0.45, 1, 0.45],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}

      {/* Shooting star — occasional, with trail */}
      <motion.div
        className="absolute h-px"
        style={{
          top: "12%",
          left: "-15%",
          width: "100px",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)",
          boxShadow: "0 0 6px rgba(255,255,255,0.8)",
        }}
        animate={{
          x: ["0vw", "130vw"],
          y: ["0vh", "15vh"],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 10 + Math.random() * 12,
          ease: [0.2, 0, 0.8, 1],
        }}
      />
    </>
  );
}

/* ============ CLOUDY NIGHT ============ */
function CloudyNightScene({ filterId }: { filterId: string }) {
  const stars = useStars(60);
  const clouds = useClouds(7);

  return (
    <>
      {/* Deep atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_12%,rgba(99,102,241,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(168,85,247,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(30,27,75,0.35),transparent_60%)]" />

      {/* Moon — bright glow piercing through clouds */}
      <motion.div
        className="absolute right-12 top-8"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
      >
        {/* Large atmospheric bloom */}
        <svg className="absolute -inset-20" viewBox="0 0 240 240" style={{ filter: "blur(10px)" }}>
          <circle cx="120" cy="120" r="90" fill={"url(#" + filterId + "-moon-glow)"} opacity="0.7" />
        </svg>
        {/* Mid glow */}
        <svg className="absolute -inset-10" viewBox="0 0 180 180" style={{ filter: "blur(5px)" }}>
          <circle cx="90" cy="90" r="65" fill={"url(#" + filterId + "-moon-glow)"} opacity="0.85" />
        </svg>
        {/* Moon body — visible but slightly diffused (behind thin clouds) */}
        <div
          className="relative h-16 w-16 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, #fffbeb 0%, #fef3c7 40%, #fde68a 70%, #c4a05a 100%)",
            boxShadow: "0 0 50px rgba(254,243,199,0.55), inset -5px -5px 14px rgba(160,120,60,0.3)",
            filter: "blur(1px)",
          }}
        >
          <div className="absolute left-3 top-4 h-2.5 w-2.5 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(160,120,60,0.22), rgba(160,120,60,0.08))" }} />
          <div className="absolute right-4 top-7 h-2 w-2 rounded-full" style={{ background: "radial-gradient(circle at 40% 40%, rgba(160,120,60,0.2), rgba(160,120,60,0.05))" }} />
        </div>
      </motion.div>

      {/* Brighter stars (more visible through cloud breaks) */}
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.layer === 2 ? "#ffffff" : "rgba(255,255,255,0.85)",
            boxShadow: s.layer === 2 ? "0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(150,180,255,0.4)" : "0 0 3px rgba(255,255,255,0.5)",
          }}
          animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}

      {/* Volumetric clouds — moonlit, with soft organic edges + highlights */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top}%`,
            opacity: Math.min(c.opacity + 0.15, 0.9),
            transform: `scale(${c.scale})`,
          }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        >
          <svg width="220" height="95" viewBox="0 0 220 95" filter={c.layer === 0 ? `url(#${filterId}-cloud-soft)` : `url(#${filterId}-cloud-soft-2)`}>
            <defs>
              <radialGradient id={`night-cloud-${c.id}`} cx="65%" cy="25%" r="80%">
                <stop offset="0%" stopColor="rgba(148,163,184,0.85)" />
                <stop offset="50%" stopColor="rgba(100,116,139,0.8)" />
                <stop offset="100%" stopColor="rgba(51,65,85,0.75)" />
              </radialGradient>
            </defs>
            <ellipse cx="55" cy="58" rx="48" ry="30" fill={`url(#night-cloud-${c.id})`} />
            <ellipse cx="105" cy="42" rx="55" ry="36" fill={`url(#night-cloud-${c.id})`} />
            <ellipse cx="160" cy="50" rx="50" ry="32" fill={`url(#night-cloud-${c.id})`} />
            {/* Moonlit highlight on top edge */}
            <ellipse cx="105" cy="28" rx="40" ry="8" fill="rgba(254,243,199,0.15)" />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

/* ============ CLEAR SUNNY DAY ============ */
function ClearSunnyDayScene({ filterId }: { filterId: string }) {
  const dustMotes = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 30 + Math.random() * 60,
      duration: 7 + Math.random() * 5,
      delay: i * 0.4,
    })),
    [],
  );

  return (
    <>
      {/* Warm atmospheric sky glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_12%,rgba(251,191,36,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(254,215,170,0.15),transparent_60%)]" />

      {/* Sun — HDR radial gradient core + atmospheric bloom */}
      <motion.div
        className="absolute -right-4 -top-4"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
      >
        {/* Outer atmospheric haze — very wide soft glow */}
        <svg className="absolute -inset-24" viewBox="0 0 300 300" style={{ filter: "blur(16px)" }}>
          <circle cx="150" cy="150" r="120" fill={"url(#" + filterId + "-sun-core)"} opacity="0.5" />
        </svg>
        {/* Mid bloom */}
        <svg className="absolute -inset-10" viewBox="0 0 200 200" style={{ filter: "blur(6px)" }}>
          <circle cx="100" cy="100" r="80" fill={"url(#" + filterId + "-sun-core)"} opacity="0.8" />
        </svg>
        {/* Sun core — sharp HDR radial gradient */}
        <div
          className="relative h-24 w-24 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, #fffbeb 0%, #fef3c7 25%, #fbbf24 55%, #f59e0b 80%, rgba(245,158,11,0) 100%)`,
            boxShadow: "0 0 60px rgba(251,191,36,0.7), 0 0 100px rgba(245,158,11,0.4)",
          }}
        />
      </motion.div>

      {/* Slowly rotating god rays — very subtle */}
      <motion.div
        className="absolute -right-8 -top-8 h-48 w-48"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.25 }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-200/30 to-amber-100/0"
            style={{ rotate: `${i * 45}deg` }}
          />
        ))}
      </motion.div>

      {/* Floating dust motes — atmospheric depth */}
      {dustMotes.map((m) => (
        <motion.span
          key={m.id}
          className="absolute h-1 w-1 rounded-full bg-amber-200/50"
          style={{ left: `${m.left}%`, top: `${m.top}%`, boxShadow: "0 0 3px rgba(251,191,36,0.3)" }}
          animate={{ y: [0, -25, 0], opacity: [0, 0.7, 0] }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}
    </>
  );
}

/* ============ HOT SUNNY DAY ============ */
function HotSunnyDayScene({ filterId }: { filterId: string }) {
  const heatWaves = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);
  const sparkles = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      bottom: Math.random() * 40,
      duration: 4 + Math.random() * 3,
      delay: i * 0.35,
    })),
    [],
  );

  return (
    <>
      {/* Intense heat atmospheric glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_12%,rgba(249,115,22,0.28),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(234,88,12,0.18),transparent_55%)]" />

      {/* Blazing sun — intense HDR core */}
      <motion.div
        className="absolute -right-6 -top-6"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
      >
        {/* Massive outer haze */}
        <svg className="absolute -inset-32" viewBox="0 0 400 400" style={{ filter: "blur(20px)" }}>
          <circle cx="200" cy="200" r="160" fill={"url(#" + filterId + "-sun-hot)"} opacity="0.55" />
        </svg>
        {/* Mid bloom */}
        <svg className="absolute -inset-14" viewBox="0 0 300 300" style={{ filter: "blur(8px)" }}>
          <circle cx="150" cy="150" r="110" fill={"url(#" + filterId + "-sun-hot)"} opacity="0.85" />
        </svg>
        {/* Sun core — blazing white-orange */}
        <div
          className="relative h-28 w-28 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, #ffffff 0%, #fef3c7 15%, #fbbf24 35%, #f97316 60%, #ea580c 85%, rgba(220,38,38,0) 100%)`,
            boxShadow: "0 0 80px rgba(249,115,22,0.8), 0 0 140px rgba(234,88,12,0.5)",
          }}
        />
      </motion.div>

      {/* God rays — more intense, faster rotation */}
      <motion.div
        className="absolute -right-10 -top-10 h-56 w-56"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.35 }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-28 w-1 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-orange-400/0 via-orange-300/40 to-amber-200/0"
            style={{ rotate: `${i * 30}deg` }}
          />
        ))}
      </motion.div>

      {/* Heat shimmer — rising distortion waves */}
      {heatWaves.map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: `${i * 11 - 2}%`, width: "16%" }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            y: [0, -45, -90],
            scaleX: [1, 1.18, 1],
            skewX: [0, 4, -4, 0],
          }}
          transition={{
            duration: 4,
            delay: i * 0.45,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        >
          <div className="h-32 w-full bg-gradient-to-t from-orange-300/45 via-amber-200/25 to-transparent blur-md" />
        </motion.div>
      ))}

      {/* Heat sparkles rising */}
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          className="absolute h-1 w-1 rounded-full bg-orange-300/70"
          style={{ left: `${s.left}%`, bottom: `${s.bottom}%`, boxShadow: "0 0 4px rgba(249,115,22,0.6)" }}
          animate={{ y: [0, -35, -70], opacity: [0, 0.9, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}
    </>
  );
}

/* ============ PARTLY CLOUDY DAY ============ */
function PartlyCloudyDayScene({ filterId }: { filterId: string }) {
  const clouds = useClouds(6);

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(251,191,36,0.18),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(186,230,253,0.12),transparent_60%)]" />

      {/* Sun peeking top-right with HDR glow */}
      <motion.div
        className="absolute -right-6 -top-6"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
      >
        <svg className="absolute -inset-20" viewBox="0 0 250 250" style={{ filter: "blur(14px)" }}>
          <circle cx="125" cy="125" r="100" fill={"url(#" + filterId + "-sun-core)"} opacity="0.5" />
        </svg>
        <svg className="absolute -inset-8" viewBox="0 0 180 180" style={{ filter: "blur(5px)" }}>
          <circle cx="90" cy="90" r="70" fill={"url(#" + filterId + "-sun-core)"} opacity="0.85" />
        </svg>
        <div
          className="relative h-20 w-20 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, #fffbeb 0%, #fef3c7 25%, #fbbf24 55%, #f59e0b 80%, rgba(245,158,11,0) 100%)`,
            boxShadow: "0 0 50px rgba(251,191,36,0.65), 0 0 90px rgba(245,158,11,0.35)",
          }}
        />
      </motion.div>

      {/* Subtle god rays */}
      <motion.div
        className="absolute -right-6 -top-6 h-40 w-40"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.2 }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-20 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-200/35 to-amber-100/0"
            style={{ rotate: `${i * 45}deg` }}
          />
        ))}
      </motion.div>

      {/* Volumetric fluffy clouds — SVG turbulence filter for soft organic edges */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top}%`,
            opacity: Math.min(c.opacity + 0.2, 0.95),
            transform: `scale(${c.scale})`,
          }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        >
          <svg width="200" height="90" viewBox="0 0 200 90" filter={c.layer === 0 ? `url(#${filterId}-cloud-soft)` : `url(#${filterId}-cloud-soft-2)`}>
            {/* Cloud body — layered ellipses with soft gradient for 3D volume */}
            <defs>
              <radialGradient id={`${filterId}-cloud-grad-${c.id}`} cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="70%" stopColor="#f1f5f9" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.8" />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="55" rx="42" ry="28" fill={`url(#${filterId}-cloud-grad-${c.id})`} />
            <ellipse cx="95" cy="42" rx="50" ry="35" fill={`url(#${filterId}-cloud-grad-${c.id})`} />
            <ellipse cx="145" cy="50" rx="44" ry="30" fill={`url(#${filterId}-cloud-grad-${c.id})`} />
            {/* Soft shadow underneath */}
            <ellipse cx="100" cy="72" rx="80" ry="10" fill="rgba(148,163,184,0.15)" />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

/* ============ OVERCAST DAY ============ */
function OvercastDayScene({ filterId }: { filterId: string }) {
  const clouds = useClouds(8);

  return (
    <>
      {/* Heavy overcast sky wash */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-slate-400/35 via-slate-300/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(203,213,225,0.3),transparent_60%)]" />

      {/* Dense volumetric clouds — multiple SVG-filtered layers for realistic overcast */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top * 0.65}%`,
            opacity: Math.min(c.opacity + 0.35, 0.95),
            transform: `scale(${c.scale * 1.3})`,
          }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration * 1.2,
            delay: c.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        >
          <svg width="280" height="110" viewBox="0 0 280 110" filter={c.layer === 0 ? `url(#${filterId}-cloud-soft)` : `url(#${filterId}-cloud-soft-2)`}>
            <defs>
              <radialGradient id={`${filterId}-overcast-grad-${c.id}`} cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.7" />
              </radialGradient>
            </defs>
            <ellipse cx="55" cy="65" rx="50" ry="35" fill={`url(#${filterId}-overcast-grad-${c.id})`} />
            <ellipse cx="110" cy="48" rx="58" ry="40" fill={`url(#${filterId}-overcast-grad-${c.id})`} />
            <ellipse cx="170" cy="55" rx="55" ry="38" fill={`url(#${filterId}-overcast-grad-${c.id})`} />
            <ellipse cx="225" cy="62" rx="48" ry="32" fill={`url(#${filterId}-overcast-grad-${c.id})`} />
            {/* Shadow base */}
            <ellipse cx="140" cy="88" rx="120" ry="12" fill="rgba(100,116,139,0.2)" />
          </svg>
        </motion.div>
      ))}

      {/* Static haze layer for depth */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-300/15 to-transparent" />
    </>
  );
}

/* ============ FOG ============ */
function FogScene() {
  return (
    <>
      {/* 6 volumetric fog layers drifting at different speeds */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute h-24 w-[160%] rounded-full"
          style={{
            top: `${8 + i * 15}%`,
            background: `linear-gradient(to right, transparent, rgba(203,213,225,${0.2 + i * 0.04}), rgba(203,213,225,${0.25 + i * 0.05}), transparent)`,
            filter: `blur(${18 + i * 5}px)`,
          }}
          initial={{ x: i % 2 === 0 ? "-30%" : "15%" }}
          animate={{ x: i % 2 === 0 ? "30%" : "-30%" }}
          transition={{
            duration: 16 + i * 5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}
      {/* Overall milky wash */}
      <div className="absolute inset-0 bg-slate-200/10" />
    </>
  );
}

/* ============ RAIN / STORM ============ */
function RainScene({ isStorm }: { isStorm: boolean }) {
  const drops = useMemo(
    () => Array.from({ length: isStorm ? 90 : 60 }, (_, i) => {
      const layer = i % 3;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: layer === 0 ? 0.9 + Math.random() * 0.3 : layer === 1 ? 0.55 + Math.random() * 0.25 : 0.35 + Math.random() * 0.2,
        length: layer === 0 ? 12 + Math.random() * 8 : layer === 1 ? 20 + Math.random() * 12 : 28 + Math.random() * 18,
        opacity: layer === 0 ? 0.15 + Math.random() * 0.15 : layer === 1 ? 0.3 + Math.random() * 0.2 : 0.5 + Math.random() * 0.25,
        layer,
      };
    }),
    [isStorm],
  );

  const ripples = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: i * 0.18,
    })),
    [],
  );

  return (
    <>
      {/* Dark stormy sky for thunderstorm */}
      {isStorm && (
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-slate-800/55 to-transparent" />
      )}
      {/* Rainy atmosphere wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(147,197,253,0.1),transparent_60%)]" />

      {/* 3-layer rain streaks with motion-blur gradient */}
      {drops.map((d) => (
        <motion.span
          key={d.id}
          className="absolute top-0"
          style={{
            left: `${d.left}%`,
            width: d.layer === 2 ? "1.5px" : "1px",
            height: `${d.length}px`,
            background: d.layer === 2
              ? "linear-gradient(to bottom, transparent, rgba(125,211,252,0.9) 30%, rgba(96,165,250,0.95))"
              : "linear-gradient(to bottom, transparent, rgba(147,197,253,0.7))",
            opacity: d.opacity,
            boxShadow: d.layer === 2 ? "0 0 4px rgba(125,211,252,0.5)" : "none",
            borderRadius: "1px",
          }}
          initial={{ y: -50 }}
          animate={{ y: "130%" }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Puddle ripples at the bottom */}
      {ripples.map((r) => (
        <motion.span
          key={`ripple-${r.id}`}
          className="absolute bottom-3 h-5 w-5 rounded-full border border-sky-300/50"
          style={{ left: `${r.left}%` }}
          animate={{
            scale: [0, 1, 2.2],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 1.4,
            delay: r.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}

      {/* Lightning for thunderstorm */}
      {isStorm && (
        <>
          <motion.div
            className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0, 0.75, 0, 0, 0.45, 0, 0, 0.65, 0] }}
            transition={{
              duration: 9,
              repeat: Infinity,
              repeatDelay: 4,
              times: [0, 0.32, 0.37, 0.42, 0.58, 0.6, 0.63, 0.78, 0.8, 1],
            }}
          />
          <motion.svg
            className="absolute left-[28%] top-0 h-52 w-28"
            viewBox="0 0 100 200"
            animate={{ opacity: [0, 0, 1, 0, 0, 0.85, 0] }}
            transition={{
              duration: 9,
              repeat: Infinity,
              repeatDelay: 4,
              times: [0, 0.32, 0.37, 0.42, 0.58, 0.6, 1],
            }}
          >
            <path
              d="M 55 0 L 35 80 L 55 80 L 30 200 L 65 90 L 45 90 Z"
              fill="white"
              stroke="rgba(255,255,200,0.9)"
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 10px rgba(255,255,200,0.95))" }}
            />
          </motion.svg>
        </>
      )}
    </>
  );
}

/* ============ SNOW ============ */
function SnowScene() {
  const flakes = useMemo(
    () => Array.from({ length: 70 }, (_, i) => {
      const layer = i % 3;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 7,
        duration: layer === 0 ? 9 + Math.random() * 5 : layer === 1 ? 6 + Math.random() * 4 : 4 + Math.random() * 3,
        size: layer === 0 ? 2 + Math.random() * 1.5 : layer === 1 ? 3.5 + Math.random() * 2.5 : 5 + Math.random() * 3.5,
        drift: (Math.random() - 0.5) * (layer === 0 ? 35 : layer === 1 ? 55 : 85),
        layer,
      };
    }),
    [],
  );

  return (
    <>
      {/* Cool atmospheric glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(186,230,253,0.15),transparent_60%)]" />

      {/* 3-layer parallax snowflakes with glow */}
      {flakes.map((f) => (
        <motion.span
          key={f.id}
          className="absolute top-0 rounded-full"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            backgroundColor: f.layer === 2 ? "#ffffff" : "rgba(255,255,255,0.88)",
            boxShadow: f.layer === 2 ? "0 0 6px rgba(255,255,255,0.85), 0 0 12px rgba(186,230,253,0.4)" : "none",
            opacity: f.layer === 0 ? 0.5 : 0.9,
          }}
          initial={{ y: -20, x: 0 }}
          animate={{ y: "130%", x: [0, f.drift, 0], rotate: [0, 180, 360] }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      ))}

      {/* Frost vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(186,230,253,0.12))]" />
    </>
  );
}
