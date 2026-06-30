import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();

    // Default range: last 30 days
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

    const result = await turso.execute({
      sql: "SELECT * FROM fitness_logs WHERE date >= ? ORDER BY date DESC",
      args: [startDate],
    });

    const logs = result.rows.map((row) => ({
      id: String(row.id),
      date: String(row.date),
      steps: Number(row.steps),
      calories: Number(row.calories),
      distanceKm: Number(row.distance_km),
      flightsClimbed: row.flights_climbed != null ? Number(row.flights_climbed) : null,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/fitness failed:", error);
    return NextResponse.json({ error: "Failed to fetch fitness logs" }, { status: 500 });
  }
}
