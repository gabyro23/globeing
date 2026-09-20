import { formatRelativeTime } from "../lib/format";
import { sourceInitial } from "../lib/newsCountries";

// A single headline in the /noticias/[country] grid (everything after the
// featured top story) — plain link with an optional thumbnail, matching
// Gaby's "Breaking News.dc.html" mockup. The featured/top story itself is
// rendered separately in NewsArticleFeed (it's a different enough layout
// — big image, summary, CTA button — that sharing this component would
// mean a pile of variant props instead of two clear pieces of markup).
export default function NewsCard({ article, showImage }) {
  return (
    <a className="news-grid__item" href={article.link} target="_blank" rel="noopener noreferrer">
      {showImage && (
        <div className="news-grid__media">
          {article.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source domains; not worth a remotePatterns entry per outlet.
            <img src={article.image_url} alt="" loading="lazy" />
          ) : null}
        </div>
      )}
      <span className="news-grid__title">{article.title}</span>
      <span className="news-grid__meta">
        <span className="news-grid__avatar" aria-hidden="true">
          {sourceInitial(article.source_name)}
        </span>
        <span className="news-grid__source">{article.source_name}</span>
        <span aria-hidden="true">/</span>
        <span>{formatRelativeTime(article.published_at)}</span>
      </span>
    </a>
  );
}
