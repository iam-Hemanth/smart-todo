import { NextResponse } from "next/server";
import { initDb, turso } from "@/lib/turso";
import { checkAuth } from "@/lib/auth";
import { format, subDays, subMonths, differenceInCalendarDays, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

type Range = "30d" | "90d" | "6mo" | "1yr" | "all";

const STREAK_GOAL = 8000;

function getRangeCutoff(range: Range): string | null {
  const now = new Date();
  switch (range) {
    case "30d": return format(subDays(now, 30), "yyyy-MM-dd");
    case "90d": return format(subDays(now, 90), "yyyy-MM-dd");
    case "6mo": return format(subMonths(now, 6), "yyyy-MM-dd");
    case "1yr": return format(subDays(now, 365), "yyyy-MM-dd");
    case "all": return null;
  }
}

function computeStreaks(sortedDates: string[]): { current: number; longest: number } {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let currentRun = 1;

  // Build runs of consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseISO(sortedDates[i - 1]);
    const curr = parseISO(sortedDates[i]);
    const diff = differenceInCalendarDays(curr, prev);

    if (diff === 1) {
      currentRun++;
    } else {
      if (currentRun > longest) longest = currentRun;
      currentRun = 1;
    }
  }
  if (currentRun > longest) longest = currentRun;

  // Current streak: check if the last date in the list is today or yesterday
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const lastDate = sortedDates[sortedDates.length - 1];

  let current = 0;
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const curr = parseISO(sortedDates[i + 1]);
      const prev = parseISO(sortedDates[i]);
      if (differenceInCalendarDays(curr, prev) === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

export async function GET(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    await initDb();

    const url = new URL(req.url);
    const range = (url.searchParams.get("range") || "all") as Range;
    if (!["30d", "90d", "6mo", "1yr", "all"].includes(range)) {
      return NextResponse.json({ error: "Invalid range parameter" }, { status: 400 });
    }

    const cutoff = getRangeCutoff(range);
    const whereClause = cutoff ? `WHERE date >= '${cutoff}'` : "";

    // ── 1. Best single day (steps) ────────────────────────────────
    const bestDayResult = await turso.execute(
      `SELECT date, steps FROM fitness_logs ${whereClause} ORDER BY steps DESC LIMIT 1`
    );
    const bestDay = bestDayResult.rows.length > 0
      ? { date: String(bestDayResult.rows[0].date), steps: Number(bestDayResult.rows[0].steps) }
      : null;

    // ── 2. Best 7-day rolling window (steps) ──────────────────────
    const rollingResult = await turso.execute(
      `SELECT date, steps,
              SUM(steps) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as rolling_sum,
              COUNT(*) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as window_size
       FROM fitness_logs ${whereClause}
       ORDER BY rolling_sum DESC
       LIMIT 1`
    );
    let bestWeek: { startDate: string; endDate: string; steps: number } | null = null;
    if (rollingResult.rows.length > 0) {
      const row = rollingResult.rows[0];
      const endDate = String(row.date);
      const endParsed = parseISO(endDate);
      const startDate = format(subDays(endParsed, 6), "yyyy-MM-dd");
      bestWeek = {
        startDate,
        endDate,
        steps: Number(row.rolling_sum),
      };
    }

    // ── 3. Streaks (consecutive days ≥ goal) ──────────────────────
    const streakResult = await turso.execute(
      `SELECT date FROM fitness_logs ${whereClause ? whereClause + ` AND steps >= ${STREAK_GOAL}` : `WHERE steps >= ${STREAK_GOAL}`} ORDER BY date ASC`
    );
    const streakDates = streakResult.rows.map((r) => String(r.date));
    const streaks = computeStreaks(streakDates);

    // ── 4. Heatmap (ALL data, no range filter) ────────────────────
    const heatmapResult = await turso.execute(
      "SELECT date, steps FROM fitness_logs ORDER BY date ASC"
    );
    const heatmap = heatmapResult.rows.map((r) => ({
      date: String(r.date),
      steps: Number(r.steps),
    }));

    // ── 5. Day-of-week averages ───────────────────────────────────
    const dowResult = await turso.execute(
      `SELECT strftime('%w', date) as dow, CAST(AVG(steps) AS INTEGER) as avg_steps, COUNT(*) as cnt
       FROM fitness_logs ${whereClause}
       GROUP BY dow
       ORDER BY dow`
    );
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = dowResult.rows.map((r) => ({
      day: Number(r.dow),
      label: dayLabels[Number(r.dow)],
      avgSteps: Number(r.avg_steps),
      count: Number(r.cnt),
    }));

    return NextResponse.json({
      range,
      records: {
        bestDaySteps: bestDay,
        bestWeekSteps: bestWeek,
        currentStreakDays: streaks.current,
        longestStreakDays: streaks.longest,
        streakGoal: STREAK_GOAL,
      },
      heatmap,
      dayOfWeek,
    });
  } catch (error) {
    console.error("GET /api/fitness/insights failed:", error);
    return NextResponse.json({ error: "Failed to compute fitness insights" }, { status: 500 });
  }
}
