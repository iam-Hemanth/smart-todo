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

    if ("name" in patch) addField("name", patch.name.trim());
    if ("targetCount" in patch) addField("target_count", patch.targetCount != null ? Number(habitTarget(patch.targetCount)) : null);
    if ("unit" in patch) addField("unit", patch.unit || null);
    if ("archived" in patch) addField("archived", patch.archived ? 1 : 0);

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields specified for update" }, { status: 400 });
    }

    args.push(id);
    const sql = `UPDATE habits SET ${fields.join(", ")} WHERE id = ?`;

    const result = await turso.execute({ sql, args });
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/habits/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 });
  }
}

function habitTarget(val: any) {
  if (val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
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
    
    // Batch delete habit definition and related logs in a transaction
    await turso.batch([
      {
        sql: "DELETE FROM habits WHERE id = ?",
        args: [id]
      },
      {
        sql: "DELETE FROM habit_logs WHERE habit_id = ?",
        args: [id]
      }
    ], "write");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/habits/${id} failed:`, error);
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
