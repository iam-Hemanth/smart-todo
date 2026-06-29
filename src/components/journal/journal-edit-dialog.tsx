"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useJournalStore, type JournalEntry } from "@/store/journal-store";
import { X } from "lucide-react";

interface JournalEditDialogProps {
  entry: JournalEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEditDialog({ entry, open, onOpenChange }: JournalEditDialogProps) {
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setContent(entry.content);
      setImageUrls(entry.imageUrls || []);
    } else {
      setContent("");
      setImageUrls([]);
    }
  }, [entry, open]);

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !content.trim()) return;

    setSubmitting(true);
    const success = await updateEntry(entry.id, content, imageUrls);
    setSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-3xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl shadow-xl p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Edit Journal Entry
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="journal-edit-content" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                What's on your mind?
              </label>
              <Textarea
                id="journal-edit-content"
                placeholder="Write your entry..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="rounded-xl border border-border/60 bg-background/50 focus-visible:ring-emerald-400/40 focus-visible:border-emerald-500 min-h-[140px] resize-y leading-relaxed"
              />
            </div>

            {imageUrls.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Photos ({imageUrls.length})
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/40">
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-md bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              disabled={submitting || !content.trim()}
              style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
              className="rounded-xl text-white px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-1 sm:flex-initial"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
