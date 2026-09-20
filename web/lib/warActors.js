// Turns a country_wars side_a/side_b string (e.g. "Government of India",
// or a comma-separated coalition like "Government of Australia,
// Government of United Kingdom, Government of United States of
// America") into a list of {name, flag} actors for the war timeline.
//
// Only "Government of X" actors get a flag — everything else (rebel
// groups, unrecognized states, ethnic militias) is a non-state actor and
// gets no flag, which is itself informative: it's what makes an
// intrastate war read differently from an interstate one at a glance.
import { flagForCountryName } from "./randomFactFlags";

// UCDP's own historical/alternate country names that don't match this
// project's flagForCountryName lookup verbatim (see
// lib/randomFactFlags.js's COUNTRY_NAME_TO_ALPHA2, which is keyed by the
// site's own everyday country names). Countries that no longer exist at
// all (Hyderabad, South Vietnam, ...) are intentionally left out here —
// same judgment call already made for iso3 tagging in fetch-wars.mjs,
// see docs/data/wars_unmapped_gw_codes.csv.
const ACTOR_COUNTRY_ALIASES = {
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Cambodia (Kampuchea)": "Cambodia",
  Congo: "Republic of the Congo",
  "DR Congo (Zaire)": "Democratic Republic of the Congo",
  "Myanmar (Burma)": "Myanmar",
  "Russia (Soviet Union)": "Russia",
  "United States of America": "United States",
  "Vietnam (North Vietnam)": "Vietnam",
  "Yemen (North Yemen)": "Yemen",
  "Zimbabwe (Rhodesia)": "Zimbabwe",
};

function flagForActor(actor) {
  const match = actor.match(/^Government of (.+)$/);
  if (!match) return null;
  const rawName = match[1];
  const flag = flagForCountryName(ACTOR_COUNTRY_ALIASES[rawName] || rawName);
  return flag || null;
}

// One side of a conflict can itself be a coalition — this always returns
// an array, even for a single actor.
export function warSideActors(sideText) {
  return (sideText || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, flag: flagForActor(name) }));
}
