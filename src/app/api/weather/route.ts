import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const BANGALORE_LAT = 12.9716;
const BANGALORE_LON = 77.5946;

export async function GET() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${BANGALORE_LAT}&longitude=${BANGALORE_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;

    const res = await fetch(url, {
      // Cache briefly so concurrent requests don't hammer the API
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Weather API responded with status ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
