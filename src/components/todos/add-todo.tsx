"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Home, Trees, Flag, CornerDownLeft } from "lucide-react";
import {
  type TodoCategory,
  type TodoPriority,
  useTodoStore,
} from "@/store/todo-store";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: {
  value: TodoPriority;
  label: string;
  active: string;
}[] = [
  { value: "low", label: "Low", active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { value: "medium", label: "Medium", active: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { value: "high", label: "High", active: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
];

export function AddTodo() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<TodoCategory>("indoor");
  const [priority, setPriority] = useState<TodoPriority>("medium");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo({ text: trimmed, category, priority });
    setText("");
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <Plus className="h-5 w-5" />
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new task — e.g. Walk in Lalbagh"
          className="h-10 flex-1 bg-transparent px-1 text-base placeholder:text-muted-foreground/70 focus:outline-none"
          aria-label="New task text"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 h-10 text-sm font-medium transition-colors"
        >
          <CornerDownLeft className="h-4 w-4" />
          Add
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SegmentGroup
          label="Type"
          value={category}
          onChange={(v) => setCategory(v as TodoCategory)}
          options={[
            {
              value: "indoor",
              label: "Indoor",
              icon: <Home className="h-3.5 w-3.5" />,
              active: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
            },
            {
              value: "outdoor",
              label: "Outdoor",
              icon: <Trees className="h-3.5 w-3.5" />,
              active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
            },
          ]}
        />

        <div className="flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Priority</span>
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-0.5">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-all border border-transparent",
                  priority === opt.value
                    ? opt.active
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile add button */}
      <motion.button
        type="submit"
        disabled={!text.trim()}
        whileTap={{ scale: 0.97 }}
        className="sm:hidden mt-3 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 h-11 text-sm font-medium transition-colors"
      >
        Add task
      </motion.button>
    </form>
  );
}

function SegmentGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode; active: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all border border-transparent",
              value === opt.value
                ? opt.active
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
