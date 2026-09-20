import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";
import { NEWS_COUNTRIES, NEWS_RETENTION_DAYS } from "../../../../lib/newsCountries";
import { fetchLatestNewsForCountry } from "../../../../lib/newsData";

// POST /api/news/refresh — pulls the latest headlines for all 10
// /noticias countries from NewsData.io and upserts them into
// "news_articles". Called every 3 hours by Supabase's pg_cron (see
// docs/data/news_refresh_cron.sql), not by visitors — protected by
// CRON_SECRET so it can't be triggered (and burn through the NewsData.io
// free-tier quota) by anyone who finds the URL.
//
// 10 countries x 1 request each = 10 NewsData.io credits per run, 8
// runs/day = 80/day — well under the ~200/day free-tier limit (see the
// spec's budget section).
export async function POST(request) {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing NEWSDATA_API_KEY" }, { status: 500 });
  }

  const results = [];

  for (const country of NEWS_COUNTRIES) {
    try {
      const articles = await fetchLatestNewsForCountry(country, apiKey);

      if (articles.length > 0) {
        const { error } = await supabase
          .from("news_articles")
          .upsert(articles, { onConflict: "country_iso3,link", ignoreDuplicates: false });
        if (error) throw new Error(error.message);
      }

      results.push({ country: country.iso3, fetched: articles.length });
    } catch (err) {
      // One country failing (rate limit, a domain with no fresh results,
      // a transient NewsData.io error) shouldn't stop the other 9 from
      // refreshing.
      results.push({ country: country.iso3, error: err.message });
    }
  }

  const cutoff = new Date(Date.now() - NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: pruneError } = await supabase.from("news_articles").delete().lt("fetched_at", cutoff);

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results,
    pruneError: pruneError?.message || null,
  });
}
