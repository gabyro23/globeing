import { getAccumulatedFacts } from "../../lib/dailyFact";

// Regenerate at most hourly so the archive picks up each new day's fact
// without needing the whole page to be dynamically rendered on every request.
export const revalidate = 3600;

function factDateLabel(day) {
  const date = new Date(new Date().getFullYear(), 0, day);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// A new fact is added every day (see lib/randomFacts.js + lib/dailyFact.js)
// and past ones accumulate here, newest first.
export default function RandomFactsPage() {
  const facts = getAccumulatedFacts();
  const [today, ...archive] = facts;

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Random Facts</h1>
        <p className="app-hero__subtitle">
          A new fact about the world appears every day and builds into this archive.
        </p>
        <span className="app-hero__stat">
          {facts.length} fact{facts.length === 1 ? "" : "s"} so far this year
        </span>
      </div>

      <section className="daily-fact daily-fact--page">
        <div className="daily-fact__card">
          <span className="daily-fact__eyebrow">Today · {factDateLabel(today.day)}</span>
          <p className="daily-fact__text">
            {today.fact} <span className="daily-fact__country">— {today.country}</span>
          </p>
          <div className="daily-fact__footer">
            <a
              className="daily-fact__source"
              href={today.source.url}
              target="_blank"
              rel="noreferrer"
            >
              Source: {today.source.name}
            </a>
          </div>
        </div>
      </section>

      {archive.length > 0 && (
        <section className="fact-archive">
          <h2 className="fact-archive__title">Archive</h2>
          <div className="fact-archive__grid">
            {archive.map((f) => (
              <article className="fact-card" key={f.day}>
                <div className="fact-card__header">
                  <span className="fact-card__date">{factDateLabel(f.day)}</span>
                  <span className="fact-card__category">{f.category}</span>
                </div>
                <p className="fact-card__text">{f.fact}</p>
                <div className="fact-card__footer">
                  <span className="fact-card__country">{f.country}</span>
                  <a className="fact-card__source" href={f.source.url} target="_blank" rel="noreferrer">
                    {f.source.name}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="app-footer">
        <p>Facts curated from public references — see each card&apos;s source link for more.</p>
      </footer>
    </>
  );
}
