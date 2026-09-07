import Link from "next/link";
import { notFound } from "next/navigation";
import CountryHeroPictogram from "../../../components/CountryHeroPictogram";
import CountryPageIndex from "../../../components/CountryPageIndex";
import {
  formatArea,
  formatPopulation,
  formatPopulationCompact,
  formatCompareValue,
  formatIndicatorValue,
} from "../../../lib/format";
import { formatMultiplier } from "../../../lib/compareInsights";
import { pageMetadata, SITE_URL } from "../../../lib/seo";
import {
  getCountryPageData,
  isCountryIndexed,
  slugForIso3,
  flagForCountryName,
} from "../../../lib/countryPageData";
import { INDEXED_COUNTRY_ISO3 } from "../../../lib/countryIndex";

export const revalidate = 86400; // country stats change a few times a year at most
export const dynamicParams = false; // only the slugs from generateStaticParams exist — everything else 404s

export async function generateStaticParams() {
  return INDEXED_COUNTRY_ISO3.map((iso3) => ({ slug: slugForIso3(iso3) })).filter((p) => p.slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getCountryPageData(slugToIso3(slug));
  if (!data) return {};
  const { country } = data;
  const year = new Date().getFullYear();

  return pageMetadata({
    title: `${country.name} Facts, Population & GDP (${year})`,
    description: `${country.name} has a population of ${formatPopulationCompact(country.population)} and a GDP of ${formatCompareValue(country.gdp_usd, "US$")}. Explore capital, currency, rankings, and facts about ${country.name}.`,
    path: `/country/${slug}`,
    image: {
      url: `/country/${slug}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: `${country.name} — Globeing`,
    },
  });
}

// generateStaticParams/generateMetadata both need the iso3 for a slug,
// but only this route's own indexed list — resolving through
// lib/countryIndex directly keeps this file from importing Supabase
// twice for the same lookup.
function slugToIso3(slug) {
  for (const iso3 of INDEXED_COUNTRY_ISO3) {
    if (slugForIso3(iso3) === slug) return iso3;
  }
  return null;
}

export default async function CountryPage({ params }) {
  const { slug } = await params;
  const iso3 = slugToIso3(slug);
  const data = iso3 ? await getCountryPageData(iso3) : null;
  if (!data) notFound();

  const { country, profile, rankings, neighbors, comparisons, facts, outline, inGuessRoster } = data;
  const year = new Date().getFullYear();
  const updatedLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const faqItems = buildFaqItems({ country, profile, comparisons });
  const hasArea = Number(country.area_km2) > 0;

  // The page index only links to sections that actually render for this
  // country — a thin country profile (no rankings, no facts yet) skips
  // straight from Quick facts to the FAQ instead of linking to an empty
  // section. It sits below the hero, as a sticky left rail beside the
  // rest of the content (lib/globals.css .country-layout), highlighting
  // whichever one is in view (components/CountryPageIndex.jsx).
  const tocItems = [
    { id: "quick-facts-heading", label: "Quick facts" },
    { id: "pictogram-heading", label: "At human scale" },
    rankings.length > 0 && { id: "rankings-heading", label: "Rank in the world" },
    comparisons.length > 0 && { id: "comparisons-heading", label: "Compare" },
    facts.length > 0 && { id: "facts-heading", label: "Facts" },
    neighbors.length > 0 && { id: "neighbors-heading", label: "Neighbors" },
    hasArea && { id: "fill-the-country-heading", label: "Fill the country" },
    { id: "faq-heading", label: "FAQ" },
  ].filter(Boolean);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Countries", item: `${SITE_URL}/country` },
      { "@type": "ListItem", position: 3, name: country.name, item: `${SITE_URL}/country/${slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="country-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/country">Countries</Link> <span aria-hidden="true">›</span>{" "}
        <span aria-current="page">{country.name}</span>
      </nav>

      {/* Outline watermark spans the hero AND everything below it (the
          whole .country-layout), not just the header — see
          .country-intro-wrap / .country-outline-bg in globals.css. */}
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
          <div className="country-layout">
            <div className="app-hero country-hero">
              <div className="country-hero__flag" aria-hidden="true">
                {country.flag}
              </div>
              <div>
                <h1 className="app-hero__title">{country.name}</h1>
                {profile?.officialName && (
                  <p className="country-hero__official">{profile.officialName}</p>
                )}
                <p className="app-hero__subtitle">
                  Population, GDP, and key facts about {country.name} — updated for {year}.
                </p>
                <div className="country-hero__chips">
                  <span className="country-hero__chip">
                    Capital · {(country.capital || "—").toUpperCase()}
                  </span>
                  <span className="country-hero__chip">
                    Continent · {(country.region || "—").toUpperCase()}
                  </span>
                  <span className="country-hero__chip">ISO · {country.iso3}</span>
                </div>
              </div>
            </div>

            <CountryPageIndex items={tocItems} ariaLabel={`${country.name} page sections`} />

            <div className="country-layout__main">
              <section className="country-section" aria-labelledby="quick-facts-heading">
                <h2 id="quick-facts-heading" className="country-section__title">
                  {country.name} quick facts
                </h2>
                <dl className="country-quickfacts">
                  <div>
                    <dt>Population</dt>
                    <dd>{formatPopulation(country.population)}</dd>
                  </div>
                  <div>
                    <dt>Area</dt>
                    <dd>{formatArea(country.area_km2)}</dd>
                  </div>
                  <div>
                    <dt>Population density</dt>
                    <dd>{formatIndicatorValue(country.population_density, "people/km²")}</dd>
                  </div>
                  <div>
                    <dt>GDP</dt>
                    <dd>{formatCompareValue(country.gdp_usd, "US$")}</dd>
                  </div>
                  <div>
                    <dt>GDP per capita</dt>
                    <dd>{formatIndicatorValue(country.gdp_per_capita_usd, "US$")}</dd>
                  </div>
                  <div>
                    <dt>Capital</dt>
                    <dd>{country.capital || "—"}</dd>
                  </div>
                  {profile?.currency && (
                    <div>
                      <dt>Currency</dt>
                      <dd>
                        {profile.currency.name} ({profile.currency.symbol}, {profile.currency.code})
                        {(() => {
                          // A handful of countries legally use more than one
                          // currency (Panama, the Bahamas, Bhutan, ...) —
                          // profile.currencies is the full list, so show
                          // whichever entries aren't the one already named
                          // above instead of hiding that they exist.
                          const others = (profile.currencies || []).filter(
                            (c) => !c.includes(`(${profile.currency.code})`)
                          );
                          return (
                            others.length > 0 && (
                              <span className="country-quickfacts__note">
                                {" "}
                                · also legal tender: {others.join(", ")}
                              </span>
                            )
                          );
                        })()}
                      </dd>
                    </div>
                  )}
                  {profile?.languages?.length > 0 && (
                    <div>
                      <dt>{profile.languages.length > 1 ? "Languages" : "Language"}</dt>
                      <dd>{profile.languages.join(", ")}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section
                className="country-section country-section--pictogram country-section--plain"
                aria-labelledby="pictogram-heading"
              >
                <h2 id="pictogram-heading" className="country-section__title">
                  {country.name} at human scale
                </h2>
                <CountryHeroPictogram country={country} />
              </section>

              {rankings.length > 0 && (
                <section className="country-section country-section--plain" aria-labelledby="rankings-heading">
                  <h2 id="rankings-heading" className="country-section__title">
                    Where does {country.name} rank in the world?
                  </h2>
                  <ul className="country-rank-list">
                    {rankings.map((r) => {
                      // How close to #1 this ranking is, as a fill percentage
                      // (100% = best in the world, 0% = last place).
                      const pct =
                        r.total > 1 ? Math.round((1 - (r.position - 1) / (r.total - 1)) * 100) : 100;
                      return (
                        <li key={r.key}>
                          <Link href={`/rankings?indicator=${r.key}`} className="country-rank-row">
                            <span className="country-rank-row__label">{r.label}</span>
                            <span className="country-rank-row__track" aria-hidden="true">
                              <span className="country-rank-row__fill" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="country-rank-row__value">#{r.position}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {comparisons.length > 0 && (
                <section className="country-section country-section--plain" aria-labelledby="comparisons-heading">
                  <h2 id="comparisons-heading" className="country-section__title">
                    Compare {country.name} with other countries
                  </h2>
                  <div className="country-comparisons">
                    {comparisons.map((other) => {
                      const popMult = formatMultiplier(
                        Math.max(Number(country.population), Number(other.population)) /
                          Math.max(Math.min(Number(country.population), Number(other.population)), 1)
                      );
                      return (
                        <Link
                          key={other.iso3}
                          href={`/compare?countries=${country.iso3},${other.iso3}`}
                          className="country-comparison-card"
                        >
                          <span className="country-comparison-card__flags">
                            {country.flag} vs {other.flag}
                          </span>
                          <span className="country-comparison-card__title">
                            Compare {country.name} vs {other.name}
                          </span>
                          {popMult && (
                            <span className="country-comparison-card__stat">
                              {popMult} difference in population
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                  <Link href={`/compare?countries=${country.iso3}`} className="country-compare-cta">
                    Compare {country.name} with any country →
                  </Link>
                </section>
              )}

              {facts.length > 0 && (
                <section className="country-section country-section--plain" aria-labelledby="facts-heading">
                  <h2 id="facts-heading" className="country-section__title">
                    Everything we know about {country.name}
                  </h2>
                  <div className="fact-archive__grid">
                    {facts.map((f) => (
                      <article className="fact-card" key={f.day}>
                        <div className="fact-card__header">
                          <span className="fact-card__category">{f.category}</span>
                        </div>
                        <p className="fact-card__text">{f.fact}</p>
                        <div className="fact-card__footer">
                          <span className="fact-card__country">
                            {flagForCountryName(f.country)} {f.country}
                          </span>
                          <a className="fact-card__source" href={f.source.url} target="_blank" rel="noreferrer">
                            {f.source.name}
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {neighbors.length > 0 && (
                <section className="country-section country-section--plain" aria-labelledby="neighbors-heading">
                  <h2 id="neighbors-heading" className="country-section__title">
                    Countries near {country.name}
                  </h2>
                  <div className="country-neighbors-grid">
                    {neighbors.map((n) => {
                      const href = isCountryIndexed(n.iso3)
                        ? `/country/${slugForIso3(n.iso3)}`
                        : `/compare?countries=${country.iso3},${n.iso3}`;
                      return (
                        <Link key={n.iso3} href={href} className="country-neighbor-card">
                          <span aria-hidden="true">{n.flag}</span>
                          <span>{n.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {hasArea && (
                <section className="country-cta" aria-labelledby="fill-the-country-heading">
                  <h2 id="fill-the-country-heading" className="country-cta__title">
                    How many countries do you think {country.name} could fit?
                  </h2>
                  <p className="country-cta__subtitle">
                    Pour other countries into {country.name}&apos;s own outline, by real area, and
                    see how many it takes to fill it up.
                  </p>
                  <Link
                    href={`/compare/fill-the-country?target=${country.iso3}`}
                    className="country-cta__button"
                  >
                    Fill the Country →
                  </Link>
                </section>
              )}

              <section className="country-section country-section--plain" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="country-section__title">
                  Frequently asked questions about {country.name}
                </h2>
                <div className="country-faq">
                  {faqItems.map((item) => (
                    <div className="country-faq-item" key={item.question}>
                      <h3 className="country-faq-item__question">{item.question}</h3>
                      <p className="country-faq-item__answer">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              {inGuessRoster && (
                <section className="country-cta" aria-labelledby="cta-heading">
                  <h2 id="cta-heading" className="country-cta__title">
                    Think you can guess {country.name} from its silhouette?
                  </h2>
                  <p className="country-cta__subtitle">
                    {country.name} is one of the countries in our daily silhouette-guessing game.
                  </p>
                  <Link href="/guess-the-country" className="country-cta__button">
                    Play Guess the Country →
                  </Link>
                </section>
              )}

              <p className="country-source-note">
                Data from the World Bank, updated {updatedLabel}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function buildFaqItems({ country, profile, comparisons }) {
  const items = [
    {
      question: `What is the capital of ${country.name}?`,
      answer: `The capital of ${country.name} is ${country.capital || "not available"}.`,
    },
    {
      question: `What is ${country.name}'s population?`,
      answer: `${country.name} has a population of ${formatPopulation(country.population)}.`,
    },
    {
      question: `What is ${country.name}'s GDP per capita?`,
      answer: `${country.name}'s GDP per capita is ${formatIndicatorValue(country.gdp_per_capita_usd, "US$")}.`,
    },
  ];

  if (profile?.currency) {
    items.push({
      question: `What is the currency of ${country.name}?`,
      answer: `The currency of ${country.name} is the ${profile.currency.name} (${profile.currency.code}).`,
    });
  }

  if (comparisons[0]) {
    const other = comparisons[0];
    const areaA = Number(country.area_km2) || 0;
    const areaB = Number(other.area_km2) || 0;
    const bigger = areaA >= areaB ? country : other;
    const smaller = bigger === country ? other : country;
    const mult = formatMultiplier(Math.max(areaA, areaB, 1) / Math.max(Math.min(areaA, areaB), 1));
    items.push({
      question: `Is ${country.name} bigger than ${other.name}?`,
      answer: mult
        ? `${bigger.name} is about ${mult} the size of ${smaller.name} by land area.`
        : `${country.name} and ${other.name} are similar in land area.`,
    });
  }

  return items;
}
