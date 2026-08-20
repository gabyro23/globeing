import Link from "next/link";
import LandingMap from "../components/LandingMap";
import { getTodayFact } from "../lib/dailyFact";

// Regenerate at most hourly so "today's fact" rolls over to the next day
// without needing the whole page to be dynamically rendered on every request.
export const revalidate = 3600;

// Globeing's public landing page (ported from Home.html, a Claude Design
// design). The functional app (search + interactive map + comparison)
// lives at /compare.
export default function Home() {
  const fact = getTodayFact();

  return (
    <div className="landing-page">
      <header className="landing-hero">
        <h1 className="landing-hero__title">Choose, Compare, and Learn</h1>
        <p className="landing-hero__lede">
          Data can also be fun, play with our interactive tool and discover what makes each country
          unique.
        </p>
        <Link href="/compare" className="btn-primary landing-hero__cta">
          Start comparing →
        </Link>
      </header>

      <LandingMap />

      <p className="landing-legend">Hover a card to lift it · six countries, three indicators</p>

      <section className="daily-fact">
        <div className="daily-fact__card">
          <span className="daily-fact__eyebrow">Random fact of the day</span>
          <p className="daily-fact__text">
            {fact.fact} <span className="daily-fact__country">— {fact.country}</span>
          </p>
          <div className="daily-fact__footer">
            <a
              className="daily-fact__source"
              href={fact.source.url}
              target="_blank"
              rel="noreferrer"
            >
              Source: {fact.source.name}
            </a>
            <Link href="/random-facts" className="daily-fact__more">
              See all random facts →
            </Link>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        <p>Population, area, and economic data from public sources (World Bank).</p>
      </footer>
    </div>
  );
}
