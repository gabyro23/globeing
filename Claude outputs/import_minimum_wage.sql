-- Merges docs/data/minimum_wage.csv into the "countries" table.
-- Re-run this (from step 2 on) every time you regenerate the CSV with
-- fetch-minimum-wage.mjs, not just the first time.
--
-- Same reasoning and same fix as import_country_profiles.sql: Supabase's
-- Table Editor CSV importer only ever INSERTs rows, and fails with a
-- duplicate-key error against "countries_pkey" if you try to import over
-- rows that already exist (which all ~217 of these do — this data fills
-- in existing rows, it doesn't add new countries). So we load the CSV
-- into a throwaway staging table first, then merge it into "countries"
-- with plain SQL, then delete the staging table.
--
-- How to run this:
--   1. Make sure the columns exist: run add_minimum_wage_column.sql first
--      (SQL Editor -> New query -> paste -> Run) if you haven't already —
--      safe to re-run.
--   2. In the Supabase dashboard, go to Table Editor -> click "+ New
--      table" (top left) -> "Import Data from CSV" -> upload
--      docs/data/minimum_wage.csv. Name the table
--      "minimum_wage_staging" and let Supabase infer the columns from the
--      CSV's header row (iso3, minimum_wage_monthly_local, currency_code,
--      year_reported — text is fine for all of them, even the numeric
--      one; the UPDATE below casts it). Finish the import wizard.
--   3. Back in the SQL Editor, paste this whole file (from here down) and
--      click Run.
--   4. Spot-check a few rows in the Table Editor afterwards — remember, a
--      blank minimum_wage_monthly_local is very often correct (see
--      docs/data/minimum_wage_README.md): plenty of countries have no
--      statutory minimum wage at all.

do $$
declare
  updated_count integer;
  staged_count integer;
begin
  select count(*) into staged_count from minimum_wage_staging;

  update countries c
  set
    minimum_wage_monthly_local = nullif(s.minimum_wage_monthly_local, '')::numeric,
    minimum_wage_year          = nullif(s.year_reported, '')::integer
  from minimum_wage_staging s
  where c.iso3 = s.iso3;

  get diagnostics updated_count = row_count;

  raise notice 'Staged % rows, updated % matching rows in countries.', staged_count, updated_count;
  if updated_count < staged_count then
    raise notice 'Heads up: % staged row(s) had no matching iso3 in countries — check for a country code mismatch.', staged_count - updated_count;
  end if;
end $$;

drop table minimum_wage_staging;
