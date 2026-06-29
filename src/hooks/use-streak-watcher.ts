"use client";

import { useEffect, useRef } from "react";
import { useTodoStore } from "@/store/todo-store";
import { useStreakStore } from "@/components/streak-badge";

/**
 * Watches the todo store and records today's date in the streak store
 * whenever a task's `completedAt` timestamp is newly set by the user.
 * Avoids false triggers during initial load from server.
 */
export function useStreakWatcher() {
  const record = useStreakStore((s) => s.record);
  const seenCompletedAt = useRef<Set<string>>(new Set());
  const wasLoading = useRef(true);

  useEffect(() => {
    const unsub = useTodoStore.subscribe((state) => {
      // If store is currently loading from server, track that it's loading and skip
      if (state.loading) {
        wasLoading.current = true;
        return;
      }

      // Once loading completes, initialize the seenCompletedAt set with existing completed task IDs
      if (wasLoading.current) {
        seenCompletedAt.current.clear();
        for (const t of state.todos) {
          if (t.completedAt) {
            seenCompletedAt.current.add(t.id);
          }
        }
        wasLoading.current = false;
        return;
      }

      // Detect transitions when completing tasks during runtime
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
