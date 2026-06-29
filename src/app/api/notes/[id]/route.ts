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

    if ("title" in patch) addField("title", patch.title.trim());
    if ("content" in patch) addField("content", patch.content);
    
    // Always update the updated_at timestamp when modifying a note
    const now = Date.now();
    addField("updated_at", now);

    if (fields.length <= 1) { // Only updated_at is present
      return NextResponse.json({ error: "No fields specified for update" }, { status: 400 });
    }

    args.push(id);
    const sql = `UPDATE notes SET ${fields.join(", ")} WHERE id = ?`;

    const result = await turso.execute({ sql, args });
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedAt: now });
  } catch (error) {
    console.error(`PATCH /api/notes/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
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
      sql: "DELETE FROM notes WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/notes/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
