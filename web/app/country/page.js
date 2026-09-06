import Link from "next/link";
import { getIndexedCountries } from "../../lib/countryPageData";
import { formatPopulationCompact, formatArea } from "../../lib/format";
import { pageMetadata } from "../../lib/seo";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Countries",
  description:
    "Population, GDP, capital, currency, and key facts for every country we've indexed — starting with Japan and growing.",
  path: "/country",
});

// Hub page for the /country/[slug] template: lists every country that
// currently has its own page. Small today (just Japan) — every future
// country page gets added here the moment it's published, so this is
// never a dead end and the BreadcrumbList on each country page has a
// real "Countries" step to point to.
export default async function CountryHubPage() {
  const countries = await getIndexedCountries();

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Countries</h1>
        <p className="app-hero__subtitle">
          Population, GDP, capital, currency, and facts for every country we&apos;ve indexed.
        </p>
        <span className="app-hero__stat">
          {countries.length} {countries.length === 1 ? "country" : "countries"} so far · more added regularly
        </span>
      </div>

      <div className="country-index-grid">
        {countries.map((c) => (
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
    </>
  );
}
