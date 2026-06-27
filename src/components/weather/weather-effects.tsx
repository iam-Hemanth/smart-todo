"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { getWeatherInfo } from "@/lib/weather";

interface WeatherEffectsProps {
  weatherCode: number;
  isDay: boolean;
}

/**
 * Lightweight particle effects layered behind the weather card.
 * Uses CSS animations driven by Framer Motion for cheap, GPU-friendly motion.
 */
export function WeatherEffects({ weatherCode, isDay }: WeatherEffectsProps) {
  const info = getWeatherInfo(weatherCode, isDay ? 1 : 0);

  // Stable random distribution per mount — avoids SSR/CSR mismatch
  const rainDrops = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 0.6 + Math.random() * 0.6,
        opacity: 0.25 + Math.random() * 0.35,
        length: 12 + Math.random() * 18,
      })),
    [],
  );

  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 4,
        size: 3 + Math.random() * 5,
        drift: (Math.random() - 0.5) * 40,
      })),
    [],
  );

  const sunRays = useMemo(
    () => Array.from({ length: 8 }, (_, i) => i),
    [],
  );

  // Rain / drizzle / showers / thunderstorm
  if (info.isRaining) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {rainDrops.map((d) => (
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
        {info.isStorm && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.5, 0, 0, 0.2, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatDelay: 4,
              times: [0, 0.45, 0.5, 0.55, 0.7, 0.72, 1],
            }}
          />
        )}
      </div>
    );
  }

  // Snow
  if (info.isSnowing) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {snowFlakes.map((f) => (
          <motion.span
            key={f.id}
            className="absolute top-0 rounded-full bg-white"
            style={{
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              opacity: 0.7,
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
      </div>
    );
  }

  // Sunny / clear — rotating rays
  if ((weatherCode === 0 || weatherCode === 1) && isDay) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {sunRays.map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-32 w-1 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-300/40 to-amber-200/0"
              style={{ rotate: `${i * 45}deg` }}
            />
          ))}
        </motion.div>
        <motion.div
          className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-300/30 blur-2xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  // Cloudy / overcast / fog — drifting cloud blobs
  if ([2, 3, 45, 48].includes(weatherCode)) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-20 w-40 rounded-full bg-white/40 dark:bg-white/5 blur-2xl"
            style={{ top: `${20 + i * 25}%` }}
            initial={{ x: "-30%" }}
            animate={{ x: "130%" }}
            transition={{
              duration: 28 + i * 8,
              repeat: Infinity,
              ease: "linear",
              delay: i * 6,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
