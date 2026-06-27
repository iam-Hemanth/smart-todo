"use client";

import { useEffect, useRef } from "react";
import { useTodoStore } from "@/store/todo-store";
import { useStreakStore } from "@/components/streak-badge";

/**
 * Watches the todo store and records today's date in the streak store
 * whenever a task's `completedAt` timestamp is newly set.
 */
export function useStreakWatcher() {
  const record = useStreakStore((s) => s.record);
  const seenCompletedAt = useRef<Set<string>>(new Set());

  // Initialize the seen set with whatever completedAt values exist on mount
  useEffect(() => {
    const initial = useTodoStore.getState().todos;
    for (const t of initial) {
      if (t.completedAt) seenCompletedAt.current.add(t.id);
    }
  }, []);

  useEffect(() => {
    const unsub = useTodoStore.subscribe((state) => {
      for (const t of state.todos) {
        if (t.completedAt && !seenCompletedAt.current.has(t.id)) {
          seenCompletedAt.current.add(t.id);
          record();
        }
        if (!t.completedAt) {
          seenCompletedAt.current.delete(t.id);
        }
      }
    });
    return unsub;
  }, [record]);
}
