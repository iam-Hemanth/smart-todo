import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL environment variable is not defined");
}

export const turso = createClient({
  url,
  authToken,
});

let dbInitialized: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (dbInitialized) return dbInitialized;

  dbInitialized = (async () => {
    try {
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          category TEXT NOT NULL,
          priority TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          completed_at INTEGER,
          due_date TEXT,
          tags TEXT,
          notes TEXT,
          estimate_minutes INTEGER,
          color TEXT,
          subtasks TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `);

      await turso.execute(`
        CREATE TABLE IF NOT EXISTS streak_days (
          day TEXT PRIMARY KEY
        )
      `);

      await turso.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
    } catch (error) {
      dbInitialized = null; // Reset to allow retry on failure
      console.error("Database initialization failed:", error);
      throw error;
    }
  })();

  return dbInitialized;
}
