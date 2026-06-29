"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export interface JournalEntry {
  id: string;
  content: string;
  mood?: string;
  imageUrls: string[];
  createdAt: number;
  updatedAt: number;
}

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  loadFromServer: () => Promise<void>;
  addEntry: (content: string, imageUrls: string[]) => Promise<string | null>;
  updateEntry: (id: string, content: string, imageUrls: string[]) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  uploadImages: (files: File[]) => Promise<string[]>;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: true,

  loadFromServer: async () => {
    try {
      set({ loading: true });
      const res = await apiFetch("/api/journal");
      if (!res.ok) throw new Error("Failed to load journal entries");
      const data = await res.json();
      set({ entries: data.entries || [], loading: false });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load journal entries from server.");
      set({ loading: false });
    }
  },

  addEntry: async (content, imageUrls) => {
    const newEntry: JournalEntry = {
      id: uid(),
      content: content.trim(),
      imageUrls: imageUrls,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic Update: Prepend entry
    set((state) => ({ entries: [newEntry, ...state.entries] }));

    try {
      const res = await apiFetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return newEntry.id;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to save journal entry: ${error.message || error}`);
      // Rollback
      set((state) => ({ entries: state.entries.filter((e) => e.id !== newEntry.id) }));
      return null;
    }
  },

  updateEntry: async (id, content, imageUrls) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return false;

    const previousEntry = { ...entry };
    const nextUpdatedAt = Date.now();

    // Optimistic Update
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, content: content.trim(), imageUrls, updatedAt: nextUpdatedAt }
          : e
      ),
    }));

    try {
      const res = await apiFetch(`/api/journal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), imageUrls }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to update journal entry: ${error.message || error}`);
      // Rollback
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? previousEntry : e)),
      }));
      return false;
    }
  },

  deleteEntry: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return false;

    // Optimistic Update
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));

    try {
      const res = await apiFetch(`/api/journal/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync");
      }

      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to delete journal entry: ${error.message || error}`);
      // Rollback
      set((state) => ({
        entries: [entry, ...state.entries].sort((a, b) => b.createdAt - a.createdAt),
      }));
      return false;
    }
  },

  uploadImages: async (files: File[]) => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("file", file);
    });

    const res = await apiFetch("/api/journal/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to upload images");
    }

    const data = await res.json();
    return data.urls || [];
  },
}));
