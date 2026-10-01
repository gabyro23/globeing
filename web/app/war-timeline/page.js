import { getAllCountries, getAllWars } from "../../lib/countryPageData";
import { metaForAlpha3 } from "../../lib/countryMeta";
import { isCountryIndexed, slugForIso3 } from "../../lib/countryIndex";
import { pageMetadata } from "../../lib/seo";
import topoIds from "../../lib/countryTopoIds.json";
import { Suspense } from "react";
import WarTimelineExplorer, { WarTimelineFromUrl } from "../../components/WarTimelineExplorer";

// The data changes once a year (UCDP publishes annually), so a daily
// revalidate is plenty and keeps the page fully server-rendered/indexable.
export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "War Timeline",
  description:
    "Every war since 1946 on one timeline — which countries fought, against whom, and for how long. Filter by continent or country.",
  path: "/war-timeline",
});

const nameByIso3 = new Map(topoIds.map((c) => [c.alpha3, c.name]));

// country_wars has one row per (country, conflict): an interstate war
// shows up once per state involved (see docs/data/wars_README.md). This
// page is about wars, not countries, so rows are folded back into one
// entry per ucdp_conflict_id carrying the list of countries involved.
function groupWars(rows) {
  const byConflict = new Map();
  for (const r of rows) {
    const key = r.ucdp_conflict_id || `row-${r.id}`;
    const existing = byConflict.get(key);
    if (existing) {
      if (!existing.iso3s.includes(r.iso3)) existing.iso3s.push(r.iso3);
      continue;
    }
    byConflict.set(key, {
      id: key,
      conflict_name: r.conflict_name,
      side_a: r.side_a,
      side_b: r.side_b,
      type_of_conflict: r.type_of_conflict,
      start_year: r.start_year,
      end_year: r.end_year,
      iso3s: [r.iso3],
    });
  }
  // Newest first; among same start year, ongoing wars first.
  return [...byConflict.values()].sort(
    (a, b) => b.start_year - a.start_year || (a.end_year ? 1 : 0) - (b.end_year ? 1 : 0)
  );
}

export default async function WarTimelinePage() {
  let wars = [];
  let error = null;
  try {
    wars = groupWars(await getAllWars());
  } catch (err) {
    error = err.message;
  }

  // Prefer the site's own everyday country names from Supabase ("Iran",
  // "Russia") over countryTopoIds' ISO-style ones ("Iran, Islamic
  // Republic of"); fall back to the latter if the countries table fails.
  let nameFromDb = new Map();
  try {
    nameFromDb = new Map((await getAllCountries()).map((c) => [c.iso3, c.name]));
  } catch {
    // keep the countryTopoIds fallback
  }

  const currentYear = new Date().getFullYear();

  // Only countries that actually appear in at least one war — this is
  // what the country filter offers.
  const countryIso3s = [...new Set(wars.flatMap((w) => w.iso3s))];
  const countries = countryIso3s
    .map((iso3) => ({
      iso3,
      name: nameFromDb.get(iso3) || nameByIso3.get(iso3) || iso3,
      ...metaForAlpha3(iso3),
      slug: isCountryIndexed(iso3) ? slugForIso3(iso3) : null,
      warCount: wars.filter((w) => w.iso3s.includes(iso3)).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">War Timeline</h1>
        <p className="app-hero__subtitle">
          Every war since 1946 on a single timeline — who fought, against whom, and for how long. Filter
          by continent or pick a country to see its wars.
        </p>
      </div>

      {error ? (
        <div className="status status--error">
          <span>Couldn&apos;t load the war data: {error}</span>
        </div>
      ) : (
        <Suspense fallback={<WarTimelineExplorer wars={wars} countries={countries} currentYear={currentYear} />}>
          <WarTimelineFromUrl wars={wars} countries={countries} currentYear={currentYear} />
        </Suspense>
      )}

      <p className="war-explorer__source">
        Wars that reached at least 1,000 battle-related deaths in a calendar year, since 1946 — not a full
        record of every armed conflict. Source:{" "}
        <a href="https://ucdp.uu.se/downloads/" target="_blank" rel="noreferrer">
          UCDP/PRIO Armed Conflict Dataset
        </a>{" "}
        (CC BY 4.0). See <a href="/data-sources">data sources</a> for full citations.
      </p>
    </>
  );
}
