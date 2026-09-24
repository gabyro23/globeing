// Fetches headlines from NewsData.io's "latest" endpoint for one
// country, restricted to that country's domain whitelist (see
// lib/newsCountries.js), and normalizes the response into the shape
// stored in the "news_articles" table.
//
// Only called server-side (app/api/news/refresh/route.js) — the API key
// never reaches the browser.
import { NEWS_CATEGORIES } from "./newsCountries";

const NEWSDATA_LATEST_URL = "https://newsdata.io/api/1/latest";

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// NewsData.io's `domain` filter needs their own internal source `id`
// (e.g. "tvn2", "elpais_uy") — NOT the outlet's actual hostname. Passing
// a plain hostname like "elpais.com" fails with "The domain you provided
// does not exist in our database", even for real, well-known outlets.
// Look up the correct id with GET /api/1/sources?country=<cc> (see
// check-news-sources.mjs at the repo root) before adding a new domain to
// lib/newsCountries.js — and note that several major outlets/wires
// (EFE, Reuters, AP, BBC, Der Spiegel...) simply aren't in the free-tier
// source directory at all.
export async function fetchLatestNewsForCountry(country, apiKey) {
  const params = new URLSearchParams({
    apikey: apiKey,
    country: country.newsdataCountry,
    domain: country.domains.join(","),
    language: country.lang,
    category: NEWS_CATEGORIES.join(","),
    size: "10",
  });

  const res = await fetch(`${NEWSDATA_LATEST_URL}?${params.toString()}`);
  const body = await res.json().catch(() => null);

  if (!res.ok || !body || body.status !== "success") {
    const message = body?.results?.message || body?.message || `HTTP ${res.status}`;
    throw new Error(`NewsData.io error for ${country.iso3}: ${message}`);
  }

  const results = Array.isArray(body.results) ? body.results : [];

  return results
    .filter((r) => r.link && r.title)
    .map((r) => ({
      country_iso3: country.iso3,
      title: r.title.trim(),
      link: r.link,
      source_name: r.source_name || r.source_id || hostnameFromUrl(r.link),
      source_domain: hostnameFromUrl(r.source_url || r.link) || r.source_id || "",
      source_lang: r.language || country.lang,
      description: r.description ? String(r.description).slice(0, 300) : null,
      image_url: r.image_url || null,
      published_at: r.pubDate ? new Date(r.pubDate).toISOString() : null,
      is_official: true,
    }));
}
