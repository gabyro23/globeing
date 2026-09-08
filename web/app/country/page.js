import { getCountriesByContinent } from "../../lib/countryPageData";
import { getWorldOutline } from "../../lib/worldOutline";
import { pageMetadata } from "../../lib/seo";
import CountryDirectorySearch from "../../components/CountryDirectorySearch";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Countries",
  description:
    "Every country in the world, grouped by continent, with population, GDP, capital, and facts for the ones we've indexed so far.",
  path: "/country",
});

// Hub page for the /country/[slug] template: every country in the world,
// grouped by continent, so this is a real directory rather than stopping
// at whichever ones happen to have their own page. An indexed country
// (see lib/countryIndex.js's INDEXED_COUNTRY_ISO3 — most of them, as of
// this page's last big update) links straight to its own page; anything
// not indexed yet links to the Compare tool pre-filled with just that
// country instead of a dead end or a 404.
//
// This used to also show a separate "spotlight" grid up top for whichever
// few countries were indexed, back when that was just Japan and Burundi.
// Once nearly everything is indexed, that grid became a near-duplicate of
// the directory below it, so it's gone — the directory (with indexed
// countries as real links) already tells that story on its own.
export default async function CountryHubPage() {
  const continents = await getCountriesByContinent();
  const totalCount = continents.reduce((sum, g) => sum + g.countries.length, 0);
  const indexedCount = continents.reduce(
    (sum, g) => sum + g.countries.filter((c) => c.indexed).length,
    0
  );

  // Same background treatment as /country/[slug] (see that page's own
  // "Outline watermark" comment and .country-intro-wrap/.country-outline-bg
  // in globals.css) — a single country's silhouette there, the whole
  // world here, so this hub reads as the same family of page. Best-effort
  // like the per-country version: a hiccup fetching the world atlas
  // shouldn't break this page, the outline is purely decorative.
  let outline = null;
  try {
    outline = await getWorldOutline();
  } catch {
    outline = null;
  }

  return (
    <div className="country-intro-wrap">
      {outline && (
        <div className="country-outline-sticky" aria-hidden="true">
          <svg
            className="country-outline-bg"
            viewBox={outline.viewBox}
            preserveAspectRatio="xMaxYMid meet"
            focusable="false"
          >
            <path d={outline.pathD} />
          </svg>
        </div>
      )}

      <div className="country-intro-wrap__content">
        <div className="app-hero">
          <h1 className="app-hero__title">Countries</h1>
          <p className="app-hero__subtitle">
            Population, GDP, capital, currency, and facts for every country — organized by continent
            below.
          </p>
          <span className="app-hero__stat">
            {indexedCount} of {totalCount} countries have their own page so far · the rest link to
            Compare
          </span>
        </div>

        <section className="country-directory" aria-labelledby="all-countries-heading">
          <h2 id="all-countries-heading" className="country-directory__heading">
            All countries
          </h2>
          <CountryDirectorySearch continents={continents} />
        </section>
      </div>
    </div>
  );
}
