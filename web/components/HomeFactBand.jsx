"use client";

import { useState } from "react";
import Link from "next/link";
import ShareButton from "./ShareButton";
import { flagForCountryName } from "../lib/randomFactFlags";

// Decorative floating badge — same flat "personita" color language as the
// rest of the site's hand-authored icons, fixed (non-theme-aware).
function FactBadgeIcon() {
  return (
    <svg className="home-fact__badge" viewBox="0 0 60 120" aria-hidden="true">
      <polygon
        points="30,61 36.2,77.5 53.8,78.3 40,89.2 44.7,106.2 30,96.5 15.3,106.2 20,89.2 6.2,78.3 23.8,77.5"
        fill="#C9971F"
        transform="translate(2 2)"
      />
      <polygon
        points="30,61 36.2,77.5 53.8,78.3 40,89.2 44.7,106.2 30,96.5 15.3,106.2 20,89.2 6.2,78.3 23.8,77.5"
        fill="#E8B93C"
      />
    </svg>
  );
}

// The homepage's "Random fact of the day" band. `facts` is the accumulated,
// already-revealed list from getAccumulatedFacts() (today first). Today's
// fact is shown by default; "Another fact" picks a different one from that
// same already-revealed set — it never reaches ahead to a future day.
// Random.js is only touched inside the click handler (after mount), never
// during render, so there's no server/client hydration mismatch.
export default function HomeFactBand({ facts }) {
  const [index, setIndex] = useState(0);
  const fact = facts[index] || facts[0];

  function handleAnother() {
    if (facts.length <= 1) return;
    let next = index;
    while (next === index) {
      next = Math.floor(Math.random() * facts.length);
    }
    setIndex(next);
  }

  if (!fact) return null;

  return (
    <section className="home-fact">
      <div className="home-fact__inner">
        <FactBadgeIcon />

        <div className="home-fact__body">
          <div className="home-fact__top">
            <span className="home-fact__eyebrow">Random fact of the day</span>
            <ShareButton
              path="/random-facts"
              title={`Random fact — ${fact.country}`}
              text={`Did you know? ${fact.fact} — ${flagForCountryName(fact.country)} ${fact.country}`}
              className="share-button share-button--icon home-fact__share"
            />
          </div>
          <p className="home-fact__text">
            {fact.fact}{" "}
            <span className="home-fact__country">
              — {flagForCountryName(fact.country)} {fact.country}
            </span>
          </p>
          <div className="home-fact__footer">
            <a className="home-fact__source" href={fact.source.url} target="_blank" rel="noreferrer">
              Source: {fact.source.name}
            </a>
            <Link href="/random-facts" className="home-fact__archive-link">
              See all random facts →
            </Link>
          </div>
        </div>

        <button type="button" className="home-fact__cta" onClick={handleAnother}>
          Another fact
        </button>
      </div>
    </section>
  );
}
