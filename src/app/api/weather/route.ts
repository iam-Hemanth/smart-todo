import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;

/**
 * In-memory cache of the last successful AQI response per location key.
 * Keyed by rounded lat/lon (2 decimal places ≈ ~1km).
 * Falls back to this when the live AQI fetch fails, so the UI doesn't
 * flicker to "—" on transient network errors.
 *
 * Note: edge runtime persists this across requests within the same isolate,
 * but it may be evicted. This is best-effort — not a durable cache.
 */
const aqiCache = new Map<string, { data: unknown; ts: number }>();
const AQI_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — AQI doesn't change fast

function locationKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function safeFetchJson(
  url: string,
  retries = 2,
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  let lastError: string | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      const data = await res.json();
      return { ok: true, data };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Unknown error";
      // Brief pause before retry
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
    }
  }
  return { ok: false, data: null, error: lastError };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat") ?? DEFAULT_LAT);
  const lon = Number(searchParams.get("lon") ?? DEFAULT_LON);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: "lat and lon must be numeric" },
      { status: 400 },
    );
  }

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&forecast_days=2&timezone=auto`;

  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide&timezone=auto`;

  const [weatherResult, aqiResult] = await Promise.all([
    safeFetchJson(weatherUrl),
    safeFetchJson(aqiUrl),
  ]);

  if (!weatherResult.ok || !weatherResult.data) {
    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        weatherError: weatherResult.error,
      },
      { status: 502 },
    );
  }

  // AQI handling: use live result if ok; otherwise fall back to cached value
  // (if fresh enough) so the UI doesn't flicker to "—" on transient errors.
  const key = locationKey(lat, lon);
  let aqiData: unknown = null;
  let aqiError: string | null = null;
  let aqiStale = false;

  if (aqiResult.ok && aqiResult.data) {
    aqiData = aqiResult.data;
    // Cache the successful result
    aqiCache.set(key, { data: aqiResult.data, ts: Date.now() });
  } else {
    aqiError = aqiResult.error ?? null;
    // Try the cache
    const cached = aqiCache.get(key);
    if (cached && Date.now() - cached.ts < AQI_CACHE_TTL_MS) {
      aqiData = cached.data;
      aqiStale = true;
    }
  }

  return NextResponse.json(
    {
      weather: weatherResult.data,
      aqi: aqiData,
      aqiError,
      aqiStale,
    },
    {
      headers: {
        // 60s fresh, then revalidate in background for 5 min
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
