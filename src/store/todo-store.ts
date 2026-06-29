"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

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
  loading: boolean;
  loadFromServer: () => Promise<void>;
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

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  filter: "all",
  loading: true,

  loadFromServer: async () => {
    try {
      set({ loading: true });
      const res = await apiFetch("/api/todos");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      set({ todos: data.todos || [], loading: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tasks from server.");
      set({ loading: false });
    }
  },

  addTodo: (input) => {
    const newTodo: Todo = {
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
      subtasks: input.subtasks || [],
    };

    // Optimistic Update
    set((state) => ({ todos: [newTodo, ...state.todos] }));

    apiFetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTodo),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to add task: ${error.message || error}`);
      // Rollback
      set((state) => ({ todos: state.todos.filter((t) => t.id !== newTodo.id) }));
    });
  },

  toggleTodo: (id) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;

    const nextCompleted = !todo.completed;
    const nextCompletedAt = nextCompleted ? Date.now() : undefined;

    // Optimistic Update
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: nextCompleted, completedAt: nextCompletedAt } : t
      ),
    }));

    apiFetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: nextCompleted, completedAt: nextCompletedAt }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to update task: ${error.message || error}`);
      // Rollback
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, completed: todo.completed, completedAt: todo.completedAt } : t
        ),
      }));
    });
  },

  deleteTodo: (id) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;

    // Optimistic Update
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));

    apiFetch(`/api/todos/${id}`, {
      method: "DELETE",
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to delete task: ${error.message || error}`);
      // Rollback (re-insert)
      set((state) => ({ todos: [todo, ...state.todos] }));
    });
  },

  editTodo: (id, patch) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;

    // Optimistic Update
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));

    apiFetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to save task changes: ${error.message || error}`);
      // Rollback
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? { ...t, ...todo } : t)),
      }));
    });
  },

  clearCompleted: () => {
    const completedTodos = get().todos.filter((t) => t.completed);
    if (completedTodos.length === 0) return;

    // Optimistic Update
    set((state) => ({
      todos: state.todos.filter((t) => !t.completed),
    }));

    apiFetch("/api/todos/clear-completed", {
      method: "POST",
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to clear completed tasks: ${error.message || error}`);
      // Rollback
      set((state) => ({ todos: [...state.todos, ...completedTodos] }));
    });
  },

  reorder: (fromId, toId) => {
    const previousTodos = get().todos;
    if (fromId === toId) return;

    const idxFrom = previousTodos.findIndex((t) => t.id === fromId);
    const idxTo = previousTodos.findIndex((t) => t.id === toId);
    if (idxFrom === -1 || idxTo === -1) return;

    const next = [...previousTodos];
    const [moved] = next.splice(idxFrom, 1);
    next.splice(idxTo, 0, moved);

    // Optimistic Update
    set({ todos: next });

    apiFetch("/api/todos/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((t) => t.id) }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to save task order: ${error.message || error}`);
      // Rollback
      set({ todos: previousTodos });
    });
  },

  setFilter: (filter) => set({ filter }),

  addSubtask: (todoId, text) => {
    const todo = get().todos.find((t) => t.id === todoId);
    if (!todo) return;

    const newSubtask = { id: uid(), text: text.trim(), done: false };
    const nextSubtasks = [...(todo.subtasks ?? []), newSubtask];

    // Optimistic Update
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId ? { ...t, subtasks: nextSubtasks } : t
      ),
    }));

    apiFetch(`/api/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtasks: nextSubtasks }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to add subtask: ${error.message || error}`);
      // Rollback
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === todoId ? { ...t, subtasks: todo.subtasks || [] } : t
        ),
      }));
    });
  },

  toggleSubtask: (todoId, subtaskId) => {
    const todo = get().todos.find((t) => t.id === todoId);
    if (!todo) return;

    const nextSubtasks = (todo.subtasks ?? []).map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done } : s
    );

    // Optimistic Update
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId ? { ...t, subtasks: nextSubtasks } : t
      ),
    }));

    apiFetch(`/api/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtasks: nextSubtasks }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to update subtask: ${error.message || error}`);
      // Rollback
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === todoId ? { ...t, subtasks: todo.subtasks || [] } : t
        ),
      }));
    });
  },

  deleteSubtask: (todoId, subtaskId) => {
    const todo = get().todos.find((t) => t.id === todoId);
    if (!todo) return;

    const nextSubtasks = (todo.subtasks ?? []).filter((s) => s.id !== subtaskId);

    // Optimistic Update
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === todoId ? { ...t, subtasks: nextSubtasks } : t
      ),
    }));

    apiFetch(`/api/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtasks: nextSubtasks }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to delete subtask: ${error.message || error}`);
      // Rollback
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === todoId ? { ...t, subtasks: todo.subtasks || [] } : t
        ),
      }));
    });
  },
}));

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
