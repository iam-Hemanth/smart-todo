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
  /** OSM place class/type for display, e.g. "city", "suburb", "village" */
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

/**
 * Search cities, towns, villages, suburbs, neighborhoods, hamlets worldwide
 * via OpenStreetMap Nominatim. Far better local-area coverage than Open-Meteo.
 *
 * Docs: https://nominatim.org/release-docs/develop/api/Search/
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // `addressdetails=1` returns structured address; `countrycodes` left open for global search.
    // We don't restrict by feature type because users may want suburbs/neighborhoods too.
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&q=${encodeURIComponent(
      q,
    )}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        // Nominatim usage policy requires a valid HTTP Referer / User-Agent
        Referer: "smart-todo.app",
        "User-Agent": "SmartTodo/1.0 (weather-aware todo app)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocode API responded with status ${res.status}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as NominatimResult[];

    // Rank results: prioritize populated places (city/town/village/suburb) over
    // arbitrary geographic features, then by Nominatim's importance score.
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
    };

    const results: GeoResult[] = data
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

    return NextResponse.json(
      { results },
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
