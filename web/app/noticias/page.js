import NewsCountryPicker from "../../components/NewsCountryPicker";
import NewsTicker from "../../components/NewsTicker";
import NewsGlobalFeed from "../../components/NewsGlobalFeed";
import { pageMetadata } from "../../lib/seo";
import { getNewsGroupedByCountry } from "../../lib/newsRepo";
import { NEWS_COUNTRIES } from "../../lib/newsCountries";
import { metaForAlpha3 } from "../../lib/countryMeta";
import { slugForIso3 } from "../../lib/countryIndex";
import { formatRelativeTime } from "../../lib/format";

// Re-render at most every 3 hours — matches the refresh cron (see
// app/api/news/refresh/route.js) so this page is never stale in a way
// visitors would notice, without rebuilding on every request.
export const revalidate = 10800;

export const metadata = pageMetadata({
  title: "Breaking News by Country",
  description:
    "Top breaking news from official and trusted sources in Panama and Uruguay — pick a country from the list or search. More countries coming soon.",
  path: "/noticias",
});

// Hub page: dark hero + rotating ticker + a cross-country feed of real
// headlines + search/region filter + country rail — ports Gaby's updated
// "Breaking News.dc.html" mockup. Each rail pill links to its own
// /noticias/[country] page (real navigation, not a client-side switch) so
// every country keeps an indexable URL — see the project spec's "Cambio
// de alcance" note.
export default async function NewsHubPage() {
  const newsByIso3 = await getNewsGroupedByCountry();

  const countries = NEWS_COUNTRIES.map((c) => ({
    ...c,
    ...metaForAlpha3(c.iso3),
    slug: slugForIso3(c.iso3),
    articles: newsByIso3.get(c.iso3) || [],
  }));

  const allArticles = countries.flatMap((c) => c.articles);
  const storyCount = allArticles.length;
  const sourceCount = new Set(allArticles.map((a) => a.source_name)).size;

  const mostRecent = allArticles.reduce((latest, a) => {
    if (!a.fetched_at) return latest;
    return !latest || a.fetched_at > latest ? a.fetched_at : latest;
  }, null);
  const updatedAgo = mostRecent ? formatRelativeTime(mostRecent) : "not yet";

  // Ticker: top (most recent) headline per country, newest first.
  const tickerItems = countries
    .filter((c) => c.articles.length > 0)
    .map((c) => ({
      key: c.iso3,
      flag: c.flag,
      name: c.name,
      slug: c.slug,
      title: c.articles[0].title,
      link: c.articles[0].link,
      published_at: c.articles[0].published_at,
    }))
    .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));

  // Global feed: interleave each country's articles by rank (1st of PAN,
  // 1st of URY, 2nd of PAN, 2nd of URY, ...) so one country with more
  // headlines doesn't crowd out the others, then tag each with its
  // country for the "place" chip. Featured = the most recent overall.
  const place = (c) => ({ flag: c.flag, name: c.name, slug: c.slug, iso3: c.iso3 });
  const maxLen = Math.max(0, ...countries.map((c) => c.articles.length));
  const interleaved = [];
  for (let rank = 0; rank < maxLen; rank += 1) {
    for (const c of countries) {
      if (c.articles[rank]) interleaved.push({ ...c.articles[rank], place: place(c) });
    }
  }
  interleaved.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
  const [globalFeatured, ...globalRest] = interleaved;

  return (
    <div className="news-hub">
      <section className="news-hero">
        <div className="news-hero__glow" aria-hidden="true" />
        <div className="news-hero__inner">
          <div className="news-hero__live">
            <span className="news-hero__dot" aria-hidden="true" />
            Live · updated {updatedAgo}
          </div>
          <div className="news-hero__row">
            <div>
              <h1 className="news-hero__title">Breaking News by Country</h1>
              <p className="news-hero__subtitle">
                Headlines from official press agencies and verified outlets. No rumors, no
                reproduced articles — just the story and a link to the source.
              </p>
            </div>
            <div className="news-hero__stats">
              <div>
                <div className="news-hero__stat-value">{countries.length}</div>
                <div className="news-hero__stat-label">Countries</div>
              </div>
              <div>
                <div className="news-hero__stat-value">{storyCount}</div>
                <div className="news-hero__stat-label">Headlines</div>
              </div>
              <div>
                <div className="news-hero__stat-value">{sourceCount}</div>
                <div className="news-hero__stat-label">Sources</div>
              </div>
            </div>
          </div>
        </div>

        <NewsTicker items={tickerItems} />
      </section>

      <NewsCountryPicker countries={countries} />

      <NewsGlobalFeed featured={globalFeatured} rest={globalRest} />
    </div>
  );
}
