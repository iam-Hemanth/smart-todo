"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { getWeatherInfo } from "@/lib/weather";

interface WeatherEffectsProps {
  weatherCode: number;
  isDay: boolean;
  temperature: number;
}

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Cloud {
  id: number;
  top: number;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
}

/**
 * Renders a full-scene ambient background based on the current weather.
 * Each scene is a distinct combination of gradient + particles + celestial body.
 */
export function WeatherEffects({ weatherCode, isDay, temperature }: WeatherEffectsProps) {
  const info = getWeatherInfo(weatherCode, isDay ? 1 : 0);
  const scene = classifyScene(weatherCode, isDay, temperature);

  // Stable random distributions per mount
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    [],
  );

  const clouds = useMemo<Cloud[]>(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        top: 10 + Math.random() * 40,
        scale: 0.8 + Math.random() * 1.2,
        duration: 30 + Math.random() * 30,
        delay: i * 8,
        opacity: 0.3 + Math.random() * 0.3,
      })),
    [],
  );

  const heatWaves = useMemo(
    () => Array.from({ length: 6 }, (_, i) => i),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {scene === "clear-night" && <ClearNightScene stars={stars} />}
      {scene === "cloudy-night" && <CloudyNightScene stars={stars} clouds={clouds} />}
      {scene === "clear-sunny" && <ClearSunnyDayScene />}
      {scene === "hot-sunny" && <HotSunnyDayScene heatWaves={heatWaves} />}
      {scene === "partly-cloudy-day" && (
        <PartlyCloudyDayScene clouds={clouds} />
      )}
      {scene === "overcast-day" && <OvercastDayScene clouds={clouds} />}
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

function classifyScene(
  weatherCode: number,
  isDay: boolean,
  temperature: number,
): Scene {
  // Rain / drizzle / showers
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "rain";
  }
  // Thunderstorm
  if ([95, 96, 99].includes(weatherCode)) {
    return "storm";
  }
  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "snow";
  }
  // Fog
  if ([45, 48].includes(weatherCode)) {
    return "fog";
  }
  // Overcast
  if (weatherCode === 3) {
    return isDay ? "overcast-day" : "cloudy-night";
  }
  // Partly cloudy
  if (weatherCode === 2) {
    return isDay ? "partly-cloudy-day" : "cloudy-night";
  }
  // Clear / mainly clear
  if (weatherCode === 0 || weatherCode === 1) {
    if (!isDay) return "clear-night";
    if (temperature >= 32) return "hot-sunny";
    return "clear-sunny";
  }
  // Fallback
  return isDay ? "clear-sunny" : "clear-night";
}

/* ============ Scenes ============ */

function ClearNightScene({ stars }: { stars: Star[] }) {
  return (
    <>
      {/* Moon — bigger and brighter */}
      <motion.div
        className="absolute right-8 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-amber-50 to-amber-200 shadow-[0_0_60px_rgba(254,243,199,0.5)]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Crater detail */}
        <div className="absolute left-4 top-5 h-3 w-3 rounded-full bg-amber-200/50" />
        <div className="absolute right-5 top-10 h-2 w-2 rounded-full bg-amber-200/40" />
        <div className="absolute left-8 bottom-4 h-1.5 w-1.5 rounded-full bg-amber-200/30" />
      </motion.div>
      {/* Stars — bigger and brighter */}
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size + 1}px`,
            height: `${s.size + 1}px`,
            boxShadow: "0 0 4px rgba(255,255,255,0.6)",
          }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function CloudyNightScene({ stars, clouds }: { stars: Star[]; clouds: Cloud[] }) {
  return (
    <>
      {/* Moon behind clouds — still visible but dimmer */}
      <motion.div
        className="absolute right-10 top-8 h-16 w-16 rounded-full bg-amber-100/70 blur-[2px] shadow-[0_0_40px_rgba(254,243,199,0.3)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Stars — fewer but visible */}
      {stars.slice(0, 20).map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            boxShadow: "0 0 3px rgba(255,255,255,0.5)",
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Drifting dark clouds */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute h-16 w-36 rounded-full bg-slate-600/40 blur-2xl"
          style={{ top: `${c.top}%`, opacity: c.opacity * 0.8 }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
}

function ClearSunnyDayScene() {
  const rays = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <>
      {/* Sun with pulsing glow */}
      <motion.div
        className="absolute -right-8 -top-8 h-32 w-32"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {rays.map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-16 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-300/40 to-amber-200/0"
            style={{ rotate: `${i * 30}deg` }}
          />
        ))}
      </motion.div>
      <motion.div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function HotSunnyDayScene({ heatWaves }: { heatWaves: number[] }) {
  const rays = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);
  return (
    <>
      {/* Intense sun with more rays */}
      <motion.div
        className="absolute -right-10 -top-10 h-40 w-40"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {rays.map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-20 w-1 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-orange-400/0 via-orange-400/50 to-amber-300/0"
            style={{ rotate: `${i * 22.5}deg` }}
          />
        ))}
      </motion.div>
      <motion.div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-400/50 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.6)]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Heat shimmer waves rising from bottom */}
      {heatWaves.map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 h-24 w-full"
          style={{ left: `${i * 16 - 8}%`, width: "20%" }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.25, 0],
            y: [0, -30, -60],
            scaleX: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            delay: i * 0.6,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <div className="h-full w-full bg-gradient-to-t from-orange-300/30 to-transparent blur-md" />
        </motion.div>
      ))}
    </>
  );
}

function PartlyCloudyDayScene({ clouds }: { clouds: Cloud[] }) {
  const rays = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
  return (
    <>
      {/* Sun peeking from top-right */}
      <motion.div
        className="absolute -right-10 -top-10 h-28 w-28"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        {rays.map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-14 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-300/40 to-amber-200/0"
            style={{ rotate: `${i * 45}deg` }}
          />
        ))}
      </motion.div>
      <motion.div
        className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-300/40 blur-2xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Drifting white clouds */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute h-16 w-36 rounded-full bg-white"
          style={{
            top: `${c.top}%`,
            opacity: c.opacity,
            filter: "blur(6px)",
            transform: `scale(${c.scale})`,
          }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Cloud puffs */}
          <div className="absolute left-4 top-2 h-12 w-12 rounded-full bg-white" />
          <div className="absolute left-12 top-0 h-14 w-14 rounded-full bg-white" />
          <div className="absolute left-20 top-3 h-10 w-10 rounded-full bg-white" />
        </motion.div>
      ))}
    </>
  );
}

function OvercastDayScene({ clouds }: { clouds: Cloud[] }) {
  return (
    <>
      {/* Dense gray clouds filling the top */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute h-20 w-48 rounded-full bg-slate-400/40"
          style={{
            top: `${c.top * 0.6}%`,
            opacity: c.opacity + 0.15,
            filter: "blur(12px)",
            transform: `scale(${c.scale * 1.3})`,
          }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration * 1.3,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      {/* Extra static cloud cover */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-300/30 to-transparent" />
    </>
  );
}

function FogScene() {
  return (
    <>
      {/* Layered fog bands drifting slowly */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute h-16 w-[140%] rounded-full bg-slate-300/30 blur-2xl"
          style={{ top: `${15 + i * 20}%` }}
          initial={{ x: "-20%" }}
          animate={{ x: i % 2 === 0 ? "20%" : "-20%" }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function RainScene({ isStorm }: { isStorm: boolean }) {
  const drops = useMemo(
    () =>
      Array.from({ length: isStorm ? 50 : 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 0.5 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
        length: 14 + Math.random() * 20,
      })),
    [isStorm],
  );

  return (
    <>
      {/* Dark storm clouds for thunderstorm */}
      {isStorm && (
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-800/40 to-transparent" />
      )}
      {drops.map((d) => (
        <motion.span
          key={d.id}
          className="absolute top-0 w-px bg-gradient-to-b from-transparent via-sky-400 to-sky-300"
          style={{
            left: `${d.left}%`,
            height: `${d.length}px`,
            opacity: d.opacity,
          }}
          initial={{ y: -40 }}
          animate={{ y: "120%" }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      {/* Lightning flash for thunderstorm */}
      {isStorm && (
        <motion.div
          className="absolute inset-0 bg-white"
          animate={{ opacity: [0, 0, 0.6, 0, 0, 0.3, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatDelay: 5,
            times: [0, 0.4, 0.45, 0.5, 0.65, 0.67, 1],
          }}
        />
      )}
    </>
  );
}

function SnowScene() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 5 + Math.random() * 5,
        size: 3 + Math.random() * 5,
        drift: (Math.random() - 0.5) * 50,
      })),
    [],
  );
  return (
    <>
      {flakes.map((f) => (
        <motion.span
          key={f.id}
          className="absolute top-0 rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: 0.8,
          }}
          initial={{ y: -20, x: 0 }}
          animate={{ y: "120%", x: [0, f.drift, 0] }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
}
