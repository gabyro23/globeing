import Link from "next/link";
import { getIndexedCountries, getCountriesByContinent } from "../../lib/countryPageData";
import { formatPopulationCompact, formatArea } from "../../lib/format";
import { pageMetadata } from "../../lib/seo";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Countries",
  description:
    "Every country in the world, grouped by continent, with population, GDP, capital, and facts for the ones we've indexed so far.",
  path: "/country",
});

// Hub page for the /country/[slug] template. The top spotlights whichever
// countries currently have their own page (small today — see
// lib/countryIndex.js's INDEXED_COUNTRY_ISO3, rolled out one at a time).
// Below that, every country in the world is listed, grouped by continent,
// so the page is a real directory instead of stopping at the handful
// that are indexed so far. A country without its own page yet links to
// the Compare tool pre-filled with just that country instead of a dead
// end or a 404.
export default async function CountryHubPage() {
  const [spotlight, continents] = await Promise.all([getIndexedCountries(), getCountriesByContinent()]);
  const totalCount = continents.reduce((sum, g) => sum + g.countries.length, 0);

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Countries</h1>
        <p className="app-hero__subtitle">
          Population, GDP, capital, currency, and facts for every country we&apos;ve indexed — plus a
          full directory of all {totalCount} countries, grouped by continent.
        </p>
        <span className="app-hero__stat">
          {spotlight.length} {spotlight.length === 1 ? "country" : "countries"} indexed so far · more
          added regularly
        </span>
      </div>

      <div className="country-index-grid">
        {spotlight.map((c) => (
          <Link key={c.iso3} href={`/country/${c.slug}`} className="country-index-card">
            <span className="country-index-card__flag" aria-hidden="true">
              {c.flag}
            </span>
            <span className="country-index-card__name">{c.name}</span>
            <span className="country-index-card__stats">
              {formatPopulationCompact(c.population)} people · {formatArea(c.area_km2)}
            </span>
          </Link>
        ))}
      </div>

      <section className="country-directory" aria-labelledby="all-countries-heading">
        <h2 id="all-countries-heading" className="country-directory__heading">
          All countries
        </h2>
        {continents.map((group) => (
          <div key={group.name} className="country-directory__continent">
            <h3 className="country-directory__continent-title">
              {group.name}
              <span className="country-directory__continent-count">{group.countries.length}</span>
            </h3>
            <div className="country-directory__grid">
              {group.countries.map((c) =>
                c.indexed ? (
                  <Link key={c.iso3} href={`/country/${c.slug}`} className="country-directory__item">
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.name}</span>
                  </Link>
                ) : (
                  <Link
                    key={c.iso3}
                    href={`/compare?countries=${c.iso3}`}
                    className="country-directory__item country-directory__item--pending"
                    title={`${c.name} doesn't have its own page yet — compare it with any other country`}
                  >
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.name}</span>
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
