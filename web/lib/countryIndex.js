// Which countries have a published /country/[slug] page, and how to turn
// a country name into (and back from) its URL slug.
//
// Official name/currency/language now live in Supabase for every country
// (see docs/data/country_profiles_README.md), so a country no longer
// needs a hand-written entry in lib/countryProfiles.js before it can be
// indexed here — that file is now only a fallback for any field the
// database happens to be missing. This list is still the single place
// that controls both generateStaticParams (which pages actually get
// built) and every "explore this country" link elsewhere on the site
// (comparison suggestions, neighboring countries, the /country hub).
//
// 209 of the 217 rows in the "countries" table are listed below. The
// other 8 are deliberately left out because they have no entry in
// countryTopoIds.json — meaning no flag, no continent grouping, and (per
// lib/worldAtlas.js) no shape to draw a silhouette or outline from, which
// would leave their page with a blank flag, an "Other" continent bucket,
// and a pictogram section stuck on a permanent loading skeleton (see
// components/CountryHeroPictogram.jsx — it can't yet tell "still
// fetching the map" apart from "no shape exists for this country").
// They're almost all non-sovereign territories rather than a data gap:
// Curaçao (CUW), Sint Maarten (SXM), the French side of St. Martin
// (MAF), the British and US Virgin Islands (VGB, VIR), the Channel
// Islands (CHI), and the Isle of Man (IMN) — plus Kosovo (XKX), whose
// disputed status means it's missing from a lot of standard
// country-code datasets, this one included. Add any of them here once
// countryTopoIds.json has a real entry for it.
import topoIds from "./countryTopoIds.json";

export const INDEXED_COUNTRY_ISO3 = [
  "ABW", "AFG", "AGO", "ALB", "AND", "ARE", "ARG", "ARM", "ASM", "ATG", "AUS", "AUT", "AZE", "BDI", "BEL",
  "BEN", "BFA", "BGD", "BGR", "BHR", "BHS", "BIH", "BLR", "BLZ", "BMU", "BOL", "BRA", "BRB", "BRN", "BTN",
  "BWA", "CAF", "CAN", "CHE", "CHL", "CHN", "CIV", "CMR", "COD", "COG", "COL", "COM", "CPV", "CRI", "CUB",
  "CYM", "CYP", "CZE", "DEU", "DJI", "DMA", "DNK", "DOM", "DZA", "ECU", "EGY", "ERI", "ESP", "EST", "ETH",
  "FIN", "FJI", "FRA", "FRO", "FSM", "GAB", "GBR", "GEO", "GHA", "GIB", "GIN", "GMB", "GNB", "GNQ", "GRC",
  "GRD", "GRL", "GTM", "GUM", "GUY", "HKG", "HND", "HRV", "HTI", "HUN", "IDN", "IND", "IRL", "IRN", "IRQ",
  "ISL", "ISR", "ITA", "JAM", "JOR", "JPN", "KAZ", "KEN", "KGZ", "KHM", "KIR", "KNA", "KOR", "KWT", "LAO",
  "LBN", "LBR", "LBY", "LCA", "LIE", "LKA", "LSO", "LTU", "LUX", "LVA", "MAC", "MAR", "MCO", "MDA", "MDG",
  "MDV", "MEX", "MHL", "MKD", "MLI", "MLT", "MMR", "MNE", "MNG", "MNP", "MOZ", "MRT", "MUS", "MWI", "MYS",
  "NAM", "NCL", "NER", "NGA", "NIC", "NLD", "NOR", "NPL", "NRU", "NZL", "OMN", "PAK", "PAN", "PER", "PHL",
  "PLW", "PNG", "POL", "PRI", "PRK", "PRT", "PRY", "PSE", "PYF", "QAT", "ROU", "RUS", "RWA", "SAU", "SDN",
  "SEN", "SGP", "SLB", "SLE", "SLV", "SMR", "SOM", "SRB", "SSD", "STP", "SUR", "SVK", "SVN", "SWE", "SWZ",
  "SYC", "SYR", "TCA", "TCD", "TGO", "THA", "TJK", "TKM", "TLS", "TON", "TTO", "TUN", "TUR", "TUV", "TZA",
  "UGA", "UKR", "URY", "USA", "UZB", "VCT", "VEN", "VNM", "VUT", "WSM", "YEM", "ZAF", "ZMB", "ZWE",
];

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
