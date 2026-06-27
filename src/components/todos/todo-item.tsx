"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Home,
  Trees,
  Trash2,
  CloudRain,
  Pencil,
  X,
  Flag,
  GripVertical,
} from "lucide-react";
import {
  type Todo,
  useTodoStore,
} from "@/store/todo-store";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  isRaining: boolean;
}

const PRIORITY_STYLES: Record<
  Todo["priority"],
  { dot: string; label: string; text: string }
> = {
  low: { dot: "bg-emerald-500", label: "Low", text: "text-emerald-600 dark:text-emerald-400" },
  medium: { dot: "bg-amber-500", label: "Medium", text: "text-amber-600 dark:text-amber-400" },
  high: { dot: "bg-rose-500", label: "High", text: "text-rose-600 dark:text-rose-400" },
};

export function TodoItem({ todo, isRaining }: TodoItemProps) {
  const toggle = useTodoStore((s) => s.toggleTodo);
  const remove = useTodoStore((s) => s.deleteTodo);
  const edit = useTodoStore((s) => s.editTodo);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  const isOutdoor = todo.category === "outdoor";
  const showRainWarning = isOutdoor && isRaining && !todo.completed;
  const prio = PRIORITY_STYLES[todo.priority];

  function commitEdit() {
    const t = draft.trim();
    if (t && t !== todo.text) {
      edit(todo.id, { text: t });
    } else {
      setDraft(todo.text);
    }
    setEditing(false);
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={cn(
        "group relative flex items-start gap-3 rounded-2xl border p-3 sm:p-4 transition-all",
        "border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]",
        "hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05]",
        todo.completed && "opacity-65",
        showRainWarning &&
          "ring-1 ring-sky-400/40 bg-sky-50/60 dark:bg-sky-950/20",
      )}
    >
      {/* Left: drag handle (visual only) */}
      <div className="hidden sm:flex shrink-0 items-center pt-1 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors">
        <GripVertical className="h-4 w-4" aria-hidden />
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => toggle(todo.id)}
        aria-pressed={todo.completed}
        aria-label={todo.completed ? "Mark as not done" : "Mark as done"}
        className={cn(
          "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
          todo.completed
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-border bg-background hover:border-emerald-400",
        )}
      >
        <AnimatePresence>
          {todo.completed && (
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setDraft(todo.text);
                setEditing(false);
              }
            }}
            className="w-full rounded-md bg-background/70 border border-border/60 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        ) : (
          <p
            onDoubleClick={() => setEditing(true)}
            className={cn(
              "text-sm sm:text-base leading-snug break-words cursor-text",
              todo.completed && "line-through text-muted-foreground",
            )}
          >
            {todo.text}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <CategoryChip category={todo.category} />
          <PriorityChip priority={todo.priority} prio={prio} />
          <AnimatePresence>
            {showRainWarning && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 rounded-full border border-sky-300/60 bg-sky-100/80 dark:border-sky-700/60 dark:bg-sky-900/40 px-2 py-0.5 text-xs font-medium text-sky-800 dark:text-sky-100"
              >
                <CloudRain className="h-3 w-3" />
                Rain warning
              </motion.span>
            )}
          </AnimatePresence>
          {todo.completedAt && (
            <span className="text-[11px] text-muted-foreground/70 ml-1">
              Done {formatRelative(todo.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setDraft(todo.text);
              setEditing(true);
            }}
            aria-label="Edit task"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(todo.text);
              setEditing(false);
            }}
            aria-label="Cancel edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => remove(todo.id)}
          aria-label="Delete task"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.li>
  );
}

function CategoryChip({ category }: { category: Todo["category"] }) {
  if (category === "outdoor") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <Trees className="h-3 w-3" />
        Outdoor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
      <Home className="h-3 w-3" />
      Indoor
    </span>
  );
}

function PriorityChip({
  priority,
  prio,
}: {
  priority: Todo["priority"];
  prio: { dot: string; label: string; text: string };
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium",
        prio.text,
      )}
      title={`Priority: ${prio.label}`}
    >
      <Flag className="h-3 w-3" />
      {prio.label}
    </span>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}
