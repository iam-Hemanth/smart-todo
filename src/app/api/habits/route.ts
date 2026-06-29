import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("SELECT * FROM habits ORDER BY created_at ASC");
    
    const habits = result.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      targetCount: row.target_count != null ? Number(row.target_count) : undefined,
      unit: row.unit ? String(row.unit) : undefined,
      createdAt: Number(row.created_at),
      archived: row.archived === 1,
    }));

    return NextResponse.json({ habits });
  } catch (error) {
    console.error("GET /api/habits failed:", error);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const habit = await req.json();

    if (!habit.id || !habit.name) {
      return NextResponse.json({ error: "id and name are required fields" }, { status: 400 });
    }

    await turso.execute({
      sql: `INSERT INTO habits (
        id, name, target_count, unit, created_at, archived
      ) VALUES (
        ?, ?, ?, ?, ?, ?
      )`,
      args: [
        habit.id,
        habit.name.trim(),
        habit.targetCount != null ? Number(habit.targetCount) : null,
        habit.unit || null,
        habit.createdAt || Date.now(),
        habit.archived ? 1 : 0
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/habits failed:", error);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
