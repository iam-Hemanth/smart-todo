"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

export type TodoCategory = "indoor" | "outdoor";
export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  text: string;
  category: TodoCategory;
  priority: TodoPriority;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export type FilterKey = "all" | "active" | "completed" | "outdoor" | "indoor";

interface TodoState {
  todos: Todo[];
  filter: FilterKey;
  addTodo: (input: {
    text: string;
    category: TodoCategory;
    priority: TodoPriority;
  }) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string, patch: Partial<Omit<Todo, "id" | "createdAt">>) => void;
  clearCompleted: () => void;
  reorder: (fromId: string, toId: string) => void;
  setFilter: (filter: FilterKey) => void;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [
        {
          id: uid(),
          text: "Morning run at Cubbon Park",
          category: "outdoor",
          priority: "high",
          completed: false,
          createdAt: Date.now(),
        },
        {
          id: uid(),
          text: "Finish quarterly design review",
          category: "indoor",
          priority: "high",
          completed: false,
          createdAt: Date.now() - 1000 * 60,
        },
        {
          id: uid(),
          text: "Water the balcony plants",
          category: "outdoor",
          priority: "low",
          completed: true,
          createdAt: Date.now() - 1000 * 60 * 60,
          completedAt: Date.now() - 1000 * 60 * 30,
        },
        {
          id: uid(),
          text: "Reply to weekend brunch invite",
          category: "indoor",
          priority: "medium",
          completed: false,
          createdAt: Date.now() - 1000 * 60 * 90,
        },
      ],
      filter: "all",

      addTodo: ({ text, category, priority }) =>
        set((state) => ({
          todos: [
            {
              id: uid(),
              text: text.trim(),
              category,
              priority,
              completed: false,
              createdAt: Date.now(),
            },
            ...state.todos,
          ],
        })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? Date.now() : undefined,
                }
              : t,
          ),
        })),

      deleteTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),

      editTodo: (id, patch) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((t) => !t.completed),
        })),

      reorder: (fromId, toId) =>
        set((state) => {
          if (fromId === toId) return state;
          const idxFrom = state.todos.findIndex((t) => t.id === fromId);
          const idxTo = state.todos.findIndex((t) => t.id === toId);
          if (idxFrom === -1 || idxTo === -1) return state;
          const next = [...state.todos];
          const [moved] = next.splice(idxFrom, 1);
          next.splice(idxTo, 0, moved);
          return { todos: next };
        }),

      setFilter: (filter) => set({ filter }),
    }),
    {
      name: "smart-todo:v1",
      // Only persist the data, not transient UI state is fine here since filter is also useful.
      partialize: (state) => ({ todos: state.todos, filter: state.filter }),
    },
  ),
);

export function selectFiltered(state: TodoState): Todo[] {
  const { todos, filter } = state;
  switch (filter) {
    case "active":
      return todos.filter((t) => !t.completed);
    case "completed":
      return todos.filter((t) => t.completed);
    case "outdoor":
      return todos.filter((t) => t.category === "outdoor");
    case "indoor":
      return todos.filter((t) => t.category === "indoor");
    default:
      return todos;
  }
}

export function selectStats(state: TodoState) {
  const total = state.todos.length;
  const completed = state.todos.filter((t) => t.completed).length;
  const active = total - completed;
  const outdoor = state.todos.filter((t) => t.category === "outdoor").length;
  const indoor = total - outdoor;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, active, outdoor, indoor, pct };
}

/**
 * Hooks that memoize derived state with `useShallow` so components don't
 * re-render infinitely when selectors return new array/object references.
 */
export function useFilteredTodos(): Todo[] {
  return useTodoStore(useShallow(selectFiltered));
}

export function useTodoStats() {
  return useTodoStore(useShallow(selectStats));
}
