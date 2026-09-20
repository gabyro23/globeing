# Minimum wage

`minimum_wage.csv` in this folder gives every country in the database its
statutory (legally mandated) nominal gross monthly minimum wage, in the
country's own currency, and the year that figure was last reported for.

## Where this data comes from

Fetched live — by `fetch-minimum-wage.mjs` (repo root) — from
[**ILOSTAT**](https://ilostat.ilo.org), the labour-statistics database run
by the [International Labour Organization](https://www.ilo.org) (the UN
agency responsible for labour standards and statistics — the natural
"official" source for this specific fact, the same way the World Bank is
for economic indicators). Specifically, the indicator **"Statutory nominal
gross monthly minimum wage (local currency)"** (indicator id
`EAR_INEE_NOC_NB_A`), via ILOSTAT's public API at
`https://rplumber.ilo.org` — the same API the ILO's own official R package,
[Rilostat](https://github.com/ilostat/Rilostat), uses under the hood. No
API key needed.

Why this source: minimum wage isn't in the World Bank's indicators API
(the one `fetch-world-bank-data.mjs` uses) at all — that's purely economic
indicators (GDP, population, etc.), not labour law. The ILO is literally
the UN body that standardizes and collects this exact kind of statistic
from national governments, which is about as authoritative as a source
gets for it.

## Re-running the fetch

```
node fetch-minimum-wage.mjs
```

from the repo root. Requires Node 18+ (built-in `fetch`, no dependencies)
and `docs/data/country_profiles.csv` to already exist (run
`fetch-country-profiles.mjs` first if you haven't) — this script reads the
`currency_code` column from it to label which currency each minimum wage
figure is in. It overwrites `docs/data/minimum_wage.csv`.

## Reading the data — two things that look like gaps but aren't

- **A blank `minimum_wage_monthly_local` usually isn't missing data — it's
  the real answer.** A meaningful number of countries (Sweden, Denmark,
  Norway, Finland, Iceland, Switzerland, Austria, among others) have no
  statutory minimum wage at all: pay there is set by collective bargaining
  between unions and employers instead of by law. For those countries,
  ILOSTAT correctly has no figure, and neither does this CSV. Don't treat
  an empty row as a country to go "fix."
- **`year_reported` won't be the same year for every country.** Countries
  report to ILOSTAT on their own schedule, so this is genuinely a mix of
  recent and several-years-old figures depending on the country — always
  show `minimum_wage_year` next to the number rather than implying every
  country's figure is equally current.
- **The number is in the country's own currency**, not a common one like
  USD — that's why the fetch script cross-references
  `country_profiles.csv`'s `currency_code` column rather than duplicating
  a currency of its own. A Malawian kwacha figure and a Japanese yen
  figure are not on the same scale; don't compare `minimum_wage_monthly_local`
  across countries directly without converting first.
- **Some very small territories aren't covered at all** (mostly ones that
  aren't independent ILO member states in their own right — dependencies
  and special administrative regions). That's a genuine coverage gap in
  ILOSTAT itself, not something the fetch script can fill in.

## How to load it into Supabase

Same two-step workaround as `country_profiles.csv` (see
`country_profiles_README.md` for the longer explanation of why): Supabase's
CSV importer can't update existing rows, so it goes through a staging
table.

1. Run `add_minimum_wage_column.sql` (same folder) in the Supabase SQL
   editor if you haven't already — adds the 2 new columns to `countries`.
2. Table Editor → **+ New table** → **Import Data from CSV** → upload
   `minimum_wage.csv` → name the new table `minimum_wage_staging` → let
   Supabase infer the columns → finish the import.
3. SQL editor → paste in `import_minimum_wage.sql` → Run. It merges the
   staging table into `countries` by `iso3` and deletes the staging table.
4. Spot-check a few rows afterwards — remember, blanks are often correct
   (see above), not something to chase down.

`minimum_wage_monthly_local`/`minimum_wage_year` aren't wired into any
page yet — they're in the database for whenever you want to show them.
