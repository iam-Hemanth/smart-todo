"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Trash2, StickyNote } from "lucide-react";
import { useNotesStore, type Note } from "@/store/notes-store";
import { NoteDialog } from "./note-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NotesList() {
  const notes = useNotesStore((s) => s.notes);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const loading = useNotesStore((s) => s.loading);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  function handleOpenCreate() {
    setSelectedNote(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(note: Note) {
    setSelectedNote(note);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Note controls */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="pl-10 h-11 rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] focus-visible:ring-emerald-400/40 focus-visible:border-emerald-500 placeholder:text-muted-foreground/70"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
          className="inline-flex items-center gap-1.5 rounded-xl text-white px-4 h-11 text-sm font-medium hover:opacity-90 transition-all shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Note</span>
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/40 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <StickyNote className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No notes found</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {search ? "Try refining your search keyword." : "Click 'New Note' above to write down your thoughts."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={cn(
                  "group anim-lift relative overflow-hidden rounded-2xl border p-4 cursor-pointer",
                  "border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]",
                  "hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05] transition-all flex flex-col justify-between min-h-[140px]"
                )}
                onClick={() => handleOpenEdit(note)}
              >
                <div className="space-y-1.5 min-w-0 pr-8">
                  <h4 className="font-semibold text-sm sm:text-base tracking-tight truncate">
                    {note.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
                  <span>Updated {formatNoteDate(note.updatedAt)}</span>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  aria-label="Delete note"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Note dialog composer */}
      <NoteDialog
        note={selectedNote}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function formatNoteDate(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
