import { NextResponse } from "next/server";

export const runtime = "edge";

export interface GeoResult {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  lat: number;
  lon: number;
  type?: string;
  importance?: number;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    county?: string;
    state?: string;
    state_district?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
  importance?: number;
}

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  feature_code?: string;
  population?: number;
  timezone?: string;
}

function pickPrimaryName(r: NominatimResult): string {
  if (r.name && r.name.length > 0) return r.name;
  const a = r.address ?? {};
  return (
    a.neighbourhood ||
    a.quarter ||
    a.suburb ||
    a.hamlet ||
    a.village ||
    a.town ||
    a.city ||
    a.county ||
    a.state_district ||
    a.state ||
    a.country ||
    r.display_name?.split(",")[0] ||
    "Unknown"
  );
}

function pickAdmin1(r: NominatimResult): string | undefined {
  const a = r.address ?? {};
  return a.state || a.state_district || a.region || a.county;
}

const TYPE_PRIORITY: Record<string, number> = {
  city: 0,
  town: 1,
  municipality: 2,
  suburb: 3,
  commune: 4,
  village: 5,
  neighbourhood: 6,
  quarter: 7,
  hamlet: 8,
  county: 9,
  state_district: 10,
  state: 11,
  region: 12,
  bus_stop: 13,
  train_station: 14,
  station: 15,
  aerialway_station: 16,
  tram_stop: 17,
  bus_station: 18,
  administrative: 19,
};

function rankNominatim(results: NominatimResult[]): GeoResult[] {
  return results
    .map((r) => ({
      id: `osm-${r.place_id}`,
      name: pickPrimaryName(r),
      admin1: pickAdmin1(r),
      country: r.address?.country,
      country_code: r.address?.country_code?.toUpperCase(),
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type,
      importance: r.importance,
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .sort((a, b) => {
      const pa = TYPE_PRIORITY[a.type ?? ""] ?? 99;
      const pb = TYPE_PRIORITY[b.type ?? ""] ?? 99;
      if (pa !== pb) return pa - pb;
      return (b.importance ?? 0) - (a.importance ?? 0);
    });
}

/**
 * Generates a prioritized list of spelling variants for South-Indian place
 * names. Order matters — we try the most likely spellings first to minimize
 * API calls to Nominatim (which has a 1 req/sec policy).
 *
 * Priority order:
 *   1. Original + common suffixes (-u, -a, -ru, -uru)
 *   2. Single vowel swap at each position (no suffix)
 *   3. Single vowel swap + common suffixes
 *   4. Consonant doubling/un-doubling + suffixes
 */
function buildSmartVariants(q: string): string[] {
  const cleaned = q.trim();
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (v: string) => {
    if (v !== cleaned && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };

  if (cleaned.length <= 3) return out;

  const suffixes = ["u", "a", "ru", "uru"];

  // Tier 1: original + suffixes
  for (const s of suffixes) push(cleaned + s);
  // Also strip trailing vowel and re-add
  if (cleaned.endsWith("u")) {
    push(cleaned.slice(0, -1));
    push(cleaned.slice(0, -1) + "a");
  }
  if (cleaned.endsWith("a")) {
    push(cleaned + "u");
    push(cleaned.slice(0, -1) + "u");
  }

  // Tier 2: single vowel swaps at each position (no suffix)
  const swapable = [
    ["a", "u"], ["u", "a"],
    ["i", "e"], ["e", "i"],
    ["a", "i"], ["i", "a"],
    ["a", "e"], ["e", "a"],
  ];
  const swapVariants: string[] = [];
  for (const [from, to] of swapable) {
    let idx = cleaned.indexOf(from);
    while (idx !== -1) {
      if (idx > 0) {
        const v = cleaned.slice(0, idx) + to + cleaned.slice(idx + 1);
        push(v);
        swapVariants.push(v);
      }
      idx = cleaned.indexOf(from, idx + 1);
    }
  }

  // Tier 3: each vowel-swap variant + suffixes (u first — most common)
  for (const sv of swapVariants) {
    push(sv + "u"); // most common South-Indian suffix
    if (sv.endsWith("u")) push(sv.slice(0, -1));
    if (sv.endsWith("a")) push(sv.slice(0, -1) + "u");
  }
  for (const sv of swapVariants) {
    for (const s of ["a", "ru", "uru"]) push(sv + s);
  }

  // Tier 4: consonant doubling/un-doubling + suffixes
  const consonantVariants: string[] = [];
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i] === cleaned[i - 1] && /[bdfgkmnprst]/i.test(cleaned[i])) {
      const v = cleaned.slice(0, i) + cleaned.slice(i + 1);
      push(v);
      consonantVariants.push(v);
    }
    if (/[bdfgkmnprst]/i.test(cleaned[i]) && cleaned[i] !== cleaned[i - 1]) {
      const v = cleaned.slice(0, i) + cleaned[i] + cleaned.slice(i);
      push(v);
      consonantVariants.push(v);
    }
  }
  for (const cv of consonantVariants) {
    for (const s of suffixes) push(cv + s);
  }

  return out;
}

async function fetchNominatim(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=12&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Referer: "smart-todo.app",
      "User-Agent": "SmartTodo/1.0 (weather-aware todo app)",
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

async function fetchOpenMeteo(query: string): Promise<GeoResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query,
  )}&count=8&language=en&format=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  return (data.results ?? []).map((r) => ({
    id: `om-${r.id}`,
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    country_code: r.country_code?.toUpperCase(),
    lat: r.latitude,
    lon: r.longitude,
    type: r.feature_code?.toLowerCase(),
    importance: r.population ? Math.log10(r.population) : undefined,
    timezone: r.timezone,
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Strategy 1: try the exact query on Nominatim
    let nominatimResults = await fetchNominatim(q);

    // Strategy 2: if nothing, try a FEW high-probability transliteration
    // variants on Nominatim. We cap at 5 to avoid timeout — Nominatim's
    // 1 req/sec policy means each variant adds ~1s of latency.
    if (nominatimResults.length === 0) {
      const variants = buildSmartVariants(q).slice(0, 5);
      for (const v of variants) {
        try {
          const hits = await fetchNominatim(v);
          if (hits.length > 0) {
            nominatimResults = hits;
            break;
          }
        } catch {
          // continue to next variant
        }
      }
    }

    // Strategy 3: in parallel, also query Open-Meteo geocoder (different dataset)
    let openMeteoResults: GeoResult[] = [];
    try {
      openMeteoResults = await fetchOpenMeteo(q);
    } catch {
      // ignore — Nominatim is primary
    }

    // Deduplicate by lat/lon proximity (within ~1km)
    const seen = new Set<string>();
    const dedupe = (list: GeoResult[]) =>
      list.filter((r) => {
        const key = `${r.lat.toFixed(2)}|${r.lon.toFixed(2)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const ranked = dedupe(rankNominatim(nominatimResults));
    const merged = [...ranked, ...dedupe(openMeteoResults)];

    return NextResponse.json(
      { results: merged.slice(0, 10) },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=120, stale-while-revalidate=600",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
