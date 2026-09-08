import { RANDOM_FACTS } from "./randomFacts";

const TOTAL_FACTS = RANDOM_FACTS.length; // 365

// 1-based day of the year for a given date (Jan 1 = 1). Clamped so a leap
// year's Feb 29 (and any Dec 31 that pushes past 365) reuses the last
// fact instead of going out of bounds.
export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diffMs = date - start;
  const day = Math.floor(diffMs / 86400000) + 1;
  return Math.min(Math.max(day, 1), TOTAL_FACTS);
}

// The single fact to show as "today's fact" (e.g. on the homepage).
export function getTodayFact(date = new Date()) {
  const day = getDayOfYear(date);
  return RANDOM_FACTS[day - 1];
}

// Every fact from day 1 up to and including today, newest first — this is
// what accumulates over the year on the Random Facts page.
export function getAccumulatedFacts(date = new Date()) {
  const day = getDayOfYear(date);
  return RANDOM_FACTS.slice(0, day).reverse();
}

// Human-readable label for a fact's day-of-year number, e.g. "September 8".
// Uses the current year purely for month/day arithmetic (day-of-year has no
// year of its own), so it's safe to call regardless of when a fact was
// actually published.
export function factDateLabel(day) {
  const date = new Date(new Date().getFullYear(), 0, day);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
