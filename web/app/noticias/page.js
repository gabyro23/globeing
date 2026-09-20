import NewsCountryPicker from "../../components/NewsCountryPicker";
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

// Hub page: dark hero + live ticker + search/region filter + country
// rail — ports Gaby's "Breaking News.dc.html" mockup. Each rail pill
// links to its own /noticias/[country] page (real navigation, not a
// client-side switch) so every country keeps an indexable URL — see the
// project spec's "Cambio de alcance" note.
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

  const tickerItems = countries
    .filter((c) => c.articles.length > 0)
    .map((c) => ({
      key: c.iso3,
      flag: c.flag,
      name: c.name,
      title: c.articles[0].title,
      link: c.articles[0].link,
    }));
  // Duplicated so the CSS marquee (translateX -50%) loops seamlessly —
  // see .news-ticker__track in globals.css. Only rendered at all once
  // there's at least one headline to show.
  const tickerLoop = tickerItems.length > 0 ? tickerItems.concat(tickerItems) : [];

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

        {tickerLoop.length > 0 && (
          <div className="news-ticker">
            <div className="news-ticker__row">
              <div className="news-ticker__label">Latest</div>
              <div className="news-ticker__viewport">
                <div className="news-ticker__track">
                  {tickerLoop.map((t, i) => (
                    <a key={`${t.key}-${i}`} className="news-ticker__item" href={t.link} target="_blank" rel="noopener noreferrer">
                      <span aria-hidden="true">{t.flag}</span>
                      <span className="news-ticker__country">{t.name.toUpperCase()}</span>
                      {t.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <NewsCountryPicker countries={countries} />
    </div>
  );
}
