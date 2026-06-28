"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` only after the component has mounted on the client.
 * Use this to gate rendering of localStorage-persisted state so SSR and
 * client renders match (avoids React hydration mismatch warnings).
 *
 * @example
 * const hydrated = useHydrated();
 * if (!hydrated) return <Skeleton />;
 * return <TodoList />;
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  return hydrated;
}
