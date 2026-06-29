import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("DELETE FROM todos WHERE completed = 1");
    return NextResponse.json({ success: true, count: result.rowsAffected });
  } catch (error) {
    console.error("POST /api/todos/clear-completed failed:", error);
    return NextResponse.json({ error: "Failed to clear completed todos" }, { status: 500 });
  }
}
