"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { WeatherCard } from "@/components/weather-card";
import { AddTodo } from "@/components/todos/add-todo";
import { FilterTabs } from "@/components/todos/filter-tabs";
import { StatsBar } from "@/components/todos/stats-bar";
import { TodoList } from "@/components/todos/todo-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { StreakBadge } from "@/components/streak-badge";
import { AccentPicker } from "@/components/accent-picker";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { TodaySummaryPill } from "@/components/today-summary-pill";
import { useStreakWatcher } from "@/hooks/use-streak-watcher";
import { useConfettiOnAllDone } from "@/hooks/use-confetti-on-all-done";

export default function Home() {
  const [isRaining, setIsRaining] = useState(false);

  const handleRainChange = useCallback((raining: boolean) => {
    setIsRaining(raining);
  }, []);

  // Side-effect hooks — record streak, fire confetti
  useStreakWatcher();
  useConfettiOnAllDone();

  const focusAddInput = useCallback(() => {
    const el = document.querySelector<HTMLInputElement>(
      'input[aria-label="New task text"]',
    );
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const focusLocationSearch = useCallback(() => {
    // The location button lives inside the weather region. Scope the query to that
    // region to avoid matching the streak badge's popover button.
    const region = document.querySelector<HTMLElement>(
      'section[aria-label$="current weather"]',
    );
    const btn = region?.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="dialog"]',
    );
    btn?.click();
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder="Search any city…"]',
      );
      input?.focus();
    }, 150);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground transition-colors duration-500">
      {/* Decorative gradient mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-amber-300/30 dark:bg-amber-500/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-emerald-300/30 dark:bg-emerald-500/10 blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-rose-300/20 dark:bg-rose-500/5 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Soft pulsing halo behind the logo */}
              <div
                className="anim-halo absolute inset-0 rounded-2xl blur-md"
                style={{
                  backgroundColor:
                    "color-mix(in oklch, var(--accent-custom, #10b981) 40%, transparent)",
                }}
                aria-hidden
              />
              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  background:
                    "linear-gradient(to bottom right, var(--accent-custom, #10b981), color-mix(in oklch, var(--accent-custom, #10b981) 65%, #14b8a6))",
                  boxShadow:
                    "0 8px 24px -8px color-mix(in oklch, var(--accent-custom, #10b981) 50%, transparent)",
                }}
              >
                <CheckCircle2 className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full"
                  style={{
                    backgroundColor:
                      "color-mix(in oklch, var(--accent-custom, #10b981) 70%, transparent)",
                  }}
                />
                <span
                  className="relative inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
                />
              </span>
            </div>
            <div>
              <h1 className="anim-breathe text-xl sm:text-2xl font-semibold tracking-tight">
                Smart To-Do
              </h1>
              <p className="text-xs text-muted-foreground">
                Weather-aware tasks · Smart streaks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <StreakBadge />
            <AccentPicker />
            <ThemeToggle />
          </div>
        </motion.header>

        {/* Weather card */}
        <WeatherCard onRainChange={handleRainChange} />

        {/* Subheader for the list */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 mb-3 flex items-center gap-2"
        >
          <Sparkles className="anim-float h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your tasks
          </h2>
        </motion.div>

        {/* Add todo form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <AddTodo />
        </motion.div>

        {/* Today summary pill */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-4"
        >
          <TodaySummaryPill isRaining={isRaining} />
        </motion.div>

        {/* Stats + filters */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 space-y-4"
        >
          <StatsBar />
          <FilterTabs />
        </motion.div>

        {/* List */}
        <main className="mt-4 flex-1 pb-12">
          <TodoList isRaining={isRaining} />
        </main>

        {/* Footer */}
        <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          <p>
            Built with Next.js · Tailwind · Open-Meteo · Tasks & streaks saved
            locally in your browser.
          </p>
        </footer>
      </div>

      {/* Keyboard shortcuts (⌘K, /, ?) */}
      <KeyboardShortcuts
        onFocusAdd={focusAddInput}
        onFocusLocation={focusLocationSearch}
      />
    </div>
  );
}
