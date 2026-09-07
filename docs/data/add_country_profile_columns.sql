-- Adds official name / currency / language columns to the "countries"
-- table in Supabase.
--
-- Today these facts only exist, hand-typed, for the 2 countries that
-- already have an indexed /country/[slug] page (web/lib/countryProfiles.js).
-- This migration adds the columns so the same facts can live in the
-- database for every country instead, so a country's page doesn't need a
-- hand-written profile before it can be indexed.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--   3. Then run docs/data/import_country_profiles.sql (same folder) to
--      load docs/data/country_profiles.csv into these new columns for
--      every country — that file has the full step-by-step. (A direct
--      CSV import into "countries" here won't work: Supabase's importer
--      only inserts new rows, and these ~217 countries already exist.)
--      See docs/data/country_profiles_README.md for the details and
--      caveats on this data.
--
-- `languages` is plain comma-separated text ("Japanese, English"), not a
-- Postgres array — that's deliberate, so importing the CSV through
-- Supabase's table editor "just works" without array-literal quoting
-- edge cases. web/lib/countryPageData.js splits it back into a list.
alter table countries
  add column if not exists official_name text,
  add column if not exists currency_name text,
  add column if not exists currency_code text,
  add column if not exists currency_symbol text,
  add column if not exists languages text;

comment on column countries.official_name is 'Full official/constitutional name (e.g. "Federative Republic of Brazil"), as opposed to the short/common name in countries.name.';
comment on column countries.currency_name is 'Currency name in English, e.g. "Japanese yen".';
comment on column countries.currency_code is 'ISO 4217 currency code, e.g. "JPY".';
comment on column countries.currency_symbol is 'Currency symbol as commonly printed, e.g. "¥".';
comment on column countries.languages is 'Official/national language(s), comma-separated, e.g. "Kirundi, French, English".';
