// Hand-curated official name / currency / official language facts, used
// by the /country/[slug] pages for the quick-facts block and the FAQ.
//
// These same 3 facts now live in Supabase for every country (see
// docs/data/country_profiles_README.md and lib/countryPageData.js's
// buildProfile()) — that's the primary source, and it's what's used for
// nearly every indexed country. This file only matters as a per-field
// fallback for whatever the database doesn't have, and as a place to
// override a specific country's fact by hand if you ever want to correct
// or refine one without touching the database (Japan and Burundi's
// entries below predate the database columns and are kept as an example
// of that).
export const COUNTRY_PROFILES = {
  JPN: {
    officialName: "Japan (Nihon-koku / 日本国)",
    currency: { name: "Japanese yen", code: "JPY", symbol: "¥" },
    languages: ["Japanese"],
  },
  BDI: {
    officialName: "Republic of Burundi (Republika y'Uburundi)",
    currency: { name: "Burundian franc", code: "BIF", symbol: "FBu" },
    languages: ["Kirundi", "French", "English"],
  },
};

export function profileForIso3(iso3) {
  return COUNTRY_PROFILES[iso3] || null;
}
