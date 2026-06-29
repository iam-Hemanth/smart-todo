"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  loading: boolean;
  loadFromServer: () => Promise<void>;
  addNote: (title: string, content: string) => Promise<string | null>;
  updateNote: (id: string, title: string, content: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: true,

  loadFromServer: async () => {
    try {
      set({ loading: true });
      const res = await apiFetch("/api/notes");
      if (!res.ok) throw new Error("Failed to load notes");
      const data = await res.json();
      set({ notes: data.notes || [], loading: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notes from server.");
      set({ loading: false });
    }
  },

  addNote: async (title, content) => {
    const newNote: Note = {
      id: uid(),
      title: title.trim(),
      content: content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic Update: Add to the beginning of the list
    set((state) => ({ notes: [newNote, ...state.notes] }));

    try {
      const res = await apiFetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return newNote.id;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to create note: ${error.message || error}`);
      // Rollback
      set((state) => ({ notes: state.notes.filter((n) => n.id !== newNote.id) }));
      return null;
    }
  },

  updateNote: async (id, title, content) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return false;

    const previousNote = { ...note };
    const nextUpdatedAt = Date.now();

    // Optimistic Update and sort by updated_at DESC
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, title: title.trim(), content, updatedAt: nextUpdatedAt }
          : n
      ).sort((a, b) => b.updatedAt - a.updatedAt),
    }));

    try {
      const res = await apiFetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to save note: ${error.message || error}`);
      // Rollback
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? previousNote : n))
          .sort((a, b) => b.updatedAt - a.updatedAt),
      }));
      return false;
    }
  },

  deleteNote: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return false;

    // Optimistic Update
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));

    try {
      const res = await apiFetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to delete note: ${error.message || error}`);
      // Rollback
      set((state) => ({
        notes: [note, ...state.notes].sort((a, b) => b.updatedAt - a.updatedAt),
      }));
      return false;
    }
  },
}));
