import type { TodoColor } from "@/store/todo-store";

export interface DueDateInfo {
  label: string;
  /** "overdue" | "today" | "tomorrow" | "soon" | "future" | "none" */
  state: "overdue" | "today" | "tomorrow" | "soon" | "future" | "none";
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

function startOfDay(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function getDueDateInfo(dueDate?: string): DueDateInfo {
  if (!dueDate) {
    return {
      label: "No date",
      state: "none",
      hex: "#94a3b8",
      textClass: "text-muted-foreground",
      bgClass: "bg-muted/40",
      borderClass: "border-border/60",
    };
  }

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate + "T00:00:00"));
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((due - today) / dayMs);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: days === 1 ? "Overdue · 1 day" : `Overdue · ${days} days`,
      state: "overdue",
      hex: "#ef4444",
      textClass: "text-rose-700 dark:text-rose-300",
      bgClass: "bg-rose-100 dark:bg-rose-950/40",
      borderClass: "border-rose-300/70 dark:border-rose-800/60",
    };
  }
  if (diffDays === 0) {
    return {
      label: "Due today",
      state: "today",
      hex: "#f59e0b",
      textClass: "text-amber-700 dark:text-amber-300",
      bgClass: "bg-amber-100 dark:bg-amber-950/40",
      borderClass: "border-amber-300/70 dark:border-amber-800/60",
    };
  }
  if (diffDays === 1) {
    return {
      label: "Due tomorrow",
      state: "tomorrow",
      hex: "#f97316",
      textClass: "text-orange-700 dark:text-orange-300",
      bgClass: "bg-orange-100 dark:bg-orange-950/40",
      borderClass: "border-orange-300/70 dark:border-orange-800/60",
    };
  }
  if (diffDays <= 7) {
    return {
      label: `In ${diffDays} days`,
      state: "soon",
      hex: "#10b981",
      textClass: "text-emerald-700 dark:text-emerald-300",
      bgClass: "bg-emerald-100 dark:bg-emerald-950/40",
      borderClass: "border-emerald-300/70 dark:border-emerald-800/60",
    };
  }
  const formatted = new Date(dueDate + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  return {
    label: formatted,
    state: "future",
    hex: "#64748b",
    textClass: "text-slate-600 dark:text-slate-300",
    bgClass: "bg-slate-100 dark:bg-slate-800/40",
    borderClass: "border-slate-300/60 dark:border-slate-700/60",
  };
}

export interface ColorInfo {
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  gradient: string;
}

export const COLOR_MAP: Record<TodoColor, ColorInfo> = {
  emerald: {
    hex: "#10b981",
    textClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-100 dark:bg-emerald-950/40",
    borderClass: "border-emerald-300/70 dark:border-emerald-800/60",
    gradient: "from-emerald-500 to-teal-500",
  },
  amber: {
    hex: "#f59e0b",
    textClass: "text-amber-700 dark:text-amber-300",
    bgClass: "bg-amber-100 dark:bg-amber-950/40",
    borderClass: "border-amber-300/70 dark:border-amber-800/60",
    gradient: "from-amber-500 to-orange-500",
  },
  rose: {
    hex: "#f43f5e",
    textClass: "text-rose-700 dark:text-rose-300",
    bgClass: "bg-rose-100 dark:bg-rose-950/40",
    borderClass: "border-rose-300/70 dark:border-rose-800/60",
    gradient: "from-rose-500 to-pink-500",
  },
  violet: {
    hex: "#8b5cf6",
    textClass: "text-violet-700 dark:text-violet-300",
    bgClass: "bg-violet-100 dark:bg-violet-950/40",
    borderClass: "border-violet-300/70 dark:border-violet-800/60",
    gradient: "from-violet-500 to-purple-500",
  },
  sky: {
    hex: "#0ea5e9",
    textClass: "text-sky-700 dark:text-sky-300",
    bgClass: "bg-sky-100 dark:bg-sky-950/40",
    borderClass: "border-sky-300/70 dark:border-sky-800/60",
    gradient: "from-sky-500 to-cyan-500",
  },
  slate: {
    hex: "#64748b",
    textClass: "text-slate-700 dark:text-slate-300",
    bgClass: "bg-slate-100 dark:bg-slate-800/40",
    borderClass: "border-slate-300/70 dark:border-slate-700/60",
    gradient: "from-slate-500 to-slate-600",
  },
};

/** Deterministic color for free-form tags (hash → hue). */
export function getTagColor(tag: string): { hex: string; textClass: string; bgClass: string; borderClass: string } {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  const palette = [
    { hex: "#10b981", textClass: "text-emerald-700 dark:text-emerald-300", bgClass: "bg-emerald-100 dark:bg-emerald-950/40", borderClass: "border-emerald-300/60 dark:border-emerald-800/60" },
    { hex: "#f59e0b", textClass: "text-amber-700 dark:text-amber-300", bgClass: "bg-amber-100 dark:bg-amber-950/40", borderClass: "border-amber-300/60 dark:border-amber-800/60" },
    { hex: "#8b5cf6", textClass: "text-violet-700 dark:text-violet-300", bgClass: "bg-violet-100 dark:bg-violet-950/40", borderClass: "border-violet-300/60 dark:border-violet-800/60" },
    { hex: "#0ea5e9", textClass: "text-sky-700 dark:text-sky-300", bgClass: "bg-sky-100 dark:bg-sky-950/40", borderClass: "border-sky-300/60 dark:border-sky-800/60" },
    { hex: "#ec4899", textClass: "text-pink-700 dark:text-pink-300", bgClass: "bg-pink-100 dark:bg-pink-950/40", borderClass: "border-pink-300/60 dark:border-pink-800/60" },
    { hex: "#14b8a6", textClass: "text-teal-700 dark:text-teal-300", bgClass: "bg-teal-100 dark:bg-teal-950/40", borderClass: "border-teal-300/60 dark:border-teal-800/60" },
  ];
  return palette[Math.abs(hash) % palette.length];
}
