import Link from "next/link";
import { getAllWars } from "../../lib/countryPageData";
import { buildWarTimeline } from "../../lib/warTimeline";
import { pageMetadata } from "../../lib/seo";
import WarTimelineExplorer from "../../components/WarTimelineExplorer";

// The data changes once a year (UCDP publishes annually), so a daily
// revalidate is plenty and keeps the page fully server-rendered/indexable.
export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "War Timeline",
  description:
    "Every war since 1946 on one timeline — who fought, against whom, and for how long. Filter by continent, type of war, country or armed group.",
  path: "/war-timeline",
});

// Layout follows the "War Timeline" design in the project: filters, an
// overview card (headline numbers + wars active each year), then every
// war as a bar on a shared 1946–today axis, grouped by continent. The
// interactive part lives in components/WarTimelineExplorer.jsx; the war
// list itself is built server-side (lib/warTimeline.js) so the full,
// unfiltered timeline is in the HTML for crawlers.
export default async function WarTimelinePage() {
  let wars = [];
  let error = null;
  try {
    wars = buildWarTimeline(await getAllWars());
  } catch (err) {
    error = err.message;
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="wt-page">
      <div className="app-hero">
        <h1 className="app-hero__title">War Timeline</h1>
        <p className="app-hero__subtitle">
          Every war since 1946 on a single timeline — who fought, against whom, and for how long. Filter
          by continent, type of war, or the country or group that fought.
        </p>
      </div>

      {error ? (
        <div className="status status--error">
          <span>Couldn&apos;t load the war data: {error}</span>
        </div>
      ) : (
        <WarTimelineExplorer wars={wars} currentYear={currentYear} />
      )}

      <footer className="wt-source">
        <span>
          Wars that reached at least 1,000 battle-related deaths in a calendar year, since 1946 — not a
          full record of every armed conflict. Each war is listed once, under the continent where it was
          fought; a +tag marks other continents whose countries took part.
        </span>
        <span>
          Source:{" "}
          <a href="https://ucdp.uu.se/downloads/" target="_blank" rel="noreferrer">
            UCDP/PRIO Armed Conflict Dataset
          </a>{" "}
          (CC BY 4.0). See <Link href="/data-sources">data sources</Link> for full citations.
        </span>
      </footer>
    </div>
  );
}
