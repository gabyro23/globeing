// Server-side data assembly for /country/[slug]. Everything a country
// page needs — the row from Supabase, world ranking position for the
// headline indicators, neighboring/comparable countries, the facts that
// have accumulated about it in lib/randomFacts.js, and whether it's in
// the Guess the Country roster — built once per country so the page
// itself stays a plain server component.
import { supabase } from "./supabaseClient";
import { INDICATORS } from "./indicators";
import { metaForAlpha3 } from "./countryMeta";
import { profileForIso3 } from "./countryProfiles";
import { INDEXED_COUNTRY_ISO3, isCountryIndexed, slugForIso3, iso3ForSlug } from "./countryIndex";
import { getAccumulatedFacts } from "./dailyFact";
import { flagForCountryName } from "./randomFactFlags";
import { GUESS_COUNTRIES } from "./guessCountryData";
import { getCountryOutline } from "./countryOutline";
import topoIds from "./countryTopoIds.json";

const topoByAlpha3 = new Map(topoIds.map((c) => [c.alpha3, c]));

// The 4 indicators the "where does it rank" section highlights — the
// ones the SEO plan calls out by name (population, area, GDP, GDP per
// capita), each a distinct long-tail query on its own.
const RANK_INDICATOR_KEYS = ["population", "area_km2", "gdp_usd", "gdp_per_capita_usd"];

const GUESS_COUNTRY_NAMES = new Set(GUESS_COUNTRIES.map((c) => c.name.toUpperCase()));

let allCountriesPromise = null;

// All ~195 countries, enriched with flag/region, same shape the client
// pages get from /api/countries — fetched directly from Supabase here
// (no HTTP round-trip) since this runs at build/request time on the
// server. Cached for the life of the server process / build.
function getAllCountries() {
  if (!allCountriesPromise) {
    allCountriesPromise = supabase
      .from("countries")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        return data.map((c) => ({ ...c, ...metaForAlpha3(c.iso3) }));
      });
  }
  return allCountriesPromise;
}

function rankFor(countries, key, iso3) {
  const indicator = INDICATORS.find((i) => i.key === key);
  const dir = indicator?.betterWhen === "low" ? 1 : -1;
  const ranked = countries
    .map((c) => ({ iso3: c.iso3, value: Number(c[key]) }))
    .filter((c) => Number.isFinite(c.value) && c.value !== 0)
    .sort((a, b) => (a.value - b.value) * dir);
  const position = ranked.findIndex((c) => c.iso3 === iso3);
  if (position === -1) return null;
  return { key, label: indicator.label, unit: indicator.unit, position: position + 1, total: ranked.length };
}

// Nearest other country by a given indicator (e.g. the neighbor with the
// closest population), preferring `pool` (usually same subregion) and
// falling back to the whole list if that pool is too thin.
function nearestBy(countries, pool, key, iso3, exclude) {
  const self = countries.find((c) => c.iso3 === iso3);
  const selfValue = Number(self?.[key]);
  if (!Number.isFinite(selfValue) || selfValue <= 0) return null;

  const candidates = (pool.length >= 2 ? pool : countries).filter(
    (c) => c.iso3 !== iso3 && !exclude.has(c.iso3) && Number.isFinite(Number(c[key])) && Number(c[key]) > 0
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((best, c) => {
    const diff = Math.abs(Number(c[key]) - selfValue);
    const bestDiff = Math.abs(Number(best[key]) - selfValue);
    return diff < bestDiff ? c : best;
  });
}

// Builds this country's profile (official name, currency, languages) by
// preferring whatever's in its Supabase row (official_name, currency_name,
// currency_code, currency_symbol, languages — see
// docs/data/add_country_profile_columns.sql) and falling back, field by
// field, to the hand-typed entry in lib/countryProfiles.js. That fallback
// is what makes this safe to ship before the Supabase columns are
// populated for every country, and lets a country keep a hand-checked
// fact even if the bulk-imported data is missing just that one field.
function buildProfile(country, iso3) {
  const fallback = profileForIso3(iso3) || {};
  const officialName = country.official_name || fallback.officialName || null;
  const currency =
    country.currency_name && country.currency_code
      ? { name: country.currency_name, code: country.currency_code, symbol: country.currency_symbol || "" }
      : fallback.currency || null;
  const languages = country.languages
    ? country.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback.languages || [];

  if (!officialName && !currency && languages.length === 0) return null;
  return { officialName, currency, languages };
}

export async function getCountryPageData(iso3) {
  const countries = await getAllCountries();
  const country = countries.find((c) => c.iso3 === iso3);
  if (!country) return null;

  const topo = topoByAlpha3.get(iso3);
  const subregion = topo?.subregion || null;

  const rankings = RANK_INDICATOR_KEYS.map((key) => rankFor(countries, key, iso3)).filter(Boolean);

  const sameSubregion = subregion
    ? countries.filter((c) => c.iso3 !== iso3 && topoByAlpha3.get(c.iso3)?.subregion === subregion)
    : [];
  const neighbors = [...sameSubregion]
    .sort((a, b) => Number(b.population || 0) - Number(a.population || 0))
    .slice(0, 6);

  const usedInSuggestions = new Set();
  const suggestionCandidates = [
    nearestBy(countries, sameSubregion, "population", iso3, usedInSuggestions),
    nearestBy(countries, sameSubregion, "gdp_usd", iso3, usedInSuggestions),
    nearestBy(countries, countries, "population", iso3, usedInSuggestions),
  ];
  const comparisons = [];
  for (const candidate of suggestionCandidates) {
    if (candidate && !usedInSuggestions.has(candidate.iso3)) {
      usedInSuggestions.add(candidate.iso3);
      comparisons.push(candidate);
    }
    if (comparisons.length >= 3) break;
  }

  const facts = getAccumulatedFacts().filter(
    (f) => f.country.toLowerCase() === country.name.toLowerCase()
  );

  // Best-effort — a hiccup fetching the world atlas shouldn't break the
  // whole page (or the static build); the outline is purely decorative.
  let outline = null;
  try {
    outline = await getCountryOutline(iso3);
  } catch {
    outline = null;
  }

  return {
    country,
    profile: buildProfile(country, iso3),
    subregion,
    rankings,
    neighbors,
    comparisons,
    facts,
    outline,
    inGuessRoster: GUESS_COUNTRY_NAMES.has(country.name.toUpperCase()),
    slug: slugForIso3(iso3),
  };
}

// Every indexed country's row, for the /country hub page.
export async function getIndexedCountries() {
  const countries = await getAllCountries();
  return INDEXED_COUNTRY_ISO3.map((iso3) => countries.find((c) => c.iso3 === iso3))
    .filter(Boolean)
    .map((c) => ({ ...c, slug: slugForIso3(c.iso3) }));
}

// Continent display order for the /country hub's "all countries" directory
// below the indexed spotlight — alphabetical reads arbitrarily, so we pin
// a geography-book order instead. Anything without continent metadata in
// countryTopoIds.json (metaForAlpha3 falls back to "Other") is grouped
// last rather than dropped, so the hub's country count still matches
// Supabase's row count.
const CONTINENT_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania", "Other"];

// Every country in Supabase — indexed or not — grouped by continent, for
// the /country hub's full directory. A country with its own page links
// there; every other one links to the Compare tool pre-filled with just
// that country, so nothing on the hub is a dead end while pages are
// rolled out one at a time (see lib/countryIndex.js).
export async function getCountriesByContinent() {
  const countries = await getAllCountries();
  const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  const groups = new Map(CONTINENT_ORDER.map((name) => [name, []]));
  for (const c of sorted) {
    const continent = groups.has(c.region) ? c.region : "Other";
    groups.get(continent).push({
      iso3: c.iso3,
      name: c.name,
      flag: c.flag,
      population: c.population,
      area_km2: c.area_km2,
      indexed: isCountryIndexed(c.iso3),
      slug: isCountryIndexed(c.iso3) ? slugForIso3(c.iso3) : null,
    });
  }

  return CONTINENT_ORDER.map((name) => ({ name, countries: groups.get(name) })).filter(
    (g) => g.countries.length > 0
  );
}

export { isCountryIndexed, slugForIso3, iso3ForSlug, flagForCountryName };
