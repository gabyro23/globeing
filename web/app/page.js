import Link from "next/link";
import LandingMap from "../components/LandingMap";
import HomeFactBand from "../components/HomeFactBand";
import { ChooseIcon, CompareIcon, LearnIcon, HumanScaleIcon } from "../components/HomeIcons";
import { getAccumulatedFacts } from "../lib/dailyFact";
import { INDICATORS } from "../lib/indicators";

// Regenerate at most hourly so "today's fact" rolls over to the next day
// without needing the whole page to be dynamically rendered on every request.
export const revalidate = 3600;

const FEATURES = [
  {
    key: "choose",
    Icon: ChooseIcon,
    title: "Choose",
    text: "Tap two countries on the map, or search for them by name.",
  },
  {
    key: "compare",
    Icon: CompareIcon,
    title: "Compare",
    text: "Population, GDP, surface and more, drawn at real scale side by side.",
  },
  {
    key: "learn",
    Icon: LearnIcon,
    title: "Learn",
    text: "Keep the context: what the numbers mean and where they come from.",
  },
];

// Metric highlighted in the "Example" panel below — keep in sync with the
// example copy/chart, which compares this indicator.
const EXAMPLE_INDICATOR_KEY = "gdp_per_capita_usd";

// Globeing's public landing page (ported from a Claude Design design). The
// functional app (search + interactive map + comparison) lives at /compare.
export default function Home() {
  const facts = getAccumulatedFacts();

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-hero__content">
          <h1 className="landing-hero__title">Two countries. One honest picture of how they compare.</h1>
          <Link href="/compare" className="btn-primary landing-hero__cta">
            Start comparing →
          </Link>
          <div className="landing-hero__note">
            <HumanScaleIcon />
            <span>Every number drawn at human scale</span>
          </div>
        </div>
        <LandingMap />
      </div>

      <HomeFactBand facts={facts} />

      <section className="home-features">
        {FEATURES.map(({ key, Icon, title, text }) => (
          <div className="home-feature-card" key={key}>
            <Icon />
            <h3 className="home-feature-card__title">{title}</h3>
            <p className="home-feature-card__text">{text}</p>
          </div>
        ))}
      </section>

      <section className="home-explore">
        <div className="home-metrics">
          <span className="home-metrics__eyebrow">Available metrics</span>
          <div className="home-metrics__pills">
            {INDICATORS.map((ind) => (
              <span
                key={ind.key}
                className={"home-metrics__pill" + (ind.key === EXAMPLE_INDICATOR_KEY ? " is-active" : "")}
              >
                {ind.label}
              </span>
            ))}
          </div>
        </div>

        <div className="home-example">
          <span className="home-example__eyebrow">Example</span>
          <div className="home-example__callout">
            <span className="home-example__dot" aria-hidden="true" />
            <p>United Kingdom has 1.5× more GDP per capita than Spain.</p>
          </div>
          <div className="home-example__chart">
            <span className="home-example__chart-title">GDP per capita (US$)</span>
            <div className="home-example__bars">
              <div className="home-example__bar-row">
                <span className="home-example__bar-label">🇬🇧 United Kingdom</span>
                <div className="home-example__bar-track">
                  <div className="home-example__bar-fill" style={{ width: "100%" }} />
                </div>
                <span className="home-example__bar-value">US$ 53,341</span>
              </div>
              <div className="home-example__bar-row">
                <span className="home-example__bar-label">🇪🇸 Spain</span>
                <div className="home-example__bar-track">
                  <div className="home-example__bar-fill" style={{ width: "66%" }} />
                </div>
                <span className="home-example__bar-value">US$ 35,327</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
