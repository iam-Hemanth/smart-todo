"use client";

import { AlertTriangle, Sparkles, Trash2 } from "lucide-react";
import { useTodoStore, useTodoStats } from "@/store/todo-store";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatsBar() {
  const stats = useTodoStats();
  const clearCompleted = useTodoStore((s) => s.clearCompleted);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{stats.completed}</span>
          <span className="text-sm text-muted-foreground">/ {stats.total} done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-2 w-32 sm:w-48 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="anim-shimmer absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, var(--accent-custom, #10b981), color-mix(in oklch, var(--accent-custom, #10b981) 60%, white))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${stats.pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {stats.pct}%
          </span>
        </div>
        {stats.overdue > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-rose-300/60 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300",
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {stats.overdue} overdue
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {stats.pct === 100 && stats.total > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          >
            <Sparkles className="h-3 w-3" />
            All clear!
          </motion.span>
        )}
        {stats.completed > 0 && (
          <button
            type="button"
            onClick={clearCompleted}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-300 dark:hover:border-rose-700/50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear done
          </button>
        )}
      </div>
    </div>
  );
}
