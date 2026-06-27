import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;

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

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;

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

  return NextResponse.json(
    {
      weather: weatherResult.data,
      aqi: aqiResult.ok ? aqiResult.data : null,
      aqiError: aqiResult.error ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
