import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Reverse-geocodes a lat/lon pair to a city name using the free
 * BigDataCloud Client API (no API key required).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat,
    )}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Reverse geocode API responded with status ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    const name =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.localityInfo?.administrative?.[0]?.name ||
      "Current location";

    return NextResponse.json({
      name,
      admin1: data.principalSubdivision,
      country: data.countryName,
      country_code: data.countryCode,
      lat: Number(lat),
      lon: Number(lon),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
