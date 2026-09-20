-- Creates a new "country_wars" table in Supabase: which countries have
-- been at war, against/with whom, and in what years.
--
-- This is one-to-many (a country can have many wars, a war can touch
-- more than one country), so unlike the other datasets in this folder,
-- it does NOT fit as columns on the existing "countries" table — it
-- needs its own table.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--   3. Then import docs/data/wars.csv directly into this table — see
--      docs/data/wars_README.md for the exact steps. Unlike the other
--      datasets here, this one does NOT need a staging-table workaround:
--      country_wars is a brand-new, empty table, so Supabase's CSV
--      importer can insert straight into it with no duplicate-key
--      conflict.
create table if not exists country_wars (
  id bigint generated always as identity primary key,
  iso3 text not null,
  conflict_name text not null,
  side_a text,
  side_b text,
  type_of_conflict text,
  start_year integer not null,
  end_year integer,
  ucdp_conflict_id text,
  created_at timestamptz default now()
);

create index if not exists country_wars_iso3_idx on country_wars (iso3);

comment on table country_wars is 'Countries at war, one row per (country, conflict). Source: the UCDP/PRIO Armed Conflict Dataset (Uppsala Conflict Data Program, Uppsala University, co-produced with PRIO Oslo) — ucdp.uu.se, CC BY 4.0, cite Gleditsch et al. 2002 and Davies/Pettersson/Öberg''s latest "Organized violence" article (see docs/data/wars_README.md for the exact citations required by the license). Only conflicts that reached intensity_level 2 ("war": at least 1,000 battle-related deaths in a calendar year) are included — a country having no rows here does not mean it has never had any armed conflict, only that none crossed this threshold. end_year is NULL when the conflict is still ongoing as of the most recent year covered by the dataset. An interstate war appears once per side (fetch-wars.mjs tags both the country a war was located in and, for interstate wars, the opposing state), so the same ucdp_conflict_id can appear on more than one country''s rows by design.';
