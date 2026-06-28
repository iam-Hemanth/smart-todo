import type { TodoCategory, TodoPriority } from "@/store/todo-store";

export interface ParsedTodo {
  text: string;
  category?: TodoCategory;
  priority?: TodoPriority;
  dueDate?: string;
  tags?: string[];
  estimateMinutes?: number;
}

const HIGH_KEYWORDS = ["high", "urgent", "asap", "important", "critical"];
const MEDIUM_KEYWORDS = ["medium", "normal", "moderate"];
const LOW_KEYWORDS = ["low", "later", "someday", "minor"];

const OUTDOOR_KEYWORDS = [
  "outdoor",
  "outside",
  "park",
  "run",
  "walk",
  "jog",
  "cycle",
  "cycling",
  "hike",
  "hiking",
  "gym",
  "sport",
  "garden",
  "gardening",
  "market",
  "shopping",
  "errand",
  "trip",
];
const INDOOR_KEYWORDS = [
  "indoor",
  "inside",
  "office",
  "home",
  "house",
  "laptop",
  "computer",
  "email",
  "meeting",
  "code",
  "design",
  "review",
  "read",
  "study",
  "write",
  "writing",
  "clean",
  "laundry",
  "cook",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function isoOffset(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function nextWeekday(target: number): string {
  const today = new Date().getDay();
  const diff = (target - today + 7) % 7 || 7;
  return isoOffset(diff);
}

/**
 * Parses a free-text task line like:
 *   "Walk in lalbagh tomorrow outdoor high #fitness 30min"
 * into structured fields. Strips recognized tokens from the final title.
 */
export function parseNaturalLanguage(input: string): ParsedTodo {
  const original = input.trim();
  let text = original;
  const result: ParsedTodo = { text };

  // Tags: #word
  const tagMatches = Array.from(text.matchAll(/(?:^|\s)#([a-zA-Z0-9_-]{2,})/g));
  if (tagMatches.length) {
    result.tags = tagMatches.map((m) => m[1].toLowerCase());
    for (const m of tagMatches) {
      text = text.replace(m[0], " ");
    }
  }

  // Estimate: 15min / 30 min / 1.5hr / 2h
  const estMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(min|minutes?|hrs?|hours?)\b/i);
  if (estMatch) {
    const value = parseFloat(estMatch[1]);
    const unit = estMatch[2].toLowerCase();
    const minutes =
      unit.startsWith("h") ? Math.round(value * 60) : Math.round(value);
    if (minutes > 0 && minutes <= 600) {
      result.estimateMinutes = minutes;
      text = text.replace(estMatch[0], " ");
    }
  }

  // Priority
  const lower = text.toLowerCase();
  for (const kw of HIGH_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
      result.priority = "high";
      text = text.replace(new RegExp(`\\b${kw}\\b`, "i"), " ");
      break;
    }
  }
  if (!result.priority) {
    for (const kw of LOW_KEYWORDS) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
        result.priority = "low";
        text = text.replace(new RegExp(`\\b${kw}\\b`, "i"), " ");
        break;
      }
    }
  }
  if (!result.priority) {
    for (const kw of MEDIUM_KEYWORDS) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
        result.priority = "medium";
        text = text.replace(new RegExp(`\\b${kw}\\b`, "i"), " ");
        break;
      }
    }
  }

  // Category
  for (const kw of OUTDOOR_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
      result.category = "outdoor";
      break;
    }
  }
  if (!result.category) {
    for (const kw of INDOOR_KEYWORDS) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
        result.category = "indoor";
        break;
      }
    }
  }
  // Explicit "outdoor" / "indoor" tokens get stripped from title
  text = text.replace(/\b(outdoor|outside|indoor|inside)\b/gi, " ");

  // Due date keywords — also strip leading prepositions (on, by, for, at, due)
  // to avoid awkward trailing prepositions like "Call mom on" after date extraction.
  const PREP = /(?:\b(?:on|by|for|at|due(?:\s+on)?|till|until)\s+)?/i;

  if (/\btoday\b/i.test(text)) {
    result.dueDate = isoOffset(0);
    text = text.replace(new RegExp(PREP.source + /\btoday\b/i.source, "gi"), " ");
  } else if (/\btomorrow\b/i.test(text) || /\btmrw\b/i.test(text)) {
    result.dueDate = isoOffset(1);
    text = text.replace(new RegExp(PREP.source + /\b(?:tomorrow|tmrw)\b/i.source, "gi"), " ");
  } else if (/\bnext week\b/i.test(text)) {
    result.dueDate = isoOffset(7);
    text = text.replace(new RegExp(PREP.source + /\bnext week\b/i.source, "gi"), " ");
  } else {
    // Weekday names
    for (const [name, idx] of Object.entries(WEEKDAY_MAP)) {
      const re = new RegExp(PREP.source + `\\b${name}\\b`, "i");
      if (re.test(text)) {
        result.dueDate = nextWeekday(idx);
        text = text.replace(new RegExp(re.source, "gi"), " ");
        break;
      }
    }
  }

  // Collapse whitespace
  result.text = text.replace(/\s{2,}/g, " ").trim();

  // Fallback: if everything got stripped, restore original
  if (!result.text) result.text = original;

  return result;
}
