// Hand-curated facts that aren't in the World Bank dataset (Supabase) or
// in countryTopoIds.json: official name, currency, and official/national
// language(s). Used by the /country/[slug] pages for the quick-facts
// block and the FAQ.
//
// This is intentionally NOT filled in for all ~195 countries yet — only
// for countries that already have an indexed /country/[slug] page (see
// lib/countryIndex.js's INDEXED_COUNTRY_ISO3). Add an entry here at the
// same time you add a country's iso3 to that list, so the new page has
// real, checked facts instead of guessed ones.
export const COUNTRY_PROFILES = {
  JPN: {
    officialName: "Japan (Nihon-koku / 日本国)",
    currency: { name: "Japanese yen", code: "JPY", symbol: "¥" },
    languages: ["Japanese"],
  },
};

export function profileForIso3(iso3) {
  return COUNTRY_PROFILES[iso3] || null;
}
