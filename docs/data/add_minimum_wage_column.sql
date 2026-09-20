-- Adds statutory minimum wage columns to the "countries" table in
-- Supabase: the monthly minimum wage amount (in the country's own
-- currency — see countries.currency_code, added earlier), and the year
-- that figure was last reported for.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--   3. Then run docs/data/import_minimum_wage.sql (same folder) to load
--      docs/data/minimum_wage.csv into these new columns — that file has
--      the full step-by-step (same staging-table approach used for
--      country_profiles.csv, since Supabase's CSV importer can't update
--      existing rows directly).
--
-- minimum_wage_monthly_local is a number (not text like the other
-- profile columns) so it can be sorted, ranked, and compared/converted in
-- SQL or in the app directly.
alter table countries
  add column if not exists minimum_wage_monthly_local numeric,
  add column if not exists minimum_wage_year integer;

comment on column countries.minimum_wage_monthly_local is 'Statutory nominal gross monthly minimum wage, in the country''s own currency (see currency_code). NULL means the country has no statutory (legally mandated) minimum wage — wages there are set some other way (e.g. collective bargaining) — not that the data is missing.';
comment on column countries.minimum_wage_year is 'The year countries.minimum_wage_monthly_local was last reported for by the source. Coverage/update frequency varies by country, so this can be several years old for some countries and current for others — always show it next to the figure.';
