import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  const { id } = await params;

  try {
    await initDb();
    const patch = await req.json();

    const fields: string[] = [];
    const args: any[] = [];

    const addField = (dbCol: string, val: any) => {
      fields.push(`${dbCol} = ?`);
      args.push(val);
    };

    if ("content" in patch) addField("content", patch.content.trim());
    if ("mood" in patch) addField("mood", patch.mood || null);
    if ("imageUrls" in patch) addField("image_urls", patch.imageUrls ? JSON.stringify(patch.imageUrls) : "[]");

    const now = Date.now();
    addField("updated_at", now);

    if (fields.length <= 1) { // Only updated_at is present
      return NextResponse.json({ error: "No fields specified for update" }, { status: 400 });
    }

    args.push(id);
    const sql = `UPDATE journal_entries SET ${fields.join(", ")} WHERE id = ?`;

    const result = await turso.execute({ sql, args });
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedAt: now });
  } catch (error) {
    console.error(`PATCH /api/journal/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  const { id } = await params;

  try {
    await initDb();
    const result = await turso.execute({
      sql: "DELETE FROM journal_entries WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/journal/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to delete journal entry" }, { status: 500 });
  }
}
