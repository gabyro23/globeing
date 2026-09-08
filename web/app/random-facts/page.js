import { getAccumulatedFacts, factDateLabel } from "../../lib/dailyFact";
import { factCountryMeta } from "../../lib/randomFactMeta";
import { pageMetadata } from "../../lib/seo";
import FactArchive from "../../components/FactArchive";
import RandomFactHero from "../../components/RandomFactHero";

// Regenerate at most hourly so the archive picks up each new day's fact
// without needing the whole page to be dynamically rendered on every request.
export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Random Country Facts",
  description:
    "A new country fact every day, with a growing archive of past facts about population, geography, economies, and more.",
  path: "/random-facts",
});

// A new fact is added every day (see lib/randomFacts.js + lib/dailyFact.js)
// and past ones accumulate here, newest first. The interactive pieces
// (browsing the hero card, searching/filtering the archive) live in their
// own client components — see components/RandomFactHero.jsx and
// components/FactArchive.jsx — everything else here stays server-rendered.
//
// The title + hero card + stats box all sit on their own full-bleed dark
// band (.random-facts-band) instead of the shared .app-hero — this is
// hero variant C from "Estructura de páginas" (a page building its own
// container because it needs something other pages don't), so the usual
// .app-hero title/subtitle classes aren't reused here.
export default function RandomFactsPage() {
  const facts = getAccumulatedFacts();
  const [, ...archive] = facts;

  const countryCount = new Set(facts.map((f) => f.country)).size;
  const continentCount = new Set(facts.map((f) => factCountryMeta(f.country).region).filter(Boolean)).size;
  const categoryCount = new Set(facts.map((f) => f.category)).size;

  return (
    <>
      <div className="random-facts-band">
        <div className="random-facts-band__inner">
          <div className="random-facts-band__title-row">
            <h1 className="random-facts-band__title">Random Facts</h1>
            <span className="random-facts-band__eyebrow">Today · {factDateLabel(facts[0].day)}</span>
          </div>
          <p className="random-facts-band__subtitle">
            A new fact about the world appears every day and builds into this archive. Flip through the
            deck to browse them, and open the one that catches your eye to see the country.
          </p>

          <div className="random-facts-top">
            <RandomFactHero facts={facts} />

            <aside className="random-facts-stats">
              <div className="random-facts-stats__label">This year</div>
              <div className="random-facts-stats__headline">
                <span className="random-facts-stats__number">{facts.length}</span>
                <span className="random-facts-stats__unit">fact{facts.length === 1 ? "" : "s"} published</span>
              </div>
              <div className="random-facts-stats__row">
                <div className="random-facts-stats__item">
                  <div className="random-facts-stats__count">{countryCount}</div>
                  <div className="random-facts-stats__sub">countries</div>
                </div>
                <div className="random-facts-stats__item">
                  <div className="random-facts-stats__count">{continentCount}</div>
                  <div className="random-facts-stats__sub">continents</div>
                </div>
                <div className="random-facts-stats__item">
                  <div className="random-facts-stats__count">{categoryCount}</div>
                  <div className="random-facts-stats__sub">categories</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {archive.length > 0 && <FactArchive archive={archive} />}
    </>
  );
}
