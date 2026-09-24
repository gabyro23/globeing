"use client";

import { useState } from "react";
import NewsCard from "./NewsCard";
import { formatRelativeTime } from "../lib/format";
import { sourceInitial } from "../lib/newsCountries";

// Cross-country feed shown on the /noticias hub, before a visitor picks a
// specific country — same featured + grid shape as NewsArticleFeed, but
// each card carries a country tag (via NewsCard's `place` prop) since the
// stories are mixed across countries.
export default function NewsGlobalFeed({ featured, rest }) {
  const [showImages, setShowImages] = useState(true);

  if (!featured) return null;

  return (
    <div className="news-country-body">
      <div className="news-country-body__topline">
        <h2 className="news-country-body__heading">Latest headlines</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "var(--muted)" }}>
          <span>{(featured ? 1 : 0) + rest.length} headlines · sorted by newest</span>
          <button type="button" className="news-toggle-images" onClick={() => setShowImages((v) => !v)}>
            {showImages ? "Hide photos" : "Show photos"}
          </button>
        </div>
      </div>

      <article className="news-featured">
        {showImages && (
          <div className="news-featured__media">
            {featured.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source domains.
              <img src={featured.image_url} alt="" />
            ) : null}
          </div>
        )}
        <div className="news-featured__body">
          <div className="news-featured__meta">
            <span className="news-featured__avatar" aria-hidden="true">
              {sourceInitial(featured.source_name)}
            </span>
            <span className="news-featured__source">{featured.source_name}</span>
            <span className="news-featured__dot" aria-hidden="true">
              /
            </span>
            <span>{formatRelativeTime(featured.published_at)}</span>
            <span className="news-featured__dot" aria-hidden="true">
              /
            </span>
            <span>
              {featured.place.flag} {featured.place.name}
            </span>
          </div>
          <h3 className="news-featured__title">{featured.title}</h3>
          {featured.description && <p className="news-featured__summary">{featured.description}</p>}
          <a className="news-featured__cta" href={featured.link} target="_blank" rel="noopener noreferrer">
            Read on {featured.source_domain} →
          </a>
        </div>
      </article>

      <div className="news-grid">
        {rest.map((article) => (
          <NewsCard key={`${article.place.iso3}-${article.id}`} article={article} showImage={showImages} place={article.place} />
        ))}
      </div>

      <p className="news-country-body__footnote">
        Refreshed every 3 hours from official press agencies and trusted outlets. Pick a country
        above for its full feed.
      </p>
    </div>
  );
}
