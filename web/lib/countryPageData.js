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
    profile: profileForIso3(iso3),
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

export { isCountryIndexed, slugForIso3, iso3ForSlug, flagForCountryName };
