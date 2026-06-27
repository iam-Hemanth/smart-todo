"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CloudRain,
  ListTodo,
} from "lucide-react";
import { useTodoStore, useTodoStats, isOverdue } from "@/store/todo-store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

interface TodaySummaryPillProps {
  isRaining: boolean;
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

export function TodaySummaryPill({ isRaining }: TodaySummaryPillProps) {
  const stats = useTodoStats();
  const todos = useTodoStore(useShallow((s) => s.todos));

  const dueToday = todos.filter(
    (t) => !t.completed && isToday(t.dueDate),
  ).length;
  const overdue = stats.overdue;
  const active = stats.active;
  const outdoorActive = todos.filter(
    (t) => !t.completed && t.category === "outdoor",
  ).length;
  const rainingOutdoors = isRaining ? outdoorActive : 0;

  const items: {
    icon: React.ReactNode;
    label: string;
    accent: string;
    bg: string;
  }[] = [];

  if (active > 0) {
    items.push({
      icon: <ListTodo className="h-3.5 w-3.5" />,
      label: `${active} active`,
      accent: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-100/70 dark:bg-emerald-950/40",
    });
  }
  if (dueToday > 0) {
    items.push({
      icon: <CalendarClock className="h-3.5 w-3.5" />,
      label: `${dueToday} due today`,
      accent: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-100/70 dark:bg-amber-950/40",
    });
  }
  if (overdue > 0) {
    items.push({
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: `${overdue} overdue`,
      accent: "text-rose-700 dark:text-rose-300",
      bg: "bg-rose-100/70 dark:bg-rose-950/40",
    });
  }
  if (rainingOutdoors > 0) {
    items.push({
      icon: <CloudRain className="h-3.5 w-3.5" />,
      label: `${rainingOutdoors} outdoor in rain`,
      accent: "text-sky-700 dark:text-sky-300",
      bg: "bg-sky-100/70 dark:bg-sky-950/40",
    });
  }
  if (active === 0 && stats.completed > 0) {
    items.push({
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "All done today",
      accent: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-100/70 dark:bg-emerald-950/40",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <motion.span
            key={item.label}
            layout
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border/40 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm",
              item.bg,
              item.accent,
            )}
          >
            {item.icon}
            {item.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Suppress unused import warning
void isOverdue;
