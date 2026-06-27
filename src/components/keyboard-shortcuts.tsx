"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Search, Plus, X, HelpCircle } from "lucide-react";

interface ShortcutDef {
  keys: string[];
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface KeyboardShortcutsProps {
  onFocusAdd: () => void;
  onFocusLocation: () => void;
}

export function KeyboardShortcuts({
  onFocusAdd,
  onFocusLocation,
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ⌘K / Ctrl+K — focus add input (works even while typing)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onFocusAdd();
        return;
      }

      // If user is typing, don't intercept other single-key shortcuts
      if (isTyping) return;

      // "/" — focus location search
      if (e.key === "/") {
        e.preventDefault();
        onFocusLocation();
        return;
      }

      // "?" — show help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      // Escape — close help if open
      if (e.key === "Escape") {
        setShowHelp(false);
      }
    },
    [onFocusAdd, onFocusLocation],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const shortcuts: ShortcutDef[] = [
    {
      keys: ["⌘", "K"],
      label: "Quick add",
      description: "Jump straight to the new task input",
      icon: <Plus className="h-4 w-4" />,
      action: onFocusAdd,
    },
    {
      keys: ["/"],
      label: "Search location",
      description: "Open the city search dropdown",
      icon: <Search className="h-4 w-4" />,
      action: onFocusLocation,
    },
    {
      keys: ["?"],
      label: "Show shortcuts",
      description: "Toggle this help overlay",
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => setShowHelp((v) => !v),
    },
    {
      keys: ["Esc"],
      label: "Close",
      description: "Dismiss dialogs and overlays",
      icon: <X className="h-4 w-4" />,
      action: () => setShowHelp(false),
    },
  ];

  return (
    <>
      {/* Help trigger button — subtle, bottom-right */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur shadow-md text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <Command className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-custom/15 text-accent-custom">
                    <Command className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold">Keyboard shortcuts</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2">
                {shortcuts.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      s.action();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60 transition-colors"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {s.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border bg-background px-1.5 text-[11px] font-semibold text-foreground shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
                Tip: shortcuts work from anywhere on the page.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
