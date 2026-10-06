// Shapes country_wars rows (one per country per conflict — see
// docs/data/wars_README.md) into what /war-timeline shows: one entry per
// war, listed under the continent where it was fought, plus the other
// continents whose countries took part.
import { metaForAlpha3 } from "./countryMeta";

// The four continents the page groups by. Oceania has no war of its own
// in the dataset (Australia only appears as a participant in Iraq 2003),
// so it only ever shows up as a "+Oceania" tag.
export const WAR_CONTINENTS = ["Africa", "Americas", "Asia", "Europe"];

// countryTopoIds has no region for Taiwan ("Other" everywhere else on the
// site); for "where was it fought" it's plainly Asia.
const REGION_OVERRIDES = { TWN: "Asia" };

// country_wars doesn't carry UCDP's location column, so for the few wars
// whose participants span continents the battlefield is inferred:
//  - Extrastate (colonial) wars are tagged with the colonial power's iso3
//    (France, UK, Portugal) but were fought in the colony — matched here
//    by the non-state side's name.
//  - Otherwise, powers that fought far from home are set aside and the
//    continent most of the remaining countries are on wins (ties go to
//    the first country alphabetically, which is right for the Suez and
//    Egypt–Israel wars: fought on Egyptian territory).
const EXTRASTATE_FOUGHT_IN = {
  "Viet minh": "Asia", // First Indochina War
  MDRM: "Africa", // Malagasy Uprising
  FLN: "Africa", // Algerian War
  CPM: "Asia", // Malayan Emergency
  "Mau Mau": "Africa", // Kenya
  FNLA: "Africa", // Angolan War of Independence
  Frelimo: "Africa", // Mozambican War of Independence
};
const EXPEDITIONARY = new Set(["USA", "GBR", "FRA", "AUS"]);

function regionFor(iso3) {
  return REGION_OVERRIDES[iso3] || metaForAlpha3(iso3).region || "Other";
}

// "Government of France, Government of Israel" -> ["France", "Israel"];
// rebel groups and other non-state actors keep their own name.
function sideActors(side) {
  return (side || "")
    .split(",")
    .map((s) => s.trim().replace(/^Government of /, ""))
    .filter(Boolean);
}

function stripGov(side) {
  return sideActors(side).join(", ");
}

function foughtIn(war) {
  if (war.type_of_conflict === "extrastate") {
    const colony = EXTRASTATE_FOUGHT_IN[(war.side_b || "").trim()];
    if (colony) return colony;
  }
  const local = war.iso3s.filter((iso3) => !EXPEDITIONARY.has(iso3));
  const pool = (local.length ? local : war.iso3s).slice().sort();
  const tally = new Map();
  for (const iso3 of pool) tally.set(regionFor(iso3), (tally.get(regionFor(iso3)) || 0) + 1);
  let best = regionFor(pool[0]);
  for (const [region, n] of tally) if (n > tally.get(best)) best = region;
  return best;
}

// rows: raw country_wars rows. Returns [{ id, name, start, end, type,
// continent, also: [other continents], actors: [every country or group
// on either side] }], end === null while ongoing.
export function buildWarTimeline(rows) {
  const byConflict = new Map();
  for (const r of rows) {
    const key = r.ucdp_conflict_id || `row-${r.id}`;
    const existing = byConflict.get(key);
    if (existing) {
      if (!existing.iso3s.includes(r.iso3)) existing.iso3s.push(r.iso3);
      continue;
    }
    byConflict.set(key, { ...r, id: String(key), iso3s: [r.iso3] });
  }

  return [...byConflict.values()].map((w) => {
    const a = stripGov(w.side_a);
    const b = stripGov(w.side_b);
    const continent = foughtIn(w);
    const also = [...new Set(w.iso3s.map(regionFor))].filter((r) => r !== continent && r !== "Other").sort();
    return {
      id: w.id,
      name: b ? `${a} vs ${b}` : a,
      start: w.start_year,
      end: w.end_year || null,
      type: w.type_of_conflict,
      continent,
      also,
      actors: [...new Set([...sideActors(w.side_a), ...sideActors(w.side_b)])],
    };
  });
}
