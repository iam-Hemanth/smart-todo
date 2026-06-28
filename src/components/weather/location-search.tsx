"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { useLocationStore, type SelectedLocation } from "@/store/location-store";
import { cn } from "@/lib/utils";

interface GeoResult {
  id: number | string;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  lat: number;
  lon: number;
  timezone?: string;
  type?: string;
  importance?: number;
}

export function LocationSearch() {
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle input changes — clears results synchronously in the event handler
  // (not in an effect) when the query is too short.
  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }
  }

  // Debounced search — only fires when query >= 2 chars.
  // setLoading(true) is inside the setTimeout callback (async), not in the
  // effect body, so it doesn't trigger cascading renders.
  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setResults(json.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(r: GeoResult) {
    const next: SelectedLocation = {
      id: r.id,
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      country_code: r.country_code,
      lat: r.lat,
      lon: r.lon,
      timezone: r.timezone,
    };
    setLocation(next);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  async function useMyLocation() {
    setGeoError(null);
    setLocating(true);
    try {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation is not supported by your browser.");
      }
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60_000,
        });
      });

      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`,
      );
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();

      setLocation({
        name: data.name ?? "Current location",
        admin1: data.admin1,
        country: data.country,
        country_code: data.country_code,
        lat: latitude,
        lon: longitude,
      });
      setOpen(false);
      setQuery("");
      setResults([]);
    } catch (e) {
      setGeoError(
        e instanceof GeolocationPositionError
          ? "Location permission denied. You can search manually instead."
          : e instanceof Error
            ? e.message
            : "Could not get your location.",
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur px-3 py-1.5 text-xs font-medium hover:bg-background transition-colors"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
        <span className="max-w-[140px] truncate">{location.name}</span>
        {location.country_code && (
          <span className="text-[10px] uppercase text-muted-foreground">
            {location.country_code}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop — tap to close */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "z-50 overflow-hidden rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-xl",
                // Mobile: bottom sheet pinned to viewport bottom with safe margins
                "fixed inset-x-2 bottom-2 top-auto max-h-[75vh] sm:static sm:inset-x-auto sm:max-h-none",
                // Desktop: anchored popover on the right
                "sm:absolute sm:bottom-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(380px,calc(100vw-2rem))]",
              )}
            >
            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search any city…"
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    handleQueryChange("");
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors disabled:opacity-60"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" />
                )}
              </span>
              <span>
                <span className="block font-medium">Use my current location</span>
                <span className="block text-xs text-muted-foreground">
                  Detected via your browser
                </span>
              </span>
            </button>

            {geoError && (
              <p className="px-3 py-2 text-xs text-rose-600 dark:text-rose-300">{geoError}</p>
            )}

            <div className="max-h-72 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matches for “{query.trim()}”.
                </div>
              )}

              {!loading &&
                query.trim().length < 2 && (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                    Type at least 2 characters to search cities worldwide.
                  </div>
                )}

              {!loading &&
                results.map((r) => (
                  <button
                    key={`${r.id}-${r.lat}-${r.lon}`}
                    type="button"
                    onClick={() => pick(r)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{r.name}</span>
                        {r.type && (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                            {r.type}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[r.admin1, r.country].filter(Boolean).join(", ")}
                      </span>
                    </span>
                    {r.name === location.name &&
                      Math.abs(r.lat - location.lat) < 0.001 &&
                      Math.abs(r.lon - location.lon) < 0.001 && (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                  </button>
                ))}
            </div>

            <div className={cn("border-t border-border/60 px-3 py-1.5 text-[10px] text-muted-foreground")}>
              Powered by OpenStreetMap · Open-Meteo
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
