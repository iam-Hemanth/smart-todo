import { NextResponse } from "next/server";

export const runtime = "edge";

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
  population?: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q,
    )}&count=8&language=en&format=json`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocode API responded with status ${res.status}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as { results?: GeoResult[] };
    const results = (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      country_code: r.country_code,
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
