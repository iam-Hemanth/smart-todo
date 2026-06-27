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
  CalendarClock,
  Clock,
  Plus,
  ChevronDown,
  StickyNote,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  type Todo,
  useTodoStore,
} from "@/store/todo-store";
import {
  COLOR_MAP,
  getDueDateInfo,
  getTagColor,
} from "@/lib/todo-helpers";
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
  const addSubtask = useTodoStore((s) => s.addSubtask);
  const toggleSubtask = useTodoStore((s) => s.toggleSubtask);
  const deleteSubtask = useTodoStore((s) => s.deleteSubtask);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [expanded, setExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");

  const isOutdoor = todo.category === "outdoor";
  const showRainWarning = isOutdoor && isRaining && !todo.completed;
  const prio = PRIORITY_STYLES[todo.priority];
  const dueInfo = getDueDateInfo(todo.dueDate);
  const colorInfo = COLOR_MAP[todo.color ?? "emerald"];
  const subtaskCount = todo.subtasks?.length ?? 0;
  const subtaskDone = todo.subtasks?.filter((s) => s.done).length ?? 0;

  function commitEdit() {
    const t = draft.trim();
    if (t && t !== todo.text) {
      edit(todo.id, { text: t });
    } else {
      setDraft(todo.text);
    }
    setEditing(false);
  }

  function submitSubtask(e?: React.FormEvent) {
    e?.preventDefault();
    const v = subtaskInput.trim();
    if (!v) return;
    addSubtask(todo.id, v);
    setSubtaskInput("");
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all",
        "border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]",
        "hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05]",
        todo.completed && "opacity-65",
        showRainWarning && "ring-1 ring-sky-400/40 bg-sky-50/60 dark:bg-sky-950/20",
      )}
    >
      {/* Color label strip */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: colorInfo.hex }}
        aria-hidden
      />

      <div className="flex items-start gap-3 p-3 sm:p-4 pl-4 sm:pl-5">
        {/* Drag handle */}
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

          {/* Meta chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CategoryChip category={todo.category} />
            <PriorityChip priority={todo.priority} prio={prio} />
            {todo.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  dueInfo.bgClass,
                  dueInfo.borderClass,
                  dueInfo.textClass,
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {dueInfo.label}
              </span>
            )}
            {todo.estimateMinutes && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/60 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/40 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
                <Clock className="h-3 w-3" />
                {todo.estimateMinutes < 60
                  ? `${todo.estimateMinutes}m`
                  : `${(todo.estimateMinutes / 60).toFixed(todo.estimateMinutes % 60 === 0 ? 0 : 1)}h`}
              </span>
            )}
            {todo.tags?.map((t) => {
              const c = getTagColor(t);
              return (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    c.bgClass,
                    c.borderClass,
                    c.textClass,
                  )}
                >
                  #{t}
                </span>
              );
            })}
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
            {subtaskCount > 0 ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors",
                )}
              >
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
                />
                {subtaskDone}/{subtaskCount} subtasks
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
                aria-label="Add subtask or notes"
              >
                <Plus className="h-3 w-3" />
                Subtask
              </button>
            )}
            {todo.notes && !expanded && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                Note
              </span>
            )}
            {todo.completedAt && (
              <span className="text-[11px] text-muted-foreground/70 ml-1">
                Done {formatRelative(todo.completedAt)}
              </span>
            )}
          </div>

          {/* Expandable detail: subtasks + notes */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border/40 bg-background/40 p-2.5">
                  {/* Subtasks */}
                  <div className="space-y-1">
                    {todo.subtasks?.map((s) => (
                      <div
                        key={s.id}
                        className="group/sub flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/40"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubtask(todo.id, s.id)}
                          aria-pressed={s.done}
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                            s.done
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-border bg-background hover:border-emerald-400",
                          )}
                        >
                          {s.done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                        </button>
                        <span
                          className={cn(
                            "flex-1 text-xs",
                            s.done && "line-through text-muted-foreground",
                          )}
                        >
                          {s.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteSubtask(todo.id, s.id)}
                          className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                          aria-label="Delete subtask"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add subtask */}
                  <form onSubmit={submitSubtask} className="mt-1.5 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <input
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      placeholder="Add a subtask…"
                      className="flex-1 bg-transparent text-xs placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                    {subtaskInput && (
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        Add
                      </button>
                    )}
                  </form>

                  {/* Notes */}
                  {todo.notes && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                      <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <p className="whitespace-pre-wrap">{todo.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
  void priority;
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

// Suppress unused warnings
void format;
void parseISO;
