"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Hash,
  Home,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trees,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  type TodoCategory,
  type TodoColor,
  type TodoPriority,
  useTodoStore,
  useAllTags,
} from "@/store/todo-store";
import { COLOR_MAP } from "@/lib/todo-helpers";
import { parseNaturalLanguage } from "@/lib/nlp-parser";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const PRIORITY_OPTIONS: {
  value: TodoPriority;
  label: string;
  active: string;
  dot: string;
}[] = [
  { value: "low", label: "Low", active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", dot: "bg-emerald-500" },
  { value: "medium", label: "Medium", active: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30", dot: "bg-amber-500" },
  { value: "high", label: "High", active: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30", dot: "bg-rose-500" },
];

const ESTIMATE_OPTIONS = [15, 30, 45, 60, 90, 120];
const COLOR_OPTIONS: TodoColor[] = ["emerald", "amber", "rose", "violet", "sky", "slate"];

interface DraftState {
  text: string;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate?: string;
  tags: string[];
  estimateMinutes?: number;
  color: TodoColor;
  notes: string;
  /** Tracks whether the user explicitly picked a category (overrides NLP) */
  categoryTouched: boolean;
  /** Tracks whether the user explicitly picked a priority (overrides NLP) */
  priorityTouched: boolean;
  /** Tracks whether the user explicitly picked a due date (overrides NLP) */
  dueDateTouched: boolean;
  /** Tracks whether the user explicitly picked an estimate (overrides NLP) */
  estimateTouched: boolean;
}

const DEFAULT_DRAFT: DraftState = {
  text: "",
  category: "indoor",
  priority: "medium",
  tags: [],
  color: "emerald",
  notes: "",
  categoryTouched: false,
  priorityTouched: false,
  dueDateTouched: false,
  estimateTouched: false,
};

export function AddTodo() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const allTags = useAllTags();
  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [nlpHint, setNlpHint] = useState<ReturnType<typeof parseNaturalLanguage> | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => {
    if (!draft.text.trim()) return null;
    return parseNaturalLanguage(draft.text);
  }, [draft.text]);

  // Highlight what NLP detected
  const detectedHints = useMemo(() => {
    if (!parsed) return [];
    const hints: { label: string; color: string }[] = [];
    if (parsed.priority) {
      const p = PRIORITY_OPTIONS.find((o) => o.value === parsed.priority);
      if (p) hints.push({ label: `Priority: ${p.label}`, color: p.dot });
    }
    if (parsed.category) {
      hints.push({
        label: parsed.category === "outdoor" ? "Outdoor" : "Indoor",
        color: parsed.category === "outdoor" ? "bg-emerald-500" : "bg-amber-500",
      });
    }
    if (parsed.dueDate) {
      hints.push({ label: `Date: ${format(parseISO(parsed.dueDate), "d MMM")}`, color: "bg-violet-500" });
    }
    if (parsed.estimateMinutes) {
      hints.push({ label: `${parsed.estimateMinutes}min`, color: "bg-sky-500" });
    }
    if (parsed.tags?.length) {
      hints.push({ label: `#${parsed.tags.join(" #")}`, color: "bg-pink-500" });
    }
    return hints;
  }, [parsed]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = draft.text.trim();
    if (!trimmed) return;

    // NLP-detected fields are used as defaults; explicit user picks override them.
    const finalCategory = draft.categoryTouched
      ? draft.category
      : (parsed?.category ?? draft.category);

    const finalPriority = draft.priorityTouched
      ? draft.priority
      : (parsed?.priority ?? draft.priority);

    const finalDueDate = draft.dueDateTouched
      ? draft.dueDate
      : (parsed?.dueDate ?? draft.dueDate);

    const finalEstimate = draft.estimateTouched
      ? draft.estimateMinutes
      : (parsed?.estimateMinutes ?? draft.estimateMinutes);

    const finalTags = Array.from(
      new Set([...(draft.tags ?? []), ...(parsed?.tags ?? [])]),
    );

    addTodo({
      text: draft.text.trim(),
      category: finalCategory,
      priority: finalPriority,
      dueDate: finalDueDate,
      tags: finalTags,
      estimateMinutes: finalEstimate,
      color: draft.color,
      notes: draft.notes.trim() || undefined,
    });

    setDraft(DEFAULT_DRAFT);
    setShowAdvanced(false);
    setTagInput("");
    setNlpHint(null);
  }

  function addTagFromInput() {
    const v = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (v && !draft.tags.includes(v)) {
      setDraft((d) => ({ ...d, tags: [...d.tags, v] }));
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }));
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
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          placeholder="Add a task — try ‘Walk in lalbagh tomorrow outdoor high #fitness 30min’"
          className="h-10 flex-1 bg-transparent px-1 text-base placeholder:text-muted-foreground/70 focus:outline-none"
          aria-label="New task text"
        />
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-xl border px-2.5 h-10 text-xs font-medium transition-colors",
            showAdvanced
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={showAdvanced}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Options</span>
        </button>
        <button
          type="submit"
          disabled={!draft.text.trim()}
          style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 h-10 text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* NLP hint chips */}
      <AnimatePresence>
        {detectedHints.length > 0 && !showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="flex flex-wrap items-center gap-1.5 overflow-hidden"
          >
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
              <Sparkles className="h-3 w-3" />
              Smart parse
            </span>
            {detectedHints.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", h.color)} />
                {h.label}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-border/50 bg-background/40 p-3 sm:p-4">
              {/* Row 1: Category + Priority */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <SegmentGroup
                  label="Type"
                  value={draft.category}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      category: v as TodoCategory,
                      categoryTouched: true,
                    }))
                  }
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

                <SegmentGroup
                  label="Priority"
                  value={draft.priority}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      priority: v as TodoPriority,
                      priorityTouched: true,
                    }))
                  }
                  options={PRIORITY_OPTIONS.map((p) => ({
                    value: p.value,
                    label: p.label,
                    dot: p.dot,
                    active: p.active,
                  }))}
                />
              </div>

              {/* Row 2: Due date + Estimate */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Due</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 h-8 text-xs font-medium transition-colors",
                          draft.dueDate
                            ? "border-violet-400/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {draft.dueDate ? format(parseISO(draft.dueDate), "d MMM yyyy") : "Pick date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={draft.dueDate ? parseISO(draft.dueDate) : undefined}
                        onSelect={(d) =>
                          setDraft((s) => ({
                            ...s,
                            dueDate: d ? format(d, "yyyy-MM-dd") : undefined,
                            dueDateTouched: true,
                          }))
                        }
                        initialFocus
                        disabled={(d) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return d.getTime() < today.getTime();
                        }}
                      />
                      {draft.dueDate && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((s) => ({
                              ...s,
                              dueDate: undefined,
                              dueDateTouched: true,
                            }))
                          }
                          className="w-full border-t py-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear date
                        </button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Estimate
                  </span>
                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-0.5">
                    {ESTIMATE_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            estimateMinutes: d.estimateMinutes === m ? undefined : m,
                            estimateTouched: true,
                          }))
                        }
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium transition-all",
                          draft.estimateMinutes === m
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m < 60 ? `${m}m` : `${m / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Tags */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Tags
                </span>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
                  {draft.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                    >
                      <Hash className="h-3 w-3" />
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="ml-0.5 rounded-full hover:bg-emerald-500/20"
                        aria-label={`Remove ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTagFromInput();
                      } else if (e.key === "Backspace" && !tagInput && draft.tags.length) {
                        removeTag(draft.tags[draft.tags.length - 1]);
                      }
                    }}
                    onBlur={addTagFromInput}
                    placeholder={draft.tags.length ? "" : "Add tags (press Enter)"}
                    className="flex-1 min-w-[120px] bg-transparent px-1 py-0.5 text-xs placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Used:</span>
                    {allTags
                      .filter((t) => !draft.tags.includes(t))
                      .slice(0, 6)
                      .map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, tags: [...d.tags, t] }))}
                          className="rounded-full border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          #{t}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Row 4: Color label */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Label</span>
                <div className="flex items-center gap-1.5">
                  {COLOR_OPTIONS.map((c) => {
                    const info = COLOR_MAP[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, color: c }))}
                        className={cn(
                          "relative h-6 w-6 rounded-full transition-transform hover:scale-110",
                          draft.color === c && "ring-2 ring-offset-2 ring-offset-background",
                        )}
                        style={{
                          backgroundColor: info.hex,
                          // @ts-expect-error CSS var
                          "--tw-ring-color": info.hex,
                        }}
                        aria-label={`${c} label`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Notes */}
              <div>
                <span className="text-xs text-muted-foreground">Notes (optional)</span>
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any extra context…"
                  className="mt-1 w-full resize-none rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile add button */}
      <motion.button
        type="submit"
        disabled={!draft.text.trim()}
        whileTap={{ scale: 0.97 }}
        style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
        className="sm:hidden mt-3 w-full rounded-xl hover:opacity-90 disabled:opacity-40 text-white px-4 h-11 text-sm font-medium transition-all"
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
  options: {
    value: T;
    label: string;
    icon?: React.ReactNode;
    dot?: string;
    active: string;
  }[];
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
            {opt.icon ?? (opt.dot && <span className={cn("h-1.5 w-1.5 rounded-full", opt.dot)} />)}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Suppress unused warning
void ChevronDown;
