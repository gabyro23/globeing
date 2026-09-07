# Country profiles (official name, currency, language)

`country_profiles.csv` in this folder gives every country in the database
its official/constitutional name, currency (name, ISO 4217 code, symbol —
plus a `currencies` column listing *every* currency it officially uses,
for the handful of countries that have more than one), and official
language(s) — the same facts `web/lib/countryProfiles.js` currently
hand-types one country at a time.

## Where this data comes from

Like `countries_data.csv` (fetched live from the World Bank API by
`fetch-world-bank-data.mjs`), this file is fetched live — by
`fetch-country-profiles.mjs`, from
[**world-countries**](https://github.com/mledoze/countries) (the
`mledoze/countries` dataset), served at
`https://cdn.jsdelivr.net/npm/world-countries/dist/countries.json`.

Why this source and not another:

- The World Bank API (what `fetch-world-bank-data.mjs` uses) doesn't have
  official name, currency, or language at all — only economic indicators.
- [REST Countries](https://restcountries.com) used to be the obvious free,
  keyless API for exactly this data, and is still what most tutorials
  point to. As of 2026 it requires creating an account and an API key
  (a free tier exists — no credit card — but it's no longer a plain public
  endpoint you can just `fetch()`).
- `world-countries` is the open dataset REST Countries itself was built on
  top of. It's still fully public with no key and no rate limit, MIT
  licensed, and pulls from the same underlying authoritative sources: ISO
  4217 (currency codes) and ISO 639-3 (language codes), the CIA World
  Factbook, and Wikipedia. It's published as an npm package and mirrored
  live on jsDelivr, so fetching it is one plain HTTP GET, same as the
  World Bank script.

`fetch-country-profiles.mjs` reads the iso3 list straight out of
`countries_data.csv` at the repo root, so `country_profiles.csv` always
lines up with exactly the countries already in Supabase — no more, no
less.

## Re-running the fetch

```
node fetch-country-profiles.mjs
```

from the repo root. Requires Node 18+ (built-in `fetch`, no dependencies).
It overwrites `docs/data/country_profiles.csv`.

## The `currencies` column

`currency_name`/`currency_code`/`currency_symbol` are the single currency
we picked as "the" official one for each country (see below for how). The
`currencies` column instead lists **all** of them, comma-separated as
`Name (CODE)` — e.g. `Panamanian balboa (PAB), United States dollar
(USD)`. Most countries only have one, so for them `currencies` just
repeats `currency_name`/`currency_code` in that format. It only adds new
information for the couple dozen countries with more than one
legal-tender currency — the same ones listed under "countries with more
than one legal-tender currency" below.

## Known gaps in the source, and how the script handles them

No free dataset gets every one of these edge cases right out of the box,
so the script layers a small number of hand-picked corrections on top of
the live fetch (all named and commented in the `ISO3_ALIASES`,
`CURRENCY_OVERRIDES`, `MANUAL_CURRENCY`, `ALL_CURRENCIES_OVERRIDES`,
`CURRENCY_NAME_FIXES`, `LANGUAGE_FIXES`, and `MANUAL_OVERRIDES` tables near
the top of the script):

- **Two `iso3` codes don't exist in the source at all**, because the World
  Bank uses non-standard codes for them: Kosovo (`XKX`, aliased to the
  source's `UNK`) and the Channel Islands (`CHI` — a World Bank-only
  aggregate of Jersey and Guernsey, which are two separate jurisdictions
  with their own currencies; filled in by hand).
- **Countries with more than one legal-tender currency** (Panama, the
  Bahamas, Bhutan, Lesotho, Namibia, Eswatini, Cambodia, Kiribati, Tuvalu,
  Brunei, the Faroe Islands, the Isle of Man, and the Palestinian
  territories) — the source lists all of them with no indication of which
  is "the" official one, so the script picks one by hand for
  `currency_name`/`currency_code`/`currency_symbol` (the `currencies`
  column keeps the full list as the source reports it).
- **Zimbabwe's ZiG** (launched April 2024) isn't in the source yet — the
  source still lists the stale, pre-2024 basket of 9 foreign currencies
  Zimbabwe leaned on before it had its own again. For both
  `currency_name` and `currencies`, the script sets this by hand to what's
  actually legal tender today: the ZiG, plus the US dollar (which stays
  in circulation alongside it under the 2024 reform's dual-currency
  system).
- **Micronesia's currency comes back empty** in the source; it's the US
  dollar, set by hand for both `currency_name` and `currencies`.
- **A few currency names are missing their country name** in the source
  (e.g. "lari" instead of "Georgian lari", for Georgia, the Gambia,
  Greenland, and North Macedonia) — filled in for consistency with the
  rest of the file, in `currencies` as well as `currency_name`.
- **Austria's language** comes back as "Austro-Bavarian German" (a
  regional dialect) instead of standard German — corrected.
- **Moldova's language** comes back as "Moldavian" — corrected to
  "Romanian", per Moldova's Constitutional Court's 2023 ruling that
  Romanian is the official name of the state language.

Two things worth spot-checking yourself before you trust this blindly:

- **Official name**: for a handful of countries the "official" name is
  politically contested or changes with the government in power
  (Afghanistan, the West Bank and Gaza/State of Palestine). The source
  fills these in with the internationally-common formal name, not a
  political stance — reword any of them if you'd rather phrase it
  differently.
- **Languages**: the source's definition of "official languages" is
  sometimes broader than just the one or two languages of national
  government business — a few countries (India, South Africa, Zimbabwe,
  Namibia) constitutionally recognize a longer list of regional/national
  languages, and the source lists all of them, not just the most
  prominent one or two.
- **`currencies`**: apart from the Zimbabwe/Micronesia cases above, this
  column is otherwise the source's raw, unfiltered list — which can
  include a currency that's since been retired (Cuba's convertible peso,
  the CUC, was phased out in January 2021 but is still listed alongside
  the CUP). `currency_name`/`currency_code` already pick the currently-real
  one; take `currencies` as "what the source considers legal tender",
  not a guarantee that every entry in it is still circulating today.

## How to load it into Supabase

This needs a small workaround: Supabase's Table Editor CSV importer only
ever *inserts* rows, and errors with a duplicate-key violation if a row it's
inserting collides with one that already exists. Since these ~217 rows all
already exist in `countries` (this data fills in existing rows, it doesn't
add new countries), importing the CSV straight into `countries` doesn't
work — you'd hit that error immediately. `import_country_profiles.sql`
(same folder) works around it with a staging table. Concretely:

1. Add the columns, if you haven't already: open the Supabase SQL editor
   (your project → SQL Editor → New query), paste in
   `add_country_profile_columns.sql`, and Run. Do the same with
   `add_country_currencies_column.sql`. Both are safe to re-run.
2. Load the CSV into a *new, empty* table (not `countries` itself) so
   there's nothing for it to conflict with: Table Editor → **+ New table**
   (top left) → **Import Data from CSV** → upload
   `docs/data/country_profiles.csv`. Name the new table
   `country_profiles_staging` and let Supabase infer the columns from the
   CSV's header row — they'll come in as `iso3`, `official_name`,
   `currency_name`, `currency_code`, `currency_symbol`, `currencies`,
   `languages`, all as text, which is exactly what you want. Finish the
   import wizard.
3. Back in the SQL editor, paste in `import_country_profiles.sql` and
   Run. It copies every column from `country_profiles_staging` into the
   matching row of `countries` (matched on `iso3`), prints how many rows
   it updated so you can confirm it's ~217, and then deletes the staging
   table for you.
4. Spot-check a few rows in the Table Editor afterwards — see the caveats
   above (Zimbabwe's currency, contested official names, etc.).

Next time you regenerate `country_profiles.csv` (re-running
`fetch-country-profiles.mjs`), you only need steps 2–4 again — the column
migrations in step 1 don't need re-running.

Once the columns are populated, `web/lib/countryPageData.js` reads
`official_name`/`currency_*`/`languages` straight from the country's row —
`web/lib/countryProfiles.js`'s hand-typed entries are only used as a
fallback for a country whose database row doesn't have this filled in yet.
`currencies` isn't wired into that page yet — it's there in the database
for whenever you want to show the full list somewhere.
