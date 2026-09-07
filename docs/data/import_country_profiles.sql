-- Merges docs/data/country_profiles.csv into the "countries" table.
-- Re-run this (from step 3 on) every time you regenerate the CSV with
-- fetch-country-profiles.mjs, not just the first time.
--
-- Why this two-step dance instead of just re-importing the CSV directly:
-- Supabase's Table Editor CSV importer only ever INSERTs rows — it has no
-- "match by column and update" option, and it fails with a duplicate-key
-- error if a row it's inserting collides with one that already exists.
-- Since every one of these ~217 countries already has a row in
-- "countries" (this data fills in existing rows, it doesn't add new
-- countries), importing the CSV straight into "countries" doesn't work.
-- The fix: import the CSV into a brand-new, empty table first (nothing
-- for it to collide with), then use plain SQL to copy each column across
-- into the matching "countries" row by iso3, then delete the staging
-- table.
--
-- How to run this:
--   1. Make sure the columns exist: run add_country_profile_columns.sql
--      and add_country_currencies_column.sql first (SQL Editor -> New
--      query -> paste -> Run) if you haven't already — safe to re-run.
--   2. In the Supabase dashboard, go to Table Editor -> click "+ New
--      table" (top left) -> "Import Data from CSV" -> upload
--      docs/data/country_profiles.csv. Name the table
--      "country_profiles_staging" and let Supabase infer the columns
--      from the CSV's header row (they'll all come in as iso3,
--      official_name, currency_name, currency_code, currency_symbol,
--      currencies, languages — text is fine for all of them). Finish the
--      import wizard.
--   3. Back in the SQL Editor, paste this whole file (from here down) and
--      click Run.
--   4. Spot-check a few rows in the Table Editor afterwards — see
--      docs/data/country_profiles_README.md for known caveats worth
--      double-checking (e.g. Zimbabwe's currency, contested official
--      names).

do $$
declare
  updated_count integer;
  staged_count integer;
begin
  select count(*) into staged_count from country_profiles_staging;

  update countries c
  set
    official_name   = s.official_name,
    currency_name   = s.currency_name,
    currency_code   = s.currency_code,
    currency_symbol = s.currency_symbol,
    currencies      = s.currencies,
    languages       = s.languages
  from country_profiles_staging s
  where c.iso3 = s.iso3;

  get diagnostics updated_count = row_count;

  raise notice 'Staged % rows, updated % matching rows in countries.', staged_count, updated_count;
  if updated_count < staged_count then
    raise notice 'Heads up: % staged row(s) had no matching iso3 in countries — check for a country code mismatch.', staged_count - updated_count;
  end if;
end $$;

drop table country_profiles_staging;
