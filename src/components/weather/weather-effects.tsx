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
  layer: number; // 0 = far (smaller, dimmer), 1 = near (bigger, brighter)
}

interface Cloud {
  id: number;
  top: number;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
  layer: number;
}

interface Drop {
  id: number;
  left: number;
  delay: number;
  duration: number;
  length: number;
  opacity: number;
  layer: number;
}

interface Flake {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  layer: number;
}

/**
 * Renders a cinematic, layered ambient background based on the current weather.
 * Each scene uses multiple parallax depth layers, glow effects, and smooth
 * organic motion for a premium, 4K-quality feel.
 */
export function WeatherEffects({ weatherCode, isDay, temperature }: WeatherEffectsProps) {
  const scene = classifyScene(weatherCode, isDay, temperature);

  // Stable random distributions per mount — 2-layer parallax
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const layer = i % 3; // 3 layers: far, mid, near
      return {
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 75,
        size: layer === 0 ? 0.8 + Math.random() : layer === 1 ? 1.5 + Math.random() * 1.5 : 2 + Math.random() * 2,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3.5,
        layer,
      };
    });
  }, []);

  const clouds = useMemo<Cloud[]>(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const layer = i < 3 ? 0 : 1;
      return {
        id: i,
        top: 5 + Math.random() * 45,
        scale: layer === 0 ? 0.7 + Math.random() * 0.5 : 1.1 + Math.random() * 0.8,
        duration: layer === 0 ? 50 + Math.random() * 30 : 25 + Math.random() * 20,
        delay: i * 6,
        opacity: layer === 0 ? 0.2 + Math.random() * 0.2 : 0.4 + Math.random() * 0.3,
        layer,
      };
    });
  }, []);

  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: 70 }, (_, i) => {
      const layer = i % 3;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: layer === 0 ? 0.8 + Math.random() * 0.4 : layer === 1 ? 0.5 + Math.random() * 0.3 : 0.35 + Math.random() * 0.25,
        length: layer === 0 ? 10 + Math.random() * 10 : layer === 1 ? 18 + Math.random() * 14 : 24 + Math.random() * 20,
        opacity: layer === 0 ? 0.15 + Math.random() * 0.15 : layer === 1 ? 0.3 + Math.random() * 0.25 : 0.45 + Math.random() * 0.3,
        layer,
      };
    });
  }, []);

  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const layer = i % 3;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: layer === 0 ? 8 + Math.random() * 5 : layer === 1 ? 5 + Math.random() * 4 : 3.5 + Math.random() * 3,
        size: layer === 0 ? 2 + Math.random() * 2 : layer === 1 ? 3.5 + Math.random() * 3 : 5 + Math.random() * 4,
        drift: (Math.random() - 0.5) * (layer === 0 ? 30 : layer === 1 ? 50 : 80),
        layer,
      };
    });
  }, []);

  const heatWaves = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

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
        <RainScene drops={drops} isStorm={scene === "storm"} />
      )}
      {scene === "snow" && <SnowScene flakes={flakes} />}
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
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "rain";
  }
  if ([95, 96, 99].includes(weatherCode)) {
    return "storm";
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "snow";
  }
  if ([45, 48].includes(weatherCode)) {
    return "fog";
  }
  if (weatherCode === 3) {
    return isDay ? "overcast-day" : "cloudy-night";
  }
  if (weatherCode === 2) {
    return isDay ? "partly-cloudy-day" : "cloudy-night";
  }
  if (weatherCode === 0 || weatherCode === 1) {
    if (!isDay) return "clear-night";
    if (temperature >= 32) return "hot-sunny";
    return "clear-sunny";
  }
  return isDay ? "clear-sunny" : "clear-night";
}

/* ============ Scenes — cinematic, layered, premium ============ */

function ClearNightScene({ stars }: { stars: Star[] }) {
  return (
    <>
      {/* Distant nebula glow — adds depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(168,85,247,0.1),transparent_50%)]" />

      {/* Moon with multi-layer glow + craters */}
      <motion.div
        className="absolute right-10 top-6"
        animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer atmospheric glow */}
        <div className="absolute inset-0 -m-8 rounded-full bg-amber-200/10 blur-2xl" />
        {/* Mid glow */}
        <div className="absolute inset-0 -m-4 rounded-full bg-amber-100/20 blur-xl" />
        {/* Moon body with gradient + texture */}
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 shadow-[0_0_60px_rgba(254,243,199,0.4),inset_-8px_-8px_20px_rgba(180,150,100,0.3)]">
          <div className="absolute left-4 top-5 h-3.5 w-3.5 rounded-full bg-amber-200/50 shadow-inner" />
          <div className="absolute right-5 top-9 h-2.5 w-2.5 rounded-full bg-amber-200/40" />
          <div className="absolute left-8 bottom-4 h-2 w-2 rounded-full bg-amber-200/35" />
          <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-amber-200/30" />
        </div>
      </motion.div>

      {/* 3-layer parallax stars with glow */}
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.layer === 2 ? "#ffffff" : s.layer === 1 ? "rgba(255,255,255,0.9)" : "rgba(200,210,255,0.7)",
            boxShadow: s.layer === 2
              ? "0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(150,180,255,0.5)"
              : s.layer === 1
                ? "0 0 4px rgba(255,255,255,0.6)"
                : "0 0 2px rgba(200,210,255,0.4)",
          }}
          animate={{
            opacity: s.layer === 0 ? [0.2, 0.6, 0.2] : [0.4, 1, 0.4],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Occasional shooting star */}
      <motion.div
        className="absolute h-px w-20 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ top: "15%", left: "-10%" }}
        animate={{
          x: ["0vw", "120vw"],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatDelay: 8 + Math.random() * 10,
          ease: "easeOut",
        }}
      />
    </>
  );
}

function CloudyNightScene({ stars, clouds }: { stars: Star[]; clouds: Cloud[] }) {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(99,102,241,0.1),transparent_60%)]" />

      {/* Moon behind clouds — diffused glow */}
      <motion.div
        className="absolute right-12 top-8"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 -m-10 rounded-full bg-amber-200/15 blur-3xl" />
        <div className="absolute inset-0 -m-5 rounded-full bg-amber-100/25 blur-2xl" />
        <div className="relative h-14 w-14 rounded-full bg-amber-100/50 blur-[3px]" />
      </motion.div>

      {/* Fewer, dimmer stars */}
      {stars.slice(0, 30).map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size * 0.8}px`,
            height: `${s.size * 0.8}px`,
            boxShadow: "0 0 3px rgba(255,255,255,0.4)",
          }}
          animate={{ opacity: [0.15, 0.6, 0.15] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 2-layer drifting dark clouds with depth */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute h-20 w-44 rounded-full"
          style={{
            top: `${c.top}%`,
            opacity: c.opacity * 0.8,
            backgroundColor: c.layer === 0 ? "rgba(51,65,85,0.3)" : "rgba(71,85,105,0.45)",
            filter: c.layer === 0 ? "blur(16px)" : "blur(10px)",
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
        />
      ))}
    </>
  );
}

function ClearSunnyDayScene() {
  const rays = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);
  return (
    <>
      {/* Warm atmospheric glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(251,191,36,0.2),transparent_55%)]" />

      {/* Sun with 3-layer glow + rotating rays */}
      <motion.div
        className="absolute -right-6 -top-6"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer corona */}
        <div className="absolute inset-0 -m-16 rounded-full bg-amber-300/20 blur-3xl" />
        {/* Rays */}
        <div className="relative h-32 w-32">
          {rays.map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-20 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-300/50 to-amber-200/0"
              style={{ rotate: `${i * 22.5}deg` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Pulsing mid glow */}
      <motion.div
        className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-amber-300/40 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Solid sun disk with inner gradient + breathing */}
      <motion.div
        className="absolute -right-2 -top-2 h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 via-amber-300 to-orange-400 shadow-[0_0_50px_rgba(251,191,36,0.6),inset_-4px_-4px_12px_rgba(234,88,12,0.3)]"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating dust motes for depth */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-amber-200/40"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0] }}
          transition={{
            duration: 6 + Math.random() * 4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function HotSunnyDayScene({ heatWaves }: { heatWaves: number[] }) {
  const rays = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);
  return (
    <>
      {/* Intense orange atmospheric glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(249,115,22,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(234,88,12,0.1),transparent_60%)]" />

      {/* Intense sun with 20 rays + faster rotation */}
      <motion.div
        className="absolute -right-8 -top-8"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 -m-20 rounded-full bg-orange-400/25 blur-3xl" />
        <div className="relative h-40 w-40">
          {rays.map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-orange-400/0 via-orange-400/55 to-amber-300/0"
              style={{ rotate: `${i * 18}deg` }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-orange-400/50 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -right-3 -top-3 h-24 w-24 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 shadow-[0_0_70px_rgba(249,115,22,0.7),inset_-6px_-6px_16px_rgba(220,38,38,0.4)]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Heat shimmer waves — multiple layers rising with distortion */}
      {heatWaves.map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: `${i * 14 - 4}%`, width: "22%" }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.35, 0],
            y: [0, -40, -80],
            scaleX: [1, 1.15, 1],
            skewX: [0, 3, -3, 0],
          }}
          transition={{
            duration: 4.5,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <div className="h-28 w-full bg-gradient-to-t from-orange-300/40 via-amber-200/20 to-transparent blur-md" />
        </motion.div>
      ))}

      {/* Floating heat sparkles */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-orange-300/60"
          style={{ left: `${Math.random() * 100}%`, bottom: `${Math.random() * 40}%` }}
          animate={{ y: [0, -30, -60], opacity: [0, 0.8, 0] }}
          transition={{
            duration: 5 + Math.random() * 3,
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

function PartlyCloudyDayScene({ clouds }: { clouds: Cloud[] }) {
  const rays = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(251,191,36,0.15),transparent_50%)]" />

      {/* Sun peeking top-right */}
      <motion.div
        className="absolute -right-8 -top-8"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 -m-12 rounded-full bg-amber-300/25 blur-2xl" />
        <div className="relative h-28 w-28">
          {rays.map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-16 w-0.5 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-amber-300/0 via-amber-300/45 to-amber-200/0"
              style={{ rotate: `${i * 30}deg` }}
            />
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/45 blur-xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2-layer drifting fluffy white clouds with depth */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top}%`,
            opacity: c.opacity,
            transform: `scale(${c.scale})`,
            filter: c.layer === 0 ? "blur(8px)" : "blur(4px)",
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
          {/* Multi-puff cloud shape */}
          <div className="relative h-16 w-44">
            <div className="absolute left-0 top-6 h-10 w-10 rounded-full bg-white" />
            <div className="absolute left-6 top-2 h-14 w-14 rounded-full bg-white" />
            <div className="absolute left-16 top-0 h-16 w-16 rounded-full bg-white" />
            <div className="absolute left-28 top-3 h-12 w-12 rounded-full bg-white" />
            <div className="absolute left-36 top-6 h-10 w-8 rounded-full bg-white" />
            {/* Soft shadow under cloud */}
            <div className="absolute left-2 top-12 h-6 w-40 rounded-full bg-slate-300/20 blur-md" />
          </div>
        </motion.div>
      ))}
    </>
  );
}

function OvercastDayScene({ clouds }: { clouds: Cloud[] }) {
  return (
    <>
      {/* Heavy static overcast layer */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-400/30 via-slate-300/15 to-transparent" />

      {/* Dense drifting gray clouds — 2 layers */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top * 0.7}%`,
            opacity: c.opacity + 0.2,
            transform: `scale(${c.scale * 1.4})`,
            filter: c.layer === 0 ? "blur(14px)" : "blur(8px)",
          }}
          initial={{ x: "-30%" }}
          animate={{ x: "130%" }}
          transition={{
            duration: c.duration * 1.3,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="relative h-20 w-56">
            <div className="absolute left-0 top-6 h-12 w-12 rounded-full bg-slate-400/50" />
            <div className="absolute left-8 top-2 h-16 w-16 rounded-full bg-slate-400/50" />
            <div className="absolute left-20 top-0 h-18 w-18 rounded-full bg-slate-400/50" />
            <div className="absolute left-36 top-4 h-14 w-14 rounded-full bg-slate-400/50" />
            <div className="absolute left-46 top-7 h-10 w-10 rounded-full bg-slate-400/50" />
          </div>
        </motion.div>
      ))}
    </>
  );
}

function FogScene() {
  return (
    <>
      {/* Multi-layer drifting fog bands — 5 layers with varying speed */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute h-20 w-[150%] rounded-full"
          style={{
            top: `${10 + i * 18}%`,
            backgroundColor: `rgba(203,213,225,${0.2 + i * 0.05})`,
            filter: `blur(${20 + i * 4}px)`,
          }}
          initial={{ x: i % 2 === 0 ? "-25%" : "10%" }}
          animate={{ x: i % 2 === 0 ? "25%" : "-25%" }}
          transition={{
            duration: 18 + i * 6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function RainScene({ drops, isStorm }: { drops: Drop[]; isStorm: boolean }) {
  return (
    <>
      {/* Dark stormy sky overlay for thunderstorm */}
      {isStorm && (
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-800/50 to-transparent" />
      )}

      {/* Distant rain (layer 0 — far, slow, dim) */}
      {drops.filter((d) => d.layer === 0).map((d) => (
        <motion.span
          key={d.id}
          className="absolute top-0 w-px"
          style={{
            left: `${d.left}%`,
            height: `${d.length}px`,
            background: "linear-gradient(to bottom, transparent, rgba(147,197,253,0.4))",
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

      {/* Mid + near rain (layers 1, 2 — faster, brighter, longer) */}
      {drops.filter((d) => d.layer > 0).map((d) => (
        <motion.span
          key={d.id}
          className="absolute top-0 w-px"
          style={{
            left: `${d.left}%`,
            height: `${d.length}px`,
            background: d.layer === 2
              ? "linear-gradient(to bottom, transparent, rgba(125,211,252,0.9))"
              : "linear-gradient(to bottom, transparent, rgba(147,197,253,0.7))",
            opacity: d.opacity,
            boxShadow: d.layer === 2 ? "0 0 3px rgba(125,211,252,0.5)" : "none",
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

      {/* Lightning flashes for thunderstorm — multi-flash sequence */}
      {isStorm && (
        <>
          <motion.div
            className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0, 0.7, 0, 0, 0.4, 0, 0, 0.6, 0] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatDelay: 4,
              times: [0, 0.35, 0.4, 0.45, 0.6, 0.62, 0.65, 0.8, 0.82, 1],
            }}
          />
          {/* Lightning bolt visual */}
          <motion.svg
            className="absolute left-[30%] top-0 h-48 w-24"
            viewBox="0 0 100 200"
            animate={{ opacity: [0, 0, 1, 0, 0, 0.8, 0] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatDelay: 4,
              times: [0, 0.35, 0.4, 0.45, 0.6, 0.62, 1],
            }}
          >
            <path
              d="M 55 0 L 35 80 L 55 80 L 30 200 L 65 90 L 45 90 Z"
              fill="white"
              stroke="rgba(255,255,200,0.8)"
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,200,0.9))" }}
            />
          </motion.svg>
        </>
      )}

      {/* Ripple splashes at bottom for heavy rain */}
      {!isStorm && drops.slice(0, 8).map((d, i) => (
        <motion.span
          key={`ripple-${d.id}`}
          className="absolute bottom-2 h-4 w-4 rounded-full border border-sky-300/40"
          style={{ left: `${d.left}%` }}
          animate={{
            scale: [0, 1, 1.8],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.15,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

function SnowScene({ flakes }: { flakes: Flake[] }) {
  return (
    <>
      {/* 3-layer parallax snowflakes with glow */}
      {flakes.map((f) => (
        <motion.span
          key={f.id}
          className="absolute top-0 rounded-full"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            backgroundColor: f.layer === 2 ? "#ffffff" : "rgba(255,255,255,0.85)",
            boxShadow: f.layer === 2 ? "0 0 5px rgba(255,255,255,0.8)" : "none",
            opacity: f.layer === 0 ? 0.5 : 0.9,
          }}
          initial={{ y: -20, x: 0 }}
          animate={{ y: "120%", x: [0, f.drift, 0], rotate: [0, 180, 360] }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Subtle frost overlay at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(186,230,253,0.1))]" />
    </>
  );
}
