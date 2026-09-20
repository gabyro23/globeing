// Countries covered by /noticias (Breaking News by country) — see
// "Spec - Breaking News por Pais.md" in the project for the full design.
//
// Scoped down to Panama + Uruguay for now (Sept 2026). The original plan
// covered 10 countries with a hand-picked whitelist of official/trusted
// domains, but NewsData.io's `domain` filter turned out to need their own
// internal source `id` (from GET /api/1/sources), not the plain hostname
// — and their free-tier source directory doesn't include several of the
// outlets we wanted (EFE, Reuters, AP, BBC, Clarín, El País, Der Spiegel,
// Agência Brasil...), likely gated to paid plans. Panama and Uruguay both
// had solid matches for our original picks, so we're starting there and
// agreeing the design end-to-end before spending more time hunting for
// working source ids in the other 8 countries (or reconsidering the
// filter approach for them — see the spec's open items).
//
// `domains` are NewsData.io source ids (not hostnames) confirmed via
// check-news-sources.mjs against the real API.
//
// iso3 matches lib/countryIndex.js (INDEXED_COUNTRY_ISO3) so /noticias
// pages can share the same slug as /country/[slug] via slugForIso3.
export const NEWS_COUNTRIES = [
  {
    iso3: "PAN",
    name: "Panama",
    newsdataCountry: "pa",
    lang: "es",
    // La Prensa, TVN Noticias, Telemetro, La Estrella de Panamá.
    domains: ["prensa", "tvn2", "telemetro", "laestrella"],
  },
  {
    iso3: "URY",
    name: "Uruguay",
    newsdataCountry: "uy",
    lang: "es",
    // El País (Uruguay), El Observador. Agencia Uruguaya de Noticias
    // (aun.uy) isn't in NewsData.io's free-tier directory — dropped for
    // now, revisit if/when we're on a paid plan.
    domains: ["elpais_uy", "elobservador"],
  },
];

// First letter shown in the little avatar circle next to a source name
// (NewsCard's featured/grid layouts) — skips a leading article ("El",
// "La", "Los"...) so "El País" reads as "P", not "E".
export function sourceInitial(sourceName) {
  if (!sourceName) return "?";
  const stripped = sourceName.replace(/^(el|la|los|las|the)\s+/i, "").trim();
  return (stripped.charAt(0) || sourceName.charAt(0)).toUpperCase();
}

const byIso3 = new Map(NEWS_COUNTRIES.map((c) => [c.iso3, c]));

export function newsCountryForIso3(iso3) {
  return byIso3.get(iso3) || null;
}

// How many days of articles to keep around — matches the refresh job's
// pruning window (see app/api/news/refresh/route.js).
export const NEWS_RETENTION_DAYS = 5;
