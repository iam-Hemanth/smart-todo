import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export async function PUT(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const { ids } = await req.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
    }

    // Build batch statements to update sort_order for each todo id
    const statements = ids.map((id, index) => ({
      sql: "UPDATE todos SET sort_order = ? WHERE id = ?",
      args: [index, id]
    }));

    if (statements.length > 0) {
      await turso.batch(statements, "write");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/todos/reorder failed:", error);
    return NextResponse.json({ error: "Failed to reorder todos" }, { status: 500 });
  }
}
