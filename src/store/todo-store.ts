"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

export type TodoCategory = "indoor" | "outdoor";
export type TodoPriority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export type TodoColor =
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "sky"
  | "slate";

export interface Todo {
  id: string;
  text: string;
  category: TodoCategory;
  priority: TodoPriority;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  /** ISO date string (YYYY-MM-DD), optional */
  dueDate?: string;
  /** Free-form tag labels */
  tags?: string[];
  /** Optional longer notes */
  notes?: string;
  /** Pomodoro-style time estimate in minutes */
  estimateMinutes?: number;
  /** Accent color label */
  color?: TodoColor;
  /** Nested subtasks */
  subtasks?: Subtask[];
}

export type FilterKey = "all" | "active" | "completed" | "outdoor" | "indoor" | "overdue";

interface TodoState {
  todos: Todo[];
  filter: FilterKey;
  addTodo: (input: {
    text: string;
    category: TodoCategory;
    priority: TodoPriority;
    dueDate?: string;
    tags?: string[];
    notes?: string;
    estimateMinutes?: number;
    color?: TodoColor;
    subtasks?: Subtask[];
  }) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string, patch: Partial<Omit<Todo, "id" | "createdAt">>) => void;
  clearCompleted: () => void;
  reorder: (fromId: string, toId: string) => void;
  setFilter: (filter: FilterKey) => void;
  // Subtask helpers
  addSubtask: (todoId: string, text: string) => void;
  toggleSubtask: (todoId: string, subtaskId: string) => void;
  deleteSubtask: (todoId: string, subtaskId: string) => void;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function isOverdue(t: Todo): boolean {
  if (!t.dueDate || t.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(t.dueDate + "T00:00:00");
  return due.getTime() < today.getTime();
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [
        {
          id: uid(),
          text: "Morning run at Cubbon Park",
          category: "outdoor",
          priority: "high",
          completed: false,
          createdAt: Date.now(),
          dueDate: new Date().toISOString().slice(0, 10),
          tags: ["fitness"],
          estimateMinutes: 30,
          color: "emerald",
        },
        {
          id: uid(),
          text: "Finish quarterly design review",
          category: "indoor",
          priority: "high",
          completed: false,
          createdAt: Date.now() - 1000 * 60,
          tags: ["work"],
          estimateMinutes: 90,
          color: "violet",
        },
        {
          id: uid(),
          text: "Water the balcony plants",
          category: "outdoor",
          priority: "low",
          completed: true,
          createdAt: Date.now() - 1000 * 60 * 60,
          completedAt: Date.now() - 1000 * 60 * 30,
          color: "emerald",
        },
        {
          id: uid(),
          text: "Reply to weekend brunch invite",
          category: "indoor",
          priority: "medium",
          completed: false,
          createdAt: Date.now() - 1000 * 60 * 90,
          tags: ["personal"],
          color: "amber",
        },
      ],
      filter: "all",

      addTodo: (input) =>
        set((state) => ({
          todos: [
            {
              id: uid(),
              text: input.text.trim(),
              category: input.category,
              priority: input.priority,
              completed: false,
              createdAt: Date.now(),
              dueDate: input.dueDate,
              tags: input.tags?.filter((t) => t.trim().length > 0),
              notes: input.notes,
              estimateMinutes: input.estimateMinutes,
              color: input.color,
              subtasks: input.subtasks,
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

      addSubtask: (todoId, text) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: [
                    ...(t.subtasks ?? []),
                    { id: uid(), text: text.trim(), done: false },
                  ],
                }
              : t,
          ),
        })),

      toggleSubtask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: t.subtasks?.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s,
                  ),
                }
              : t,
          ),
        })),

      deleteSubtask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: t.subtasks?.filter((s) => s.id !== subtaskId),
                }
              : t,
          ),
        })),
    }),
    {
      name: "smart-todo:v2",
      version: 2,
      partialize: (state) => ({ todos: state.todos, filter: state.filter }),
      migrate: (persisted: unknown) => {
        // Migrate v1 -> v2: just keep todos/filter, missing fields will be undefined
        const p = (persisted ?? {}) as { todos?: Todo[]; filter?: FilterKey };
        return {
          todos: (p.todos ?? []).map((t) => ({ ...t })),
          filter: p.filter ?? "all",
        };
      },
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
    case "overdue":
      return todos.filter(isOverdue);
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
  const overdue = state.todos.filter(isOverdue).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, active, outdoor, indoor, overdue, pct };
}

/** Returns the set of all tags used across todos, for autocomplete. */
export function selectAllTags(state: TodoState): string[] {
  const set = new Set<string>();
  for (const t of state.todos) {
    for (const tag of t.tags ?? []) set.add(tag);
  }
  return Array.from(set).sort();
}

export function useFilteredTodos(): Todo[] {
  return useTodoStore(useShallow(selectFiltered));
}

export function useTodoStats() {
  return useTodoStore(useShallow(selectStats));
}

export function useAllTags(): string[] {
  return useTodoStore(useShallow(selectAllTags));
}

export { isOverdue };
