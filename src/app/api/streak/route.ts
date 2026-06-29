import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("SELECT day FROM streak_days ORDER BY day ASC");
    const completionDays = result.rows.map((row) => String(row.day));
    return NextResponse.json({ completionDays });
  } catch (error) {
    console.error("GET /api/streak failed:", error);
    return NextResponse.json({ error: "Failed to fetch streak days" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const { day } = await req.json();

    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return NextResponse.json({ error: "Invalid day format. Expected YYYY-MM-DD" }, { status: 400 });
    }

    await turso.execute({
      sql: "INSERT OR IGNORE INTO streak_days (day) VALUES (?)",
      args: [day]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/streak failed:", error);
    return NextResponse.json({ error: "Failed to record streak day" }, { status: 500 });
  }
}
