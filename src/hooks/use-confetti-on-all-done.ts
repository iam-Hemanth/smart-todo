"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useTodoStore } from "@/store/todo-store";

/**
 * Fires a celebratory confetti burst the first time the user transitions
 * to 100% completion (i.e., at least one task, all done).
 */
export function useConfettiOnAllDone() {
  const prevPctRef = useRef(0);

  useEffect(() => {
    const unsub = useTodoStore.subscribe((state) => {
      const total = state.todos.length;
      const completed = state.todos.filter((t) => t.completed).length;
      const pct = total === 0 ? 0 : completed / total;

      if (pct === 1 && prevPctRef.current !== 1 && total > 0) {
        fireConfetti();
      }
      prevPctRef.current = pct;
    });
    return unsub;
  }, []);
}

function fireConfetti() {
  const colors = ["#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9", "#ec4899"];
  const end = Date.now() + 900;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
      scalar: 0.9,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
      scalar: 0.9,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    } else {
      // Final burst from center
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 38,
        scalar: 1.1,
      });
    }
  })();
}
