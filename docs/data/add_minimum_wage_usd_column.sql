-- Adds a USD-converted minimum wage column to the "countries" table in
-- Supabase: minimum_wage_monthly_local (already in the table, in each
-- country's own currency) converted to US dollars, for at-a-glance
-- comparison across countries.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--   3. Then run docs/data/import_minimum_wage_usd.sql (same folder) to
--      load docs/data/minimum_wage_usd.csv into this new column — that
--      file has the full step-by-step (same staging-table approach used
--      for minimum_wage.csv and country_profiles.csv, since Supabase's
--      CSV importer can't update existing rows directly).
--
-- IMPORTANT — read before using this column anywhere:
-- This is a plain NOMINAL currency conversion, using the World Bank's
-- official market exchange rate (indicator PA.NUS.FCRF, "Official
-- exchange rate (LCU per US$, period average)") for the same year as
-- countries.minimum_wage_year. It is NOT adjusted for purchasing power
-- (no PPP/cost-of-living adjustment) — $500/month in the US and
-- $500/month in a country with a much lower cost of living do NOT buy
-- the same amount of goods. Use this column for a quick, literal
-- dollar-for-dollar comparison only, never to claim two countries have
-- an equivalent standard of living from their minimum wage.
alter table countries
  add column if not exists minimum_wage_monthly_usd numeric;

comment on column countries.minimum_wage_monthly_usd is 'countries.minimum_wage_monthly_local converted to US dollars using the World Bank''s official nominal exchange rate (indicator PA.NUS.FCRF) for the same year as minimum_wage_year. This is a simple market-rate conversion, NOT purchasing-power-adjusted (no PPP) — good for an at-a-glance dollar comparison, not a real cost-of-living comparison between countries. NULL means either there is no statutory minimum wage for that country (see minimum_wage_monthly_local) or no official exchange rate was available for that country/year.';
