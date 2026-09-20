-- Creates the "news_articles" table used by /noticias (Breaking News by
-- country). One row per article, fetched periodically from NewsData.io
-- and restricted to a curated whitelist of official/trusted domains per
-- country (see web/lib/newsSources.js) — see the project spec
-- "Spec - Breaking News por Pais.md" for the full design.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--
-- After this, set up the refresh schedule — see
-- docs/data/news_refresh_cron.sql — to call POST /api/news/refresh
-- every 3 hours.
create table if not exists news_articles (
  id bigint generated always as identity primary key,
  country_iso3 text not null,
  title text not null,
  link text not null,
  source_name text,
  source_domain text not null,
  source_lang text,
  description text,
  image_url text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  is_official boolean not null default true,
  created_at timestamptz not null default now()
);

-- One row per article per country: the same story can legitimately be
-- reported by two different whitelisted outlets, but NewsData.io
-- returning the same article link twice for the same country (e.g. on
-- overlapping refresh windows) should upsert, not duplicate.
create unique index if not exists news_articles_country_link_idx
  on news_articles (country_iso3, link);

create index if not exists news_articles_country_published_idx
  on news_articles (country_iso3, published_at desc);

comment on table news_articles is 'Breaking news headlines by country for /noticias, fetched from NewsData.io and restricted to a per-country whitelist of official/trusted domains. Headline + short description + outbound link only — never full article body (see spec). fetched_at rows older than a few days are pruned by the refresh job.';
