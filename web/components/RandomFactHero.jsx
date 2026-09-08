"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { factDateLabel } from "../lib/dailyFact";
import { flagForCountryName } from "../lib/randomFactFlags";
import { factCountryMeta } from "../lib/randomFactMeta";
import ShareButton from "./ShareButton";

// The "today's fact" hero card: browse day by day with the arrows, jump to
// a random one, or open the full country page. `facts` is the whole
// accumulated list (today first) from getAccumulatedFacts() — index 0
// always matches what the server rendered, so there's no hydration
// mismatch on first paint (same trick as HomeFactBand).
export default function RandomFactHero({ facts }) {
  const [index, setIndex] = useState(0);
  const fact = facts[index] || facts[0];
  const meta = useMemo(() => factCountryMeta(fact.country), [fact.country]);
  const isToday = index === 0;
  const flag = flagForCountryName(fact.country);

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setIndex((i) => Math.min(facts.length - 1, i + 1));
  }
  function goRandom() {
    if (facts.length <= 1) return;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * facts.length);
    setIndex(next);
  }

  return (
    <div className="random-fact-hero">
      <div className="random-fact-hero__stack">
      <div className="random-fact-hero__stack-layer random-fact-hero__stack-layer--1" aria-hidden="true" />
      <div className="random-fact-hero__stack-layer random-fact-hero__stack-layer--2" aria-hidden="true" />
      <div className="random-fact-hero__card">
        <div className="random-fact-hero__top">
          <span className="random-fact-hero__category">{fact.category}</span>
          <span className="random-fact-hero__position">
            {isToday ? "Today" : factDateLabel(fact.day)} · {index + 1} / {facts.length}
          </span>
        </div>

        <div className="random-fact-hero__body">
          <div className="random-fact-hero__main">
            <p className="random-fact-hero__text">{fact.fact}</p>
            <div className="random-fact-hero__meta">
              <span className="random-fact-hero__country">{fact.country}</span>
              {meta.region && (
                <>
                  <span className="random-fact-hero__dot" aria-hidden="true" />
                  <span className="random-fact-hero__continent">{meta.region}</span>
                </>
              )}
              <span className="random-fact-hero__dot" aria-hidden="true" />
              <a
                className="random-fact-hero__source"
                href={fact.source.url}
                target="_blank"
                rel="noreferrer"
              >
                Source: {fact.source.name}
              </a>
            </div>
          </div>
          {flag && (
            <div className="random-fact-hero__flag" aria-hidden="true">
              {flag}
            </div>
          )}
        </div>

        <div className="random-fact-hero__footer">
          {meta.href ? (
            <Link href={meta.href} className="btn-primary random-fact-hero__view">
              View {fact.country} →
            </Link>
          ) : (
            <span className="random-fact-hero__country-plain">{fact.country}</span>
          )}
          {meta.compareHref && (
            <Link href={meta.compareHref} className="btn-secondary">
              Compare {fact.country}
            </Link>
          )}
          <button type="button" className="btn-text" onClick={goRandom}>
            ↺ Another random one
          </button>
          <div className="random-fact-hero__spacer" />
          <ShareButton
            path="/random-facts"
            title={`Random fact — ${fact.country}`}
            text={`Did you know? ${fact.fact} — ${flag} ${fact.country}`}
            label="Share"
            className="share-button share-button--labeled random-fact-hero__share"
          />
        </div>
      </div>
      </div>

      <div className="random-fact-hero__nav">
        <button
          type="button"
          className="random-fact-hero__arrow"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Newer fact"
        >
          ←
        </button>
        <button
          type="button"
          className="random-fact-hero__arrow"
          onClick={goNext}
          disabled={index === facts.length - 1}
          aria-label="Older fact"
        >
          →
        </button>
        <span className="random-fact-hero__hint">Use the arrows to browse the archive</span>
      </div>
    </div>
  );
}
