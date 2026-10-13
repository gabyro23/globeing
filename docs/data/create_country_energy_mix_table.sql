-- Creates a new "country_energy_mix" table in Supabase: what share of
-- each country's electricity comes from coal, oil, gas, nuclear, hydro,
-- wind, solar, biofuel and other renewables, plus three summary shares
-- (total fossil, total renewables, total low-carbon) — all as a % of
-- that country's total electricity generation in a single reference
-- year.
--
-- This is its own table (one row per country, iso3 as primary key,
-- referencing countries.iso3) rather than more columns on "countries" —
-- same reasoning as country_wars: keeping topic-specific datasets in
-- their own table keeps "countries" from turning into a wall of columns
-- as more datasets get added, and each table can be dropped, rebuilt,
-- or re-imported on its own without touching anything else. The
-- trade-off is that showing a country's full profile now needs a join
-- (or a second query) across tables — at ~217 rows per table, that's
-- not something Postgres will notice.
--
-- How to run this:
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click Run.
--   3. Then import docs/data/energy_mix.csv directly into this table —
--      see docs/data/energy_mix_README.md for the exact steps. Like
--      country_wars, this does NOT need a staging-table workaround on
--      first load: country_energy_mix is a brand-new, empty table, so
--      Supabase's CSV importer can insert straight into it.
create table if not exists country_energy_mix (
  iso3 text primary key references countries (iso3),
  energy_coal_pct numeric,
  energy_oil_pct numeric,
  energy_gas_pct numeric,
  energy_nuclear_pct numeric,
  energy_hydro_pct numeric,
  energy_wind_pct numeric,
  energy_solar_pct numeric,
  energy_biofuel_pct numeric,
  energy_other_renewable_pct numeric,
  energy_fossil_total_pct numeric,
  energy_renewables_total_pct numeric,
  energy_low_carbon_pct numeric,
  energy_mix_year integer,
  updated_at timestamptz default now()
);

comment on table country_energy_mix is 'Electricity generation mix by country, one row per country. Source: Our World in Data energy dataset (Ember Yearly Electricity Data + Energy Institute Statistical Review of World Energy), see docs/data/energy_mix_README.md. Every energy_*_pct column is a % of that one country''s own total electricity generation in energy_mix_year, not a share of world generation. NULL in any _pct column (or a NULL energy_mix_year) means no data was available for that country in the source at all — a real zero is stored as 0, not NULL.';
comment on column country_energy_mix.energy_coal_pct is 'Share (%) of this country''s electricity generated from coal, in energy_mix_year.';
comment on column country_energy_mix.energy_oil_pct is 'Share (%) of this country''s electricity generated from oil, in energy_mix_year.';
comment on column country_energy_mix.energy_gas_pct is 'Share (%) of this country''s electricity generated from natural gas, in energy_mix_year.';
comment on column country_energy_mix.energy_nuclear_pct is 'Share (%) of this country''s electricity generated from nuclear power, in energy_mix_year.';
comment on column country_energy_mix.energy_hydro_pct is 'Share (%) of this country''s electricity generated from hydropower, in energy_mix_year.';
comment on column country_energy_mix.energy_wind_pct is 'Share (%) of this country''s electricity generated from wind power, in energy_mix_year.';
comment on column country_energy_mix.energy_solar_pct is 'Share (%) of this country''s electricity generated from solar power, in energy_mix_year.';
comment on column country_energy_mix.energy_biofuel_pct is 'Share (%) of this country''s electricity generated from bioenergy/biofuels, in energy_mix_year.';
comment on column country_energy_mix.energy_other_renewable_pct is 'Share (%) of this country''s electricity generated from renewables other than hydro/wind/solar/biofuel (geothermal, wave, tidal, etc.), in energy_mix_year.';
comment on column country_energy_mix.energy_fossil_total_pct is 'Share (%) of this country''s electricity generated from all fossil fuels combined (coal + oil + gas), in energy_mix_year — a precomputed total from the source, should equal roughly energy_coal_pct + energy_oil_pct + energy_gas_pct.';
comment on column country_energy_mix.energy_renewables_total_pct is 'Share (%) of this country''s electricity generated from all renewables combined (hydro + wind + solar + biofuel + other), in energy_mix_year — does NOT include nuclear.';
comment on column country_energy_mix.energy_low_carbon_pct is 'Share (%) of this country''s electricity generated from low-carbon sources — renewables plus nuclear combined — in energy_mix_year.';
comment on column country_energy_mix.energy_mix_year is 'The single reference year all of this row''s energy_*_pct columns are drawn from (the most recent year with a reported total generation figure for that country) — coverage years vary by country, always show this next to the percentages.';
