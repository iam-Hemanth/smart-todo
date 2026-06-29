import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("SELECT * FROM journal_entries ORDER BY created_at DESC");

    const entries = result.rows.map((row) => ({
      id: String(row.id),
      content: String(row.content),
      mood: row.mood ? String(row.mood) : undefined,
      imageUrls: row.image_urls ? JSON.parse(String(row.image_urls)) : [],
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("GET /api/journal failed:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const entry = await req.json();

    if (!entry.id || entry.content === undefined) {
      return NextResponse.json({ error: "id and content are required fields" }, { status: 400 });
    }

    const now = Date.now();
    await turso.execute({
      sql: `INSERT INTO journal_entries (
        id, content, mood, image_urls, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?
      )`,
      args: [
        entry.id,
        entry.content.trim(),
        entry.mood || null,
        entry.imageUrls ? JSON.stringify(entry.imageUrls) : "[]",
        entry.createdAt || now,
        entry.updatedAt || now,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/journal failed:", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
