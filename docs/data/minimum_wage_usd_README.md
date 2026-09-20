# Minimum wage in USD

`minimum_wage_usd.csv` in this folder gives every country's statutory
monthly minimum wage — already in the database as
`minimum_wage_monthly_local` (see `minimum_wage_README.md`) — converted to
US dollars, so it can be compared across countries at a glance.

## Where this data comes from

Fetched live — by `fetch-minimum-wage-usd.mjs` (repo root) — from the
[**World Bank API**](https://api.worldbank.org), indicator **"Official
exchange rate (LCU per US$, period average)"** (`PA.NUS.FCRF`). This is
the same institution and the same kind of official figure
`fetch-world-bank-data.mjs` already uses for this project's other
economic indicators, which makes it the most consistent choice for a
currency conversion here (rather than, say, a private FX-rate API).

## Conversion method

```
minimum_wage_monthly_usd = minimum_wage_monthly_local / exchange_rate
```

For each country, the script uses the exchange rate from the **same
year** `minimum_wage.csv` reports the wage for (`year_reported` /
`countries.minimum_wage_year`), so a wage isn't accidentally compared
using a different year's dollar. When the World Bank doesn't have that
exact year for a country — common for the current year, since its annual
average isn't final yet — it falls back to the nearest year available,
checked in this order: same year, one year before, one year after, two
years before, two years after. If none of those five years has a rate,
the row is left blank rather than guessing.

You can tell when a fallback year was used: compare
`minimum_wage_usd.csv`'s `exchange_rate_year` column to that same
country's `year_reported` in `minimum_wage.csv` (or `minimum_wage_year`
in the `countries` table) — if they differ, the dollar figure uses a
different year's exchange rate than the wage's own reporting year.

## Reading the data — important caveats

- **This is a nominal conversion, not a cost-of-living comparison.** It
  uses the plain market exchange rate, not a purchasing-power-parity
  (PPP) adjustment. $500/month in a country with a much lower cost of
  living is not "worth the same" as $500/month in the US — this column
  answers "how many dollars is this, literally," not "how far does this
  go locally." Don't use it to argue two countries have an equivalent
  standard of living.
- **A blank `minimum_wage_monthly_usd` is usually just inherited from
  `minimum_wage_monthly_local` being blank** — countries with no
  statutory minimum wage (see `minimum_wage_README.md`) have nothing to
  convert, on purpose.
- **A blank value can also happen on its own**, separately from the
  above: a handful of countries/territories that do have a local minimum
  wage figure aren't covered by the World Bank's exchange-rate indicator
  at all (mostly small territories and dependencies, the same kind of
  gap `country_profiles_README.md` and `minimum_wage_README.md` describe
  for their own sources). `fetch-minimum-wage-usd.mjs` reports how many
  of these there are each time you run it.
- **Eurozone countries will show the same exchange rate** for a given
  year, since they share the euro — that's expected, not a bug.

## Re-running the fetch

```
node fetch-minimum-wage-usd.mjs
```

from the repo root. Requires Node 18+ (built-in `fetch`, no dependencies)
and `docs/data/minimum_wage.csv` to already exist (run
`fetch-minimum-wage.mjs` first if you haven't). It overwrites
`docs/data/minimum_wage_usd.csv`.

## How to load it into Supabase

Same staging-table workaround as the other datasets in this folder (see
`country_profiles_README.md` for the longer explanation of why): Supabase's
CSV importer can't update existing rows, so it goes through a staging
table.

1. Run `add_minimum_wage_usd_column.sql` (same folder) in the Supabase
   SQL editor if you haven't already — adds the new column to
   `countries`.
2. Table Editor → **+ New table** → **Import Data from CSV** → upload
   `minimum_wage_usd.csv` → name the new table
   `minimum_wage_usd_staging` → let Supabase infer the columns → finish
   the import.
3. SQL editor → paste in `import_minimum_wage_usd.sql` → Run. It merges
   the staging table into `countries` by `iso3` and deletes the staging
   table.
4. Spot-check a few rows afterwards — remember, blanks are often correct
   (see above), not something to chase down.

`minimum_wage_monthly_usd` isn't wired into any page yet — it's in the
database for whenever you want to show it.
