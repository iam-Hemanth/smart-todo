"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Circle, Home, ListChecks, Trees } from "lucide-react";
import { type FilterKey, useTodoStore, useTodoStats } from "@/store/todo-store";
import { cn } from "@/lib/utils";

const FILTERS: {
  key: FilterKey;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "all", label: "All", icon: <ListChecks className="h-3.5 w-3.5" /> },
  { key: "active", label: "Active", icon: <Circle className="h-3.5 w-3.5" /> },
  { key: "completed", label: "Done", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: "overdue", label: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { key: "outdoor", label: "Outdoor", icon: <Trees className="h-3.5 w-3.5" /> },
  { key: "indoor", label: "Indoor", icon: <Home className="h-3.5 w-3.5" /> },
];

export function FilterTabs() {
  const filter = useTodoStore((s) => s.filter);
  const setFilter = useTodoStore((s) => s.setFilter);
  const stats = useTodoStats();

  const counts: Record<FilterKey, number | undefined> = {
    all: stats.total,
    active: stats.active,
    completed: stats.completed,
    overdue: stats.overdue,
    outdoor: stats.outdoor,
    indoor: stats.indoor,
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => {
        const isActive = filter === f.key;
        const count = counts[f.key];
        const isOverdue = f.key === "overdue" && (count ?? 0) > 0;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              isOverdue && !isActive && "text-rose-600 dark:text-rose-300",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="filter-pill"
                className={cn(
                  "absolute inset-0 -z-10 rounded-full border",
                  isOverdue
                    ? "bg-rose-500/15 border-rose-500/30"
                    : "bg-emerald-500/15 border-emerald-500/30",
                )}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {f.icon}
            {f.label}
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? isOverdue
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-200"
                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200"
                    : isOverdue
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
