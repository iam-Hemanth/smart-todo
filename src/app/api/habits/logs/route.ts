import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("SELECT * FROM habit_logs ORDER BY date DESC, created_at DESC");

    const logs = result.rows.map((row) => ({
      id: String(row.id),
      habitId: String(row.habit_id),
      date: String(row.date),
      count: Number(row.count),
      createdAt: Number(row.created_at),
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/habits/logs failed:", error);
    return NextResponse.json({ error: "Failed to fetch habit logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const log = await req.json();

    if (!log.habitId || !log.date || log.count === undefined) {
      return NextResponse.json({ error: "habitId, date, and count are required fields" }, { status: 400 });
    }

    const logId = log.id || `${log.habitId}-${log.date}`;
    const now = Date.now();

    // Perform SQLite upsert on conflict of (habit_id, date)
    await turso.execute({
      sql: `INSERT INTO habit_logs (
        id, habit_id, date, count, created_at
      ) VALUES (
        ?, ?, ?, ?, ?
      ) ON CONFLICT(habit_id, date) DO UPDATE SET
        count = excluded.count,
        created_at = excluded.created_at`,
      args: [
        logId,
        log.habitId,
        log.date,
        Number(log.count),
        now
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/habits/logs failed:", error);
    return NextResponse.json({ error: "Failed to log habit progress" }, { status: 500 });
  }
}
