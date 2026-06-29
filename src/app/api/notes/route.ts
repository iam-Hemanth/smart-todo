import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("SELECT * FROM notes ORDER BY updated_at DESC");
    
    const notes = result.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      content: String(row.content),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("GET /api/notes failed:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const note = await req.json();

    if (!note.id || note.title === undefined || note.content === undefined) {
      return NextResponse.json({ error: "id, title, and content are required fields" }, { status: 400 });
    }

    const now = Date.now();
    await turso.execute({
      sql: `INSERT INTO notes (
        id, title, content, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?
      )`,
      args: [
        note.id,
        note.title.trim(),
        note.content,
        note.createdAt || now,
        note.updatedAt || now
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notes failed:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
