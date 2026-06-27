import { NextResponse } from "next/server";

export const runtime = "edge";

interface NominatimReverse {
  name?: string;
  display_name: string;
  type?: string;
  address?: {
    neighbourhood?: string;
    quarter?: string;
    suburb?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
}

function pickPrimaryName(r: NominatimReverse): string {
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
    a.municipality ||
    a.county ||
    a.state_district ||
    a.state ||
    a.country ||
    r.display_name?.split(",")[0] ||
    "Current location"
  );
}

/**
 * Reverse-geocodes a lat/lon to a place name via OpenStreetMap Nominatim.
 * Better neighborhood-level detail than BigDataCloud.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    // zoom=10 gives city/suburb-level detail (0=country, 18=building)
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat,
    )}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Referer: "smart-todo.app",
        "User-Agent": "SmartTodo/1.0 (weather-aware todo app)",
      },
    });

    if (!res.ok) {
      // Fall back to BigDataCloud client API if Nominatim fails (no key required)
      const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
        lat,
      )}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
      const fb = await fetch(fallbackUrl, { cache: "no-store" });
      if (!fb.ok) {
        return NextResponse.json(
          { error: `Reverse geocode failed (${res.status}/${fb.status})` },
          { status: 502 },
        );
      }
      const data = await fb.json();
      const name =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        "Current location";
      return NextResponse.json({
        name,
        admin1: data.principalSubdivision,
        country: data.countryName,
        country_code: data.countryCode?.toUpperCase(),
        lat: Number(lat),
        lon: Number(lon),
      });
    }

    const data = (await res.json()) as NominatimReverse;
    const a = data.address ?? {};

    return NextResponse.json({
      name: pickPrimaryName(data),
      admin1: a.state || a.state_district || a.region || a.county,
      country: a.country,
      country_code: a.country_code?.toUpperCase(),
      lat: Number(lat),
      lon: Number(lon),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
