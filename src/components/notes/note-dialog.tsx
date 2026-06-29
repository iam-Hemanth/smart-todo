"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotesStore, type Note } from "@/store/notes-store";

interface NoteDialogProps {
  note?: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoteDialog({ note, open, onOpenChange }: NoteDialogProps) {
  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    let success = false;
    if (note) {
      success = await updateNote(note.id, title, content);
    } else {
      const id = await addNote(title, content);
      success = id !== null;
    }
    setSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl shadow-xl p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {note ? "Edit Note" : "Create Note"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="note-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Title
              </label>
              <Input
                id="note-title"
                placeholder="Enter title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl border border-border/60 bg-background/50 focus-visible:ring-emerald-400/40 focus-visible:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="note-content" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Content
              </label>
              <Textarea
                id="note-content"
                placeholder="Write something..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                className="rounded-xl border border-border/60 bg-background/50 focus-visible:ring-emerald-400/40 focus-visible:border-emerald-500 min-h-[180px] resize-y leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border bg-background/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors flex-1 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
              className="rounded-xl text-white px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-1 sm:flex-initial"
            >
              {note ? "Save Changes" : "Create Note"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
