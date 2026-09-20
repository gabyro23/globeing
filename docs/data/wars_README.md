# Wars by country

`wars.csv` in this folder lists every country that has been in a war, who
it fought (or who the conflict was against, for internal wars), and the
years — one row per country per conflict.

## Where this data comes from

Fetched live — by `fetch-wars.mjs` (repo root) — from the [**UCDP/PRIO
Armed Conflict Dataset**](https://ucdp.uu.se/downloads/), produced by the
[Uppsala Conflict Data Program](https://ucdp.uu.se) (Uppsala University),
co-produced with [PRIO Oslo](https://www.prio.org). It's the standard
academic and UN-referenced source for this kind of data: free, no API
key needed for the CSV download, [CC BY
4.0](https://creativecommons.org/licenses/by/4.0/) licensed (attribution
required, see below), covers 1946–present, and is updated once a year.

**Citation required by the license** (include this wherever the data is
shown or republished):

- Gleditsch, Nils Petter, Peter Wallensteen, Mikael Eriksson, Margareta
  Sollenberg & Håvard Strand (2002) Armed Conflict 1946-2001: A New
  Dataset. *Journal of Peace Research* 39(5).
- The current UCDP/PRIO Armed Conflict Dataset codebook's own citation
  for the latest "Organized violence" article by Davies, Pettersson &
  Öberg (check the codebook linked from
  [ucdp.uu.se/downloads](https://ucdp.uu.se/downloads/) for the exact
  year's citation — it's published annually).

## Scope — read this before treating a blank as "no war"

This is a **deliberately narrow slice** of the dataset, not the whole
thing:

- **Only `intensity_level == 2`** ("war": at least 1,000 battle-related
  deaths in that calendar year) is included. UCDP's own "minor conflict"
  tier (`intensity_level == 1`, 25–999 deaths/year) is left out entirely.
  A country not appearing here may still have had armed conflicts — just
  none that crossed the 1,000-deaths-in-a-year threshold.
- **Coverage starts at 1946.** Nothing before that — including WWII — is
  in this dataset at all; UCDP's own scope starts at the end of WWII.
- Only **state-based** conflicts are covered (UCDP's Armed Conflict
  Dataset requires a government to be one of the parties). Purely
  non-state conflicts (e.g. between two militias, neither one a
  government) or one-sided violence against civilians are separate UCDP
  datasets not used here.

## Columns

| Column | Meaning |
|---|---|
| `iso3` | The tagged country. |
| `conflict_name` | `"{side_a} – {side_b}"`, taken from UCDP's own actor names for the conflict's most recent year (UCDP doesn't publish a separate short conflict title in this dataset — the side names are already close to one, e.g. side_a is usually literally "Government of X"). |
| `side_a` / `side_b` | UCDP's own actor names, kept as their own columns too in case you want to build a display differently than the concatenated name. |
| `type_of_conflict` | One of `extrastate`, `interstate`, `intrastate`, `internationalized intrastate` — UCDP's own `type_of_conflict` codes translated to plain English. |
| `start_year` | The earliest calendar year this conflict reached war-level intensity. |
| `end_year` | The latest calendar year it did — **blank/NULL if the conflict is still ongoing** as of the most recent year the dataset covers (see below for exactly how that's decided). |
| `ucdp_conflict_id` | UCDP's own conflict identifier, so you can cross-reference back to their data or site. |

## Which countries get tagged, and why a war can appear on two pages

For every conflict-year row that qualifies (`intensity_level == 2`):

- The country the conflict is fought in/by — UCDP's `gwno_a` field (the
  government side's own country) — is always tagged.
- **For interstate wars only** (`type_of_conflict == interstate`, UCDP
  code 2 — one state's government fighting another state's government),
  the opposing state — `gwno_b` — is **also** tagged. That's on purpose:
  it means an interstate war shows up on both countries' pages, not just
  one. (For intrastate/internationalized-intrastate/extrastate wars,
  side_b is a non-state actor or a colony, not a country, so there's no
  second country to tag there.)
- If UCDP lists more than one country code in `gwno_a` or `gwno_b` for a
  single year (this happens for coalitions), every one of them gets
  tagged — a multi-country coalition war can end up with quite a few
  rows for the same `ucdp_conflict_id`, and that's expected, not a bug.

A multi-year war becomes a single row per country: `start_year` is the
earliest war-level year, `end_year` the latest.

## How "still ongoing" is decided

A conflict's `end_year` is left blank when its most recent war-level
year **is** the most recent year the entire dataset covers (e.g. its
latest year is the dataset's own latest year), and that year isn't
already marked ended in UCDP's own data. UCDP's codebook is explicit
that a conflict's final covered year is always coded as "not yet ended"
internally, simply because it isn't known yet whether it'll continue —
so this is UCDP's own signal for "as far as we know, still going," not a
guess this script is making.

If a war stopped reaching the 1,000-deaths threshold years before the
dataset's latest year (say, it de-escalated in 2015 while the dataset
runs through 2025), it is **not** marked ongoing — its `end_year` is
2015, the last year it actually qualified as a war. It may still have
continued afterward at "minor" intensity (a level this file doesn't
track), so "ended" here specifically means "stopped meeting the war
threshold," not necessarily "stopped entirely."

## The country crosswalk — and what's flagged, not dropped

UCDP identifies countries using [Gleditsch &
Ward](http://ksgleditsch.com/data/iisystem.dat) numeric state codes, the
standard system in political science for this — not ISO codes. There's
no single official GW→ISO3 table, so `fetch-wars.mjs` builds one by hand
(the `GW_TO_ISO3` table near the top of the script), cross-referencing
Gleditsch's own published state list against each country's real ISO
3166-1 alpha-3 code. Worth knowing:

- **A handful of GW codes are historical states that no longer exist**
  and so have no current ISO3 to map to at all — the USSR-to-Russia and
  Ottoman-Empire-to-Turkey transitions are handled by Gleditsch & Ward's
  own coding as one continuous state (so Soviet-era and Ottoman-era wars
  *do* get tagged, to Russia and Turkey respectively — a documented
  choice of Gleditsch & Ward's system, not this script's own judgment
  call), but states that were genuinely dissolved or absorbed —
  Czechoslovakia, Yugoslavia, East Germany, South Vietnam, South Yemen,
  Austria-Hungary, and a number of 19th-century states, among others —
  are **not** silently reassigned to whichever modern country inherited
  their territory. A war attributed to one of these is left out of
  `wars.csv` for that side, and logged instead in
  `docs/data/wars_unmapped_gw_codes.csv`, along with which conflict it
  was, the year, and why it's unmapped. Check that file after every run
  — it's short, and it's there specifically so nothing disappears
  quietly.
- If a GW code shows up that isn't in the crosswalk table **at all**
  (not even as a known historical state), it's flagged there too, with a
  note that the table may need an entry added — this would mean either a
  genuinely new/rare code, or a gap in this script's table worth fixing.
- **Kosovo** is coded as `XKX` and **Taiwan** as `TWN`, matching (Kosovo)
  or extending (Taiwan) the convention already used elsewhere in this
  project (see `country_profiles_README.md`). Taiwan doesn't currently
  have a row in the `countries` table (it's absent from the World
  Bank-derived country list this project is built on), so a Taiwan row
  in `country_wars` won't have a matching country page yet — that's a
  pre-existing gap in `countries`, not something this script can fix.

## Re-running the fetch

```
node fetch-wars.mjs
```

from the repo root. Requires Node 18+ (built-in `fetch`) and the `unzip`
command on your PATH (installed by default on macOS and most Linux
distributions) — UCDP publishes the dataset as a `.zip`, and this avoids
adding an npm dependency just to unpack one file. It overwrites
`docs/data/wars.csv` and `docs/data/wars_unmapped_gw_codes.csv`.

UCDP updates this dataset once a year; `fetch-wars.mjs` has the current
version number near the top (`DATASET_VERSION`) — bump it if you re-run
this well after a new release and the old URL 404s.

## How to load it into Supabase

Unlike the other datasets in this folder, `country_wars` is a **brand
new table**, not new columns merged into existing `countries` rows — so
there's no staging-table workaround needed here. A straight CSV import
works:

1. Run `create_country_wars_table.sql` (same folder) in the Supabase SQL
   editor — creates the table, its index, and a comment documenting the
   source. Safe to re-run.
2. Table Editor → click into the new `country_wars` table → **Insert** →
   **Import data from CSV** → upload `wars.csv`. Since the table is
   empty and has no unique/primary-key conflicts on `iso3` (a country
   can have many rows here, unlike `countries`), the import inserts all
   rows directly — no duplicate-key error, no staging table needed.
3. Spot-check a few rows in the Table Editor afterwards, and take a look
   at `docs/data/wars_unmapped_gw_codes.csv` for anything that didn't
   make it in.

Re-running the fetch later (once UCDP publishes a new annual version):
truncate the table first (`truncate table country_wars restart identity;`
in the SQL editor) before re-importing the refreshed CSV, so you don't
end up with duplicate rows from the old and new fetch both loaded.

`country_wars` isn't wired into any page yet — it's there for whenever
you want to show a country's war history.
