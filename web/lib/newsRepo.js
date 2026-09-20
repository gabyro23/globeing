// Server-side reads of the "news_articles" table for /noticias — kept
// separate from lib/newsData.js (which talks to NewsData.io) so the page
// components only ever depend on Supabase, the same way
// lib/countryPageData.js is the read side for /country/[slug].
import { supabase } from "./supabaseClient";
import { NEWS_COUNTRIES } from "./newsCountries";

// One query, grouped in JS — 10 countries x 10 articles is a small
// enough result set that a single request plus a `.reduce` is simpler
// (and cheaper) than 10 round trips.
export async function getNewsGroupedByCountry() {
  const iso3List = NEWS_COUNTRIES.map((c) => c.iso3);

  const { data, error } = await supabase
    .from("news_articles")
    .select("*")
    .in("country_iso3", iso3List)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  const byIso3 = new Map(iso3List.map((iso3) => [iso3, []]));
  for (const row of data || []) {
    byIso3.get(row.country_iso3)?.push(row);
  }
  return byIso3;
}

export async function getNewsForCountry(iso3, limit = 10) {
  const { data, error } = await supabase
    .from("news_articles")
    .select("*")
    .eq("country_iso3", iso3)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}
