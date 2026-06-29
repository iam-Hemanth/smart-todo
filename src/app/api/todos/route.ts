import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const result = await turso.execute("SELECT * FROM todos ORDER BY sort_order ASC, created_at DESC");
    
    const todos = result.rows.map((row) => ({
      id: String(row.id),
      text: String(row.text),
      category: String(row.category),
      priority: String(row.priority),
      completed: row.completed === 1,
      createdAt: Number(row.created_at),
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      dueDate: row.due_date ? String(row.due_date) : undefined,
      tags: row.tags ? JSON.parse(String(row.tags)) : [],
      notes: row.notes ? String(row.notes) : undefined,
      estimateMinutes: row.estimate_minutes ? Number(row.estimate_minutes) : undefined,
      color: row.color ? String(row.color) : undefined,
      subtasks: row.subtasks ? JSON.parse(String(row.subtasks)) : [],
    }));

    return NextResponse.json({ todos });
  } catch (error) {
    console.error("GET /api/todos failed:", error);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();
    const todo = await req.json();

    if (!todo.id || !todo.text) {
      return NextResponse.json({ error: "id and text are required fields" }, { status: 400 });
    }

    // Determine sort_order to prepend (Zustand puts new todos at the top)
    const minOrderResult = await turso.execute("SELECT MIN(sort_order) as min_order FROM todos");
    const minOrder = minOrderResult.rows[0]?.min_order != null 
      ? Number(minOrderResult.rows[0].min_order) 
      : 0;
    const sortOrder = minOrder - 1;

    await turso.execute({
      sql: `INSERT INTO todos (
        id, text, category, priority, completed, created_at, completed_at,
        due_date, tags, notes, estimate_minutes, color, subtasks, sort_order
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      args: [
        todo.id,
        todo.text.trim(),
        todo.category || "indoor",
        todo.priority || "medium",
        todo.completed ? 1 : 0,
        todo.createdAt || Date.now(),
        todo.completedAt || null,
        todo.dueDate || null,
        todo.tags ? JSON.stringify(todo.tags) : "[]",
        todo.notes || null,
        todo.estimateMinutes || null,
        todo.color || null,
        todo.subtasks ? JSON.stringify(todo.subtasks) : "[]",
        sortOrder
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/todos failed:", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
