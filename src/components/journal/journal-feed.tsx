"use client";

import { useState, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, BookOpen, ZoomIn } from "lucide-react";
import { useJournalStore, type JournalEntry } from "@/store/journal-store";
import { JournalEditDialog } from "./journal-edit-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function getDayGroupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

export function JournalFeed() {
  const entries = useJournalStore((s) => s.entries);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const loading = useJournalStore((s) => s.loading);

  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Group entries by day (Newest First)
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: JournalEntry[] } = {};
    for (const entry of entries) {
      const date = new Date(entry.createdAt);
      const label = getDayGroupLabel(date);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(entry);
    }
    return Object.entries(groups);
  }, [entries]);

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditEntry(entry);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 bg-muted/30 animate-pulse rounded-md" />
              <div className="h-32 rounded-3xl bg-muted/20 animate-pulse border border-border/10" />
            </div>
          ))}
        </div>
      ) : groupedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/40 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No journal entries yet</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Share how your day went by writing your first entry above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {groupedEntries.map(([dayLabel, dayEntries]) => (
              <motion.div
                key={dayLabel}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Date Header */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                  {dayLabel}
                </h3>

                <div className="space-y-2">
                  {dayEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className={cn(
                        "group anim-lift relative overflow-hidden rounded-2xl border p-4 sm:p-5 cursor-pointer",
                        "border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]",
                        "hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05] transition-all flex flex-col gap-3"
                      )}
                      onClick={() => handleOpenEdit(entry)}
                    >
                      {/* Entry Header */}
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          {format(new Date(entry.createdAt), "h:mm a")}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>

                      {/* Images Grid */}
                      {entry.imageUrls && entry.imageUrls.length > 0 && (
                        <div
                          className={cn(
                            "grid gap-2 mt-1 rounded-2xl overflow-hidden border border-border/30",
                            entry.imageUrls.length === 1 ? "grid-cols-1 max-h-[300px]" :
                            entry.imageUrls.length === 2 ? "grid-cols-2 max-h-[200px]" :
                            entry.imageUrls.length === 3 ? "grid-cols-3 max-h-[160px]" : "grid-cols-4 max-h-[140px]"
                          )}
                          onClick={(e) => e.stopPropagation()} // Stop edit trigger when clicking images region
                        >
                          {entry.imageUrls.map((url, index) => (
                            <div
                              key={index}
                              onClick={() => setLightboxUrl(url)}
                              className="relative aspect-video sm:aspect-auto h-full w-full cursor-zoom-in group/img overflow-hidden bg-muted/30"
                            >
                              <img
                                src={url}
                                alt={`Journal attachment ${index + 1}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="h-5 w-5 text-white drop-shadow" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Delete Action button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEntry(entry.id);
                        }}
                        aria-label="Delete entry"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Editor Modal */}
      <JournalEditDialog
        entry={editEntry}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Lightbox / Zoom Dialog */}
      <Dialog open={lightboxUrl !== null} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-1 border-0 bg-transparent shadow-none flex items-center justify-center">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt="Zoomed attachment"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
