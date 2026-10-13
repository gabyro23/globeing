# Electricity generation mix

`energy_mix.csv` in this folder gives each country a "snapshot" of where
its electricity comes from: what share of generation is coal, oil,
natural gas, nuclear, hydropower, wind, solar, bioenergy, and other
renewables, all for the single most recent year that country has data
for.

This dataset lives in its own table, `country_energy_mix` — not as more
columns on `countries` — on purpose (see "How to load it into Supabase"
below for why).

## Where this data comes from

Fetched live — by `fetch-energy-mix.mjs` (repo root) — from [**Our World
in Data's energy dataset**](https://github.com/owid/energy-data), which
combines two primary sources:

- [**Ember — Yearly Electricity Data**](https://ember-energy.org/data/yearly-electricity-data/):
  a non-profit energy think tank specifically focused on tracking
  electricity generation by source, country by country. It's the
  de-facto standard free source for exactly this — cited by the IEA,
  Bloomberg, Reuters and others whenever "the global electricity mix"
  comes up. CC BY 4.0 licensed.
- [**Energy Institute — Statistical Review of World Energy**](https://www.energyinst.org/statistical-review):
  the direct successor to the historic "BP Statistical Review of World
  Energy," the energy industry's standard reference dataset since 1952
  (BP handed the publication to the Energy Institute). Used mainly to
  fill in years Ember doesn't cover for some countries.

Why not the IEA directly: the International Energy Agency (the
intergovernmental body that's arguably the single most "official" name
in energy statistics) doesn't publish its country-by-fuel breakdown for
free — that level of detail is in paid reports. Ember and the Energy
Institute are the two sources that actually are freely republishable
with this level of detail, and OWID (University of Oxford-affiliated)
does the work of cleaning and merging them into one CSV keyed by ISO3,
which lines up directly with this project's `iso3` column.

**Note on this exact file's stability**: OWID is in the process of
migrating this dataset to a new home
([catalog.ourworldindata.org](https://ourworldindata.org)) and has
flagged the GitHub copy this script reads from as a "legacy" release
that won't be updated in *format* going forward. As of when this script
was written, it was still being refreshed with current Ember/Energy
Institute data (check the `energy_mix_year` values after running it — if
they look stale next time you run this, `DATA_URL` near the top of
`fetch-energy-mix.mjs` is the first thing to check and update).

## What's in the CSV, and why it's a snapshot, not a time series

Each row is one country, with `energy_mix_year` plus percentages for:

- **Fossil fuels**: `energy_coal_pct`, `energy_oil_pct`, `energy_gas_pct`
- **Nuclear**: `energy_nuclear_pct`
- **Renewables**: `energy_hydro_pct`, `energy_wind_pct`,
  `energy_solar_pct`, `energy_biofuel_pct` (bioenergy),
  `energy_other_renewable_pct` (geothermal, wave, tidal, and anything
  else that doesn't fit the other categories)
- **Precomputed totals**: `energy_fossil_total_pct` (coal+oil+gas),
  `energy_renewables_total_pct` (all renewables combined, no nuclear),
  `energy_low_carbon_pct` (renewables + nuclear combined)

All percentages are of that **one country's own** total generation in
`energy_mix_year` — not a share of world generation, and not a measure
of how much electricity the country produces in absolute terms (a
country can be 100% hydro and still generate very little electricity
overall, or vice versa).

This is deliberately a **snapshot, not a historical series**: for each
country, the script picks the single most recent year with a reported
total generation figure, and pulls every percentage from that same year
— so a country's numbers are never a patchwork of different years for
different fuels. The source data goes back to 1900 for some countries
and metrics, so a full time series is possible later if useful, but
would need a different shape of table (one row per country *and* year,
like `country_wars` is one row per country and conflict).

## Caveats worth knowing before showing this data

- **`energy_mix_year` varies by country.** Reporting currency differs a
  lot — some countries have 2025 or 2026 data, others only go up to a
  few years ago. Always show the year next to the percentages, the same
  way `minimum_wage_year` is shown next to `minimum_wage_monthly_local`.
- **A NULL/blank is a genuine coverage gap, not a zero.** As of the last
  run, 14 countries in this project's `countries` table have no data at
  all in this source and get no row in `country_energy_mix`: Andorra
  (AND), the Channel Islands (CHI), Curaçao (CUW), Micronesia (FSM), the
  Isle of Man (IMN), Liechtenstein (LIE), Saint Martin (MAF), Monaco
  (MCO), the Marshall Islands (MHL), the Northern Mariana Islands (MNP),
  Palau (PLW), San Marino (SMR), Sint Maarten (SXM), and Tuvalu (TUV).
  These are all very small states/territories that Ember and the Energy
  Institute don't track individually (often because they don't run
  their own standalone electricity grid/generation, or are just below
  the size these sources cover) — re-running the fetch script prints
  the current list to the console, in case it changes as the source
  adds coverage. A real zero for a given fuel (a country tracked by the
  source that simply has none of that source) is stored as `0`, not
  blank — only a country missing from the table entirely means "no data
  at all." Also worth noting: even for covered countries, a handful of
  individual source columns can be blank while the totals are still
  populated (e.g. Saudi Arabia has no `energy_hydro_pct` value even
  though `energy_fossil_total_pct` is filled in) — the source simply
  doesn't break out a negligible/absent category for every country.
- **The percentages for one country/year should sum close to 100%,**
  but can be off by a little due to rounding or small categories (net
  imports, pumped storage losses) that aren't broken out as their own
  column here.
- **Kosovo** is identified in the source by name only (no ISO code), so
  the script maps it by name to `XKX`, matching the convention already
  used elsewhere in this project (see `country_profiles_README.md`).

## Re-running the fetch

```
node fetch-energy-mix.mjs
```

from the repo root. Requires Node 18+ (built-in `fetch`, no
dependencies) and `countries_data.csv` at the repo root (already there).
It overwrites `docs/data/energy_mix.csv`.

## Why this is its own table, not more columns on `countries`

`countries` already picked up a number of columns from earlier datasets
in this folder (official name, currency, languages, minimum wage...). A
13-column addition for energy was the point where it made more sense to
give this its own table instead of letting `countries` keep growing
indefinitely as more datasets get added — same idea as `country_wars`,
just one-to-one (one row per country) instead of one-to-many (one row
per country *per war*). Keeping each dataset in its own table means:

- `countries` stays focused on core identity facts, not an ever-growing
  wall of topic-specific columns.
- Each table can be dropped, rebuilt, or re-imported on its own —
  refreshing the energy mix never risks touching wars, wages, or
  currency data, and vice versa.
- It's easy to tell at a glance which dataset a column belongs to.

The cost: showing a country's full profile now means querying more than
one table (a join on `iso3`, or two separate queries) instead of one
flat `select * from countries where iso3 = ...`. At ~217 rows per table,
Postgres won't notice the difference.

## How to load it into Supabase

Unlike the datasets that fill in existing `countries` rows (which need
the staging-table workaround described in `country_profiles_README.md`),
`country_energy_mix` is a **brand-new, empty table** — so the CSV import
goes straight in, same as `country_wars`:

1. Run `create_country_energy_mix_table.sql` (same folder) in the
   Supabase SQL editor — creates the table (with `iso3` as its primary
   key, referencing `countries.iso3`) and the column comments
   documenting the source. Safe to re-run.
2. Table Editor → click into the new `country_energy_mix` table →
   **Insert** → **Import data from CSV** → upload `energy_mix.csv`.
   Since the table is empty, the import inserts all rows directly — no
   duplicate-key error, no staging table needed.
3. Spot-check a few rows in the Table Editor afterwards — remember, a
   country simply missing from the table is often correct (see the
   coverage-gap list above), not something to chase down.

Re-running the fetch later: truncate the table first (`truncate table
country_energy_mix;` in the SQL editor) before re-importing the
refreshed CSV, so you don't end up with duplicate rows from the old and
new fetch both loaded — same reasoning as `country_wars`.

`country_energy_mix` isn't wired into any page yet — it's there for
whenever you want to show a country's energy mix (you'll need a join on
`iso3` to combine it with `countries` for a full country profile).
