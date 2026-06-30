import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { z } from "zod/v4";

/**
 * POST /api/fitness/sync
 *
 * Public-facing endpoint called by an iOS Shortcut.
 * ALWAYS requires Authorization: Bearer <PERSONAL_API_TOKEN>.
 * Does NOT honour same-origin trust — this is intentional because the route
 * is designed for external callers only and we want an explicit token check.
 */

const FitnessSyncSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  steps: z.number().int().min(0),
  calories: z.number().int().min(0),
  distance_km: z.number().min(0),
  flights_climbed: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  // ── 1. Strict token auth (no same-origin bypass) ──────────────
  const token = process.env.PERSONAL_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server configuration error: PERSONAL_API_TOKEN is not set" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or malformed Authorization header" },
      { status: 401 }
    );
  }

  if (authHeader.substring(7) !== token) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid API token" },
      { status: 401 }
    );
  }

  // ── 2. Parse & validate body ──────────────────────────────────
  let body: z.infer<typeof FitnessSyncSchema>;
  try {
    const raw = await req.json();
    body = FitnessSyncSchema.parse(raw);
  } catch (error: any) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "Invalid JSON body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── 3. Upsert into fitness_logs ───────────────────────────────
  try {
    await initDb();
    const now = Date.now();
    const id = `fitness-${body.date}`;

    await turso.execute({
      sql: `INSERT INTO fitness_logs (
        id, date, steps, calories, distance_km, flights_climbed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        steps = excluded.steps,
        calories = excluded.calories,
        distance_km = excluded.distance_km,
        flights_climbed = excluded.flights_climbed,
        updated_at = excluded.updated_at`,
      args: [
        id,
        body.date,
        body.steps,
        body.calories,
        body.distance_km,
        body.flights_climbed ?? null,
        now,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        date: body.date,
        steps: body.steps,
        calories: body.calories,
        distanceKm: body.distance_km,
        flightsClimbed: body.flights_climbed ?? null,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("POST /api/fitness/sync failed:", error);
    return NextResponse.json(
      { error: "Failed to sync fitness data" },
      { status: 500 }
    );
  }
}
