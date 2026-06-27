"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Home, Sun, Trees } from "lucide-react";
import { useTodoStore, useFilteredTodos } from "@/store/todo-store";
import { TodoItem } from "./todo-item";

interface TodoListProps {
  isRaining: boolean;
}

export function TodoList({ isRaining }: TodoListProps) {
  const filtered = useFilteredTodos();
  const filter = useTodoStore((s) => s.filter);

  if (filtered.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false} mode="popLayout">
        {filtered.map((todo) => (
          <TodoItem key={todo.id} todo={todo} isRaining={isRaining} />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const config: Record<
    string,
    { icon: React.ReactNode; title: string; subtitle: string }
  > = {
    all: {
      icon: <ClipboardList className="h-7 w-7" />,
      title: "Your list is empty",
      subtitle: "Add your first task above to get started.",
    },
    active: {
      icon: <Sun className="h-7 w-7" />,
      title: "Nothing pending",
      subtitle: "You’re all caught up. Time for a break.",
    },
    completed: {
      icon: <ClipboardList className="h-7 w-7" />,
      title: "No completed tasks yet",
      subtitle: "Finish a task and it’ll show up here.",
    },
    outdoor: {
      icon: <Trees className="h-7 w-7" />,
      title: "No outdoor tasks",
      subtitle: "Add a task and mark it as Outdoor to see rain warnings here.",
    },
    indoor: {
      icon: <Home className="h-7 w-7" />,
      title: "No indoor tasks",
      subtitle: "Add a task and mark it as Indoor.",
    },
  };

  const c = config[filter] ?? config.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/40 px-6 py-14 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
        {c.icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{c.subtitle}</p>
    </motion.div>
  );
}
