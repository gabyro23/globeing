"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const AUTO_ADVANCE_MS = 6000;

// Rotating "last minute" ticker — one headline at a time, auto-advancing
// every 6s with a progress bar, pausable on hover, steppable with the
// prev/next buttons. Ports the counter + progress-bar mechanics from the
// updated "Breaking News.dc.html" mockup (replaces the old CSS marquee).
export default function NewsTicker({ items }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  const count = items.length;

  useEffect(() => {
    if (paused || count <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
      setTick((t) => t + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, count]);

  if (count === 0) return null;

  function step(delta) {
    setIndex((i) => (i + delta + count) % count);
    setTick((t) => t + 1);
  }

  const current = items[index];
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;

  return (
    <div className="news-ticker" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="news-ticker__row">
        <div className="news-ticker__label">
          <span className="news-ticker__label-dot" aria-hidden="true" />
          Last minute
        </div>

        <Link href={`/noticias/${current.slug}`} className="news-ticker__content" key={current.key}>
          <span className="news-ticker__meta">
            <span aria-hidden="true">{current.flag}</span>
            <span className="news-ticker__country">{current.name}</span>
          </span>
          <span className="news-ticker__title">{current.title}</span>
        </Link>

        <div className="news-ticker__nav">
          <span className="news-ticker__counter">{counter}</span>
          <button type="button" className="news-ticker__btn" onClick={() => step(-1)} aria-label="Previous headline" disabled={count <= 1}>
            ‹
          </button>
          <button type="button" className="news-ticker__btn" onClick={() => step(1)} aria-label="Next headline" disabled={count <= 1}>
            ›
          </button>
        </div>
      </div>

      {count > 1 && (
        <div className="news-ticker__progress-track">
          <div
            key={tick}
            className="news-ticker__progress-bar"
            style={{ animationPlayState: paused ? "paused" : "running", animationDuration: `${AUTO_ADVANCE_MS}ms` }}
          />
        </div>
      )}
    </div>
  );
}
