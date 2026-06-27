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

export default function Home() {
  const [isRaining, setIsRaining] = useState(false);

  const handleRainChange = useCallback((raining: boolean) => {
    setIsRaining(raining);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground">
      {/* Decorative gradient mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-amber-300/30 dark:bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-emerald-300/30 dark:bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-rose-300/20 dark:bg-rose-500/5 blur-3xl" />
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
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Smart To-Do
              </h1>
              <p className="text-xs text-muted-foreground">
                Weather-aware tasks · Bangalore
              </p>
            </div>
          </div>

          <ThemeToggle />
        </header>

        {/* Weather card */}
        <WeatherCard onRainChange={handleRainChange} />

        {/* Subheader for the list */}
        <div className="mt-8 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your tasks
          </h2>
        </div>

        {/* Add todo form */}
        <AddTodo />

        {/* Stats + filters */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-5 space-y-4"
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
            Built with Next.js · Tailwind · Open-Meteo · Tasks saved locally in your browser.
          </p>
        </footer>
      </div>
    </div>
  );
}
