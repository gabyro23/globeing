import Link from "next/link";
import { notFound } from "next/navigation";
import NewsArticleFeed from "../../../components/NewsArticleFeed";
import { pageMetadata } from "../../../lib/seo";
import { getNewsForCountry } from "../../../lib/newsRepo";
import { NEWS_COUNTRIES, newsCountryForIso3 } from "../../../lib/newsCountries";
import { metaForAlpha3 } from "../../../lib/countryMeta";
import { slugForIso3, iso3ForSlug } from "../../../lib/countryIndex";
import { formatRelativeTime } from "../../../lib/format";

// Same ISR cadence as the hub — matches the 3-hourly refresh cron.
export const revalidate = 10800;
// Only the covered countries exist here — same reasoning as
// /country/[slug]'s dynamicParams = false: anything else should 404
// rather than silently render an empty page.
export const dynamicParams = false;

export async function generateStaticParams() {
  return NEWS_COUNTRIES.map((c) => ({ country: slugForIso3(c.iso3) })).filter((p) => p.country);
}

function countryForSlug(slug) {
  const iso3 = iso3ForSlug(slug);
  return iso3 ? newsCountryForIso3(iso3) : null;
}

export async function generateMetadata({ params }) {
  const { country: slug } = await params;
  const country = countryForSlug(slug);
  if (!country) return {};

  return pageMetadata({
    title: `${country.name} Breaking News`,
    description: `Top breaking news headlines from ${country.name}, sourced only from its official press agency and trusted mainstream outlets — with a direct link to read each story at the source.`,
    path: `/noticias/${slug}`,
  });
}

export default async function NewsCountryPage({ params }) {
  const { country: slug } = await params;
  const country = countryForSlug(slug);
  if (!country) notFound();

  const { flag } = metaForAlpha3(country.iso3);
  const articles = await getNewsForCountry(country.iso3, 10);
  const [featured, ...rest] = articles;
  const updatedAgo = featured?.fetched_at ? formatRelativeTime(featured.fetched_at) : "not yet";

  return (
    <div className="news-country-page">
      <section className="news-hero">
        <div className="news-hero__glow" aria-hidden="true" />
        <div className="news-hero__inner">
          <Link href="/noticias" className="news-hero__back">
            ← All countries
          </Link>
          <div className="news-hero__live">
            <span className="news-hero__dot" aria-hidden="true" />
            Live · updated {updatedAgo}
          </div>
          <div className="news-hero__row">
            <div>
              <h1 className="news-hero__title">
                {flag} {country.name}
              </h1>
              <p className="news-hero__subtitle">
                Top headlines from {country.name}&apos;s official press agency and trusted
                mainstream outlets. Every headline links out to the original source.
              </p>
            </div>
          </div>
        </div>
      </section>

      <NewsArticleFeed country={{ ...country, flag }} featured={featured} rest={rest} />
    </div>
  );
}
