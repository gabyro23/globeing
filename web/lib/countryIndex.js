// Which countries have a published /country/[slug] page, and how to turn
// a country name into (and back from) its URL slug.
//
// Start small on purpose: /country pages are being rolled out one country
// at a time (see the project's SEO plan), so this list is the single
// place that controls both generateStaticParams (which pages actually
// get built) and every "explore this country" link elsewhere on the site
// (comparison suggestions, neighboring countries, the /country hub).
// Add an iso3 here — and a matching entry in lib/countryProfiles.js —
// once a country's page is ready to publish.
import topoIds from "./countryTopoIds.json";

export const INDEXED_COUNTRY_ISO3 = ["JPN", "BDI"];

// A few countries need a friendlier URL than a straight slugify() of
// their ISO/World Bank name would give (e.g. "Russian Federation" ->
// "russia", "Korea, Rep." -> "south-korea"). Add overrides here as they
// come up; everything else falls back to slugifying countryTopoIds' name.
const SLUG_OVERRIDES = {};

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const topoByAlpha3 = new Map(topoIds.map((c) => [c.alpha3, c]));

export function slugForIso3(iso3) {
  if (SLUG_OVERRIDES[iso3]) return SLUG_OVERRIDES[iso3];
  const meta = topoByAlpha3.get(iso3);
  return meta ? slugify(meta.name) : null;
}

const iso3BySlug = new Map(
  INDEXED_COUNTRY_ISO3.map((iso3) => [slugForIso3(iso3), iso3]).filter(([slug]) => slug)
);

export function iso3ForSlug(slug) {
  return iso3BySlug.get(slug) || null;
}

export function isCountryIndexed(iso3) {
  return INDEXED_COUNTRY_ISO3.includes(iso3);
}
