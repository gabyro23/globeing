-- Merges docs/data/minimum_wage_usd.csv into the "countries" table.
-- Re-run this (from step 2 on) every time you regenerate the CSV with
-- fetch-minimum-wage-usd.mjs, not just the first time.
--
-- Same reasoning and same fix as import_minimum_wage.sql /
-- import_country_profiles.sql: Supabase's Table Editor CSV importer only
-- ever INSERTs rows, and fails with a duplicate-key error against
-- "countries_pkey" if you try to import over rows that already exist
-- (which all ~217 of these do — this data fills in existing rows, it
-- doesn't add new countries). So we load the CSV into a throwaway
-- staging table first, then merge it into "countries" with plain SQL,
-- then delete the staging table.
--
-- How to run this:
--   1. Make sure the column exists: run add_minimum_wage_usd_column.sql
--      first (SQL Editor -> New query -> paste -> Run) if you haven't
--      already — safe to re-run.
--   2. In the Supabase dashboard, go to Table Editor -> click "+ New
--      table" (top left, NOT inside the existing "countries" table) ->
--      "Import Data from CSV" -> upload docs/data/minimum_wage_usd.csv.
--      Name the table "minimum_wage_usd_staging" and let Supabase infer
--      the columns from the CSV's header row (iso3,
--      minimum_wage_monthly_usd, exchange_rate_used, exchange_rate_year
--      — text is fine for all of them, even the numeric ones; the
--      UPDATE below casts them). Finish the import wizard.
--   3. Back in the SQL Editor, paste this whole file (from here down)
--      and click Run.
--   4. Spot-check a few rows in the Table Editor afterwards — remember,
--      a blank minimum_wage_monthly_usd is expected wherever
--      minimum_wage_monthly_local is already blank (no statutory
--      minimum wage), and can also happen on its own if the World Bank
--      had no exchange rate for that country/year.

do $$
declare
  updated_count integer;
  staged_count integer;
begin
  select count(*) into staged_count from minimum_wage_usd_staging;

  update countries c
  set
    minimum_wage_monthly_usd = nullif(s.minimum_wage_monthly_usd, '')::numeric
  from minimum_wage_usd_staging s
  where c.iso3 = s.iso3;

  get diagnostics updated_count = row_count;

  raise notice 'Staged % rows, updated % matching rows in countries.', staged_count, updated_count;
  if updated_count < staged_count then
    raise notice 'Heads up: % staged row(s) had no matching iso3 in countries — check for a country code mismatch.', staged_count - updated_count;
  end if;
end $$;

drop table minimum_wage_usd_staging;
