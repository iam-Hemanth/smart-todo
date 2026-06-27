"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Accent = "emerald" | "violet" | "amber" | "rose" | "sky";

const ACCENTS: {
  id: Accent;
  label: string;
  hex: string;
  // Tailwind gradient for button background
  swatch: string;
  // CSS-variable override values (oklch for primary)
  primary: string;
  primaryForeground: string;
}[] = [
  {
    id: "emerald",
    label: "Emerald",
    hex: "#10b981",
    swatch: "bg-gradient-to-br from-emerald-500 to-teal-500",
    primary: "oklch(0.62 0.17 162)",
    primaryForeground: "oklch(0.985 0 0)",
  },
  {
    id: "violet",
    label: "Violet",
    hex: "#8b5cf6",
    swatch: "bg-gradient-to-br from-violet-500 to-purple-500",
    primary: "oklch(0.55 0.22 295)",
    primaryForeground: "oklch(0.985 0 0)",
  },
  {
    id: "amber",
    label: "Amber",
    hex: "#f59e0b",
    swatch: "bg-gradient-to-br from-amber-500 to-orange-500",
    primary: "oklch(0.7 0.18 65)",
    primaryForeground: "oklch(0.145 0 0)",
  },
  {
    id: "rose",
    label: "Rose",
    hex: "#f43f5e",
    swatch: "bg-gradient-to-br from-rose-500 to-pink-500",
    primary: "oklch(0.62 0.24 16)",
    primaryForeground: "oklch(0.985 0 0)",
  },
  {
    id: "sky",
    label: "Sky",
    hex: "#0ea5e9",
    swatch: "bg-gradient-to-br from-sky-500 to-cyan-500",
    primary: "oklch(0.6 0.18 230)",
    primaryForeground: "oklch(0.985 0 0)",
  },
];

const STORAGE_KEY = "smart-todo-accent:v1";

function applyAccent(a: Accent) {
  const def = ACCENTS.find((x) => x.id === a);
  if (!def) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", def.primary);
  root.style.setProperty("--primary-foreground", def.primaryForeground);
  // Also write a custom var so non-primary CSS can pick it up
  root.style.setProperty("--accent-custom", def.hex);
}

function readStoredAccent(): Accent {
  if (typeof window === "undefined") return "emerald";
  return (localStorage.getItem(STORAGE_KEY) as Accent) ?? "emerald";
}

export function AccentPicker() {
  const [accent, setAccent] = useState<Accent>("emerald");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const a = readStoredAccent();
    setAccent(a);
    applyAccent(a);
  }, []);

  function pick(a: Accent) {
    setAccent(a);
    applyAccent(a);
    localStorage.setItem(STORAGE_KEY, a);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change accent color"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 backdrop-blur hover:bg-background transition-colors"
        >
          <Palette className="h-4 w-4" />
          {mounted && (
            <motion.span
              key={accent}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
              style={{ backgroundColor: ACCENTS.find((a) => a.id === accent)?.hex }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Accent
        </p>
        <div className="grid grid-cols-5 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => pick(a.id)}
              title={a.label}
              aria-label={a.label}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                a.swatch,
                accent === a.id && "ring-2 ring-offset-2 ring-offset-background",
              )}
              style={accent === a.id ? { ["--tw-ring-color" as string]: a.hex } : undefined}
            >
              <AnimatePresence>
                {accent === a.id && (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Recolors buttons, progress, and accents instantly.
        </p>
      </PopoverContent>
    </Popover>
  );
}
