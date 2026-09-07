-- Adds a "currencies" column to the "countries" table in Supabase: the
-- full list of currencies a country officially uses, not just the single
-- one already in currency_name/currency_code/currency_symbol (see
-- add_country_profile_columns.sql, which added those and has already been
-- run — this is a follow-up, additive migration).
--
-- Most countries only have one currency, so currencies will just repeat
-- currency_name/currency_code for those. It only adds new information for
-- the couple dozen countries with more than one legal-tender currency
-- (Panama's balboa + US dollar, the Bahamas' dollar + US dollar, the
-- Palestinian territories' shekel/dinar/pound, etc.) — see
-- docs/data/country_profiles_README.md for the full list and how each one
-- is decided.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--   3. Then run docs/data/import_country_profiles.sql (same folder) to
--      load docs/data/country_profiles.csv, which fills in "currencies"
--      along with the other columns — that file has the full
--      step-by-step. (A direct CSV import into "countries" here won't
--      work: Supabase's importer only inserts new rows, and these ~217
--      countries already exist.)
--
-- Same format convention as the other text columns here: plain
-- comma-separated text, not a Postgres array, so Supabase's CSV importer
-- handles it with no array-literal quoting edge cases. Each entry is
-- "Name (CODE)", e.g. "Panamanian balboa (PAB), United States dollar
-- (USD)". web/lib/countryPageData.js can split it back into a list the
-- same way it already does for languages.
alter table countries
  add column if not exists currencies text;

comment on column countries.currencies is 'All currencies the country officially uses, comma-separated as "Name (CODE)" — e.g. "Panamanian balboa (PAB), United States dollar (USD)". For a country with only one currency this just repeats currency_name/currency_code in that format.';
