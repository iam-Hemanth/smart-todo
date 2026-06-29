"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, BookOpen } from "lucide-react";
import { useJournalStore } from "@/store/journal-store";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function JournalComposer() {
  const addEntry = useJournalStore((s) => s.addEntry);
  const uploadImages = useJournalStore((s) => s.uploadImages);

  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    
    // Revoke URL to avoid memory leaks
    URL.revokeObjectURL(previews[indexToRemove]);
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setUploadStatus("");

    try {
      let uploadedUrls: string[] = [];

      // Step 1: If there are photos, upload them server-side to Cloudinary
      if (selectedFiles.length > 0) {
        setUploadStatus("Uploading photos...");
        uploadedUrls = await uploadImages(selectedFiles);
      }

      // Step 2: Save the journal entry
      setUploadStatus("Saving entry...");
      const success = await addEntry(content, uploadedUrls);

      if (success) {
        // Reset composer state on success
        setContent("");
        setSelectedFiles([]);
        previews.forEach((p) => URL.revokeObjectURL(p));
        setPreviews([]);
        toast.success("Journal entry recorded successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to record journal entry");
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <Textarea
            placeholder="Write down what you did, thought, or felt today..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            rows={1}
            className="rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-emerald-400/40 focus-visible:border-emerald-500 min-h-[80px] resize-y leading-relaxed flex-1"
          />
        </div>

        {/* Selected Photos Preview */}
        {previews.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {previews.map((previewUrl, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border/30 bg-muted/40"
              >
                <img
                  src={previewUrl}
                  alt={`Selected photo preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  disabled={isSubmitting}
                  className="absolute top-1 right-1 h-5 w-5 rounded-md bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          {/* File Picker */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/50 hover:bg-muted px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span>Add Photos</span>
            </button>
          </div>

          {/* Submit controls */}
          <div className="flex items-center gap-3">
            {isSubmitting && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                {uploadStatus}
              </span>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              style={{ backgroundColor: "var(--accent-custom, #10b981)" }}
              className="rounded-xl text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Post Entry
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
