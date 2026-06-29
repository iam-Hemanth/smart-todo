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

    if ("text" in patch) addField("text", patch.text);
    if ("category" in patch) addField("category", patch.category);
    if ("priority" in patch) addField("priority", patch.priority);
    if ("completed" in patch) addField("completed", patch.completed ? 1 : 0);
    if ("completedAt" in patch) addField("completed_at", patch.completedAt ?? null);
    if ("dueDate" in patch) addField("due_date", patch.dueDate ?? null);
    if ("tags" in patch) addField("tags", patch.tags ? JSON.stringify(patch.tags) : "[]");
    if ("notes" in patch) addField("notes", patch.notes ?? null);
    if ("estimateMinutes" in patch) addField("estimate_minutes", patch.estimateMinutes ?? null);
    if ("color" in patch) addField("color", patch.color ?? null);
    if ("subtasks" in patch) addField("subtasks", patch.subtasks ? JSON.stringify(patch.subtasks) : "[]");

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields specified for update" }, { status: 400 });
    }

    args.push(id);
    const sql = `UPDATE todos SET ${fields.join(", ")} WHERE id = ?`;

    const result = await turso.execute({ sql, args });
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/todos/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
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
      sql: "DELETE FROM todos WHERE id = ?",
      args: [id]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/todos/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
