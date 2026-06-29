"use client";

import { useState, useMemo } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Archive,
  Trash2,
  Activity,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useHabitsStore, type Habit, type HabitLog } from "@/store/habits-store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function HabitsList() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const loading = useHabitsStore((s) => s.loading);
  const addHabit = useHabitsStore((s) => s.addHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const deleteHabit = useHabitsStore((s) => s.deleteHabit);
  const logProgress = useHabitsStore((s) => s.logProgress);

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const dateStr = useMemo(() => format(currentDate, "yyyy-MM-dd"), [currentDate]);

  // Composer Form State
  const [name, setName] = useState("");
  const [hasTarget, setHasTarget] = useState(false);
  const [targetCount, setTargetCount] = useState("8");
  const [unit, setUnit] = useState("glasses");
  const [isAdding, setIsAdding] = useState(false);

  // UI State
  const [showArchived, setShowArchived] = useState(false);

  // Categorize habits
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits]);

  // Map progress count for currently active day
  const logsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of logs) {
      if (log.date === dateStr) {
        map.set(log.habitId, log.count);
      }
    }
    return map;
  }, [logs, dateStr]);

  const handlePrevDay = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate((prev) => addDays(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsAdding(true);
    const target = hasTarget ? parseInt(targetCount, 10) : undefined;
    const finalUnit = hasTarget ? unit : undefined;

    const id = await addHabit(name, target, finalUnit);
    setIsAdding(false);

    if (id) {
      setName("");
      setHasTarget(false);
    }
  };

  const handleToggleBooleanHabit = (habit: Habit) => {
    const currentCount = logsMap.get(habit.id) || 0;
    const nextCount = currentCount === 0 ? 1 : 0;
    logProgress(habit.id, dateStr, nextCount);
  };

  const handleIncrement = (habit: Habit) => {
    const currentCount = logsMap.get(habit.id) || 0;
    logProgress(habit.id, dateStr, currentCount + 1);
  };

  const handleDecrement = (habit: Habit) => {
    const currentCount = logsMap.get(habit.id) || 0;
    if (currentCount > 0) {
      logProgress(habit.id, dateStr, currentCount - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Switcher */}
      <div className="flex items-center justify-between rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-3 backdrop-blur-md shadow-xs">
        <button
          onClick={handlePrevDay}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-bold tracking-tight">
            {isToday(currentDate) ? "Today" : format(currentDate, "EEEE, d MMM")}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {format(currentDate, "yyyy-MM-dd")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isToday(currentDate) && (
            <button
              onClick={handleToday}
              className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full hover:bg-emerald-500/20 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={handleNextDay}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Habit Composer Card */}
      <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-4">
        <form onSubmit={handleCreateHabit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <Activity className="h-5 w-5" />
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meditate, Drink water..."
              disabled={isAdding}
              required
              className="h-10 flex-1 rounded-2xl border border-border/60 bg-background/45 px-4 focus-visible:ring-emerald-400/40 focus-visible:border-emerald-500 placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer">
              <input
                type="checkbox"
                checked={hasTarget}
                onChange={(e) => setHasTarget(e.target.checked)}
                className="h-4 w-4 rounded-sm border-border bg-background focus:ring-emerald-400 text-emerald-500"
              />
              <span>Set daily measurement goal</span>
            </label>

            {hasTarget && (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="Count"
                  required={hasTarget}
                  className="h-8 w-16 text-center rounded-lg border border-border/60 bg-background/45 focus-visible:ring-emerald-400/40"
                />
                <Input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="unit (e.g. glasses)"
                  required={hasTarget}
                  className="h-8 w-32 rounded-lg border border-border/60 bg-background/45 focus-visible:ring-emerald-400/40"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isAdding || !name.trim()}
              style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
              className="rounded-xl text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ml-auto"
            >
              Add Habit
            </button>
          </div>
        </form>
      </div>

      {/* Habit Feed / List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : activeHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/40 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No active habits</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create a habit above to start logging your daily consistency.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {activeHabits.map((habit) => {
              const currentProgress = logsMap.get(habit.id) || 0;
              const hasGoal = habit.targetCount && habit.targetCount > 0;
              const isCompleted = hasGoal
                ? currentProgress >= (habit.targetCount || 0)
                : currentProgress >= 1;

              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className={cn(
                    "group anim-lift relative overflow-hidden rounded-2xl border p-4 flex items-center justify-between gap-4",
                    "border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]",
                    "hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05] transition-all",
                    isCompleted && "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/[0.02]"
                  )}
                >
                  <div className="space-y-1 pr-14 min-w-0">
                    <span className="font-semibold text-sm sm:text-base tracking-tight truncate block">
                      {habit.name}
                    </span>
                    {hasGoal ? (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium block">
                          Progress: <strong className="text-foreground">{currentProgress}</strong> / {habit.targetCount} {habit.unit}
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((currentProgress / (habit.targetCount || 1)) * 100)
                              )}%`,
                              backgroundColor: "var(--accent-custom, #10b981)"
                            }}
                            className="h-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        Simple Daily Check
                      </span>
                    )}
                  </div>

                  {/* Increment Action Area */}
                  <div className="flex items-center gap-1.5 shrink-0 z-10">
                    {hasGoal ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecrement(habit)}
                          disabled={currentProgress === 0}
                          className="h-7 w-7 rounded-lg border border-border bg-background/50 hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIncrement(habit)}
                          style={
                            isCompleted
                              ? { backgroundColor: "var(--accent-custom, #10b981)" }
                              : undefined
                          }
                          className={cn(
                            "h-7 w-7 rounded-lg border border-border bg-background/50 hover:bg-muted flex items-center justify-center transition-colors",
                            isCompleted && "text-white hover:opacity-90 hover:bg-emerald-500"
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleBooleanHabit(habit)}
                        style={
                          isCompleted
                            ? { backgroundColor: "var(--accent-custom, #10b981)" }
                            : undefined
                        }
                        className={cn(
                          "h-8 w-8 rounded-full border border-border bg-background/50 flex items-center justify-center hover:bg-muted transition-all",
                          isCompleted && "text-white border-transparent"
                        )}
                      >
                        {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
                      </button>
                    )}
                  </div>

                  {/* Actions (Archive / Delete) Hover panel */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => updateHabit(habit.id, { archived: true })}
                      aria-label="Archive habit"
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 flex items-center justify-center transition-colors"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHabit(habit.id)}
                      aria-label="Delete habit"
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Archived Habits Section */}
      {archivedHabits.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/40">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{showArchived ? "Hide" : "Show"} Archived Habits ({archivedHabits.length})</span>
          </button>

          {showArchived && (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {archivedHabits.map((habit) => (
                  <motion.div
                    key={habit.id}
                    layout
                    className="rounded-2xl border border-dashed border-border p-4 bg-muted/20 flex items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="space-y-0.5 truncate">
                      <span className="font-semibold text-sm line-through truncate block">
                        {habit.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        Archived
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateHabit(habit.id, { archived: false })}
                        aria-label="Unarchive habit"
                        className="h-7 w-7 rounded-md border border-border hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        aria-label="Delete habit"
                        className="h-7 w-7 rounded-md border border-border hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 flex items-center justify-center text-muted-foreground transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
