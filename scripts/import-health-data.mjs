/**
 * One-time local script: Import Apple Health export.xml into Turso fitness_logs.
 *
 * Usage:  node scripts/import-health-data.mjs
 *
 * Reads .env.local for TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
 * Streams the XML with SAX to keep memory low on the 100 MB+ file.
 * Batches upserts 100 dates at a time via turso.batch().
 */

import { createReadStream } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import sax from "sax";
import dotenv from "dotenv";

// ── Setup ────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Load .env.local
dotenv.config({ path: resolve(projectRoot, ".env.local") });

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

const turso = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// ── Target record types ──────────────────────────────────────────────
const TARGET_TYPES = new Set([
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKQuantityTypeIdentifierFlightsClimbed",
]);

// Map HK type → which field in our aggregation object
const TYPE_TO_FIELD = {
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierActiveEnergyBurned: "calories",
  HKQuantityTypeIdentifierDistanceWalkingRunning: "distanceKm",
  HKQuantityTypeIdentifierFlightsClimbed: "flightsClimbed",
};

// ── Parse & aggregate ────────────────────────────────────────────────
const xmlPath = resolve(projectRoot, "export.xml");
console.log(`📂 Reading ${xmlPath} ...`);

// day → { steps, calories, distanceKm, flightsClimbed }
const dayMap = new Map();

// Track all HKQuantityTypeIdentifier* types we encounter but don't import
const skippedTypes = new Set();
let totalRecordsProcessed = 0;

await new Promise((resolveP, rejectP) => {
  const parser = sax.createStream(true, { trim: true });

  parser.on("opentag", (node) => {
    if (node.name !== "Record") return;

    const type = node.attributes.type;

    // Track skipped quantity types for the summary
    if (
      type &&
      type.startsWith("HKQuantityTypeIdentifier") &&
      !TARGET_TYPES.has(type)
    ) {
      skippedTypes.add(type);
      return;
    }

    if (!TARGET_TYPES.has(type)) return;

    const startDate = node.attributes.startDate;
    const value = parseFloat(node.attributes.value);
    if (!startDate || isNaN(value)) return;

    // Extract YYYY-MM-DD from "2023-05-22 18:20:44 +0530"
    const date = startDate.substring(0, 10);
    const field = TYPE_TO_FIELD[type];

    if (!dayMap.has(date)) {
      dayMap.set(date, { steps: 0, calories: 0, distanceKm: 0, flightsClimbed: 0 });
    }

    dayMap.get(date)[field] += value;
    totalRecordsProcessed++;

    // Progress log every 50 000 records
    if (totalRecordsProcessed % 50000 === 0) {
      console.log(`  … parsed ${totalRecordsProcessed.toLocaleString()} matching records so far (${dayMap.size} unique days) …`);
    }
  });

  parser.on("end", () => resolveP());
  parser.on("error", (err) => rejectP(err));

  createReadStream(xmlPath, { encoding: "utf-8" }).pipe(parser);
});

console.log(`\n✅ Parsing complete: ${totalRecordsProcessed.toLocaleString()} records across ${dayMap.size} unique days.\n`);

// ── Sort dates & prepare batches ─────────────────────────────────────
const sortedDates = [...dayMap.keys()].sort();
const BATCH_SIZE = 100;
const totalDays = sortedDates.length;
let upsertedCount = 0;

console.log(`🔄 Upserting ${totalDays} days into fitness_logs (batch size ${BATCH_SIZE})...\n`);

// Ensure table exists (same schema as turso.ts)
await turso.execute(`
  CREATE TABLE IF NOT EXISTS fitness_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    steps INTEGER NOT NULL DEFAULT 0,
    calories INTEGER NOT NULL DEFAULT 0,
    distance_km REAL NOT NULL DEFAULT 0,
    flights_climbed INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

for (let i = 0; i < totalDays; i += BATCH_SIZE) {
  const batch = sortedDates.slice(i, i + BATCH_SIZE);
  const now = Date.now();

  const statements = batch.map((date) => {
    const d = dayMap.get(date);
    return {
      sql: `INSERT INTO fitness_logs (id, date, steps, calories, distance_km, flights_climbed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              steps = excluded.steps,
              calories = excluded.calories,
              distance_km = excluded.distance_km,
              flights_climbed = excluded.flights_climbed,
              updated_at = excluded.updated_at`,
      args: [
        `fitness-${date}`,
        date,
        Math.round(d.steps),
        Math.round(d.calories),
        parseFloat(d.distanceKm.toFixed(2)),
        Math.round(d.flightsClimbed) || null,
        now,
        now,
      ],
    };
  });

  await turso.batch(statements);
  upsertedCount += batch.length;

  console.log(`  Upserted ${upsertedCount}/${totalDays} days…`);
}

// ── Summary ──────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`  📊  IMPORT COMPLETE`);
console.log(`${"═".repeat(60)}`);
console.log(`  Total days imported : ${totalDays}`);
console.log(`  Earliest date       : ${sortedDates[0]}`);
console.log(`  Latest date         : ${sortedDates[sortedDates.length - 1]}`);
console.log(`  Total records parsed: ${totalRecordsProcessed.toLocaleString()}`);

if (skippedTypes.size > 0) {
  console.log(`\n  ⚠ Skipped HKQuantityTypeIdentifier types (not imported):`);
  for (const t of [...skippedTypes].sort()) {
    console.log(`    • ${t}`);
  }
}

console.log(`\n${"═".repeat(60)}\n`);

process.exit(0);
