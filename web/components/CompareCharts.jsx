import { INDICATORS } from "../lib/indicators";
import { formatCompareValue } from "../lib/format";
import { paletteColor } from "../lib/palette";

function StatCard({ indicator, rows }) {
  const max = Math.max(...rows.map((r) => r.value || 0), 1);
  return (
    <div className="compare-stats-card">
      <div className="compare-stats-card__header">
        <span className="compare-stats-card__title">{indicator.label}</span>
        <span className="compare-stats-card__category">{indicator.category}</span>
      </div>
      <div className="compare-stats-card__rows">
        {rows.map((r) => (
          <div className="compare-bar-row" key={r.iso3}>
            <span className="compare-bar-row__label">{r.name}</span>
            <div className="compare-bar-row__track">
              <div
                className="compare-bar-row__fill"
                style={{ width: `${Math.max((r.value / max) * 100, 2)}%`, background: r.color }}
              />
            </div>
            <span className="compare-bar-row__value">{formatCompareValue(r.value, indicator.unit)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// "Individual stats": one card per indicator (filtered by `category`,
// shared with the "Compare by" tabs above in CompareResults), each with a
// bar per selected country in selection order — colored consistently with
// the rest of the Compare flow (see lib/palette) instead of a single
// uniform bar color, so a country reads the same way here as it does in
// its slot card and its chosen-country chip.
export default function CompareStatsGrid({ countries, category }) {
  const shown = INDICATORS.filter((ind) => category === "All" || ind.category === category);

  return (
    <section className="compare-stats">
      <header className="compare-stats__header">
        <h2>Individual stats</h2>
        <p>
          {shown.length} {shown.length === 1 ? "indicator" : "indicators"}
          {category === "All" ? " across four categories" : ` in ${category}`}
        </p>
      </header>

      {countries.length === 0 ? (
        <p className="compare-zone__empty">You haven&apos;t picked any countries to compare yet.</p>
      ) : (
        <div className="compare-stats__grid">
          {shown.map((ind) => {
            const rows = countries.map((c, i) => ({
              iso3: c.iso3,
              name: c.name,
              color: paletteColor(i),
              value: Number(c[ind.key]) || 0,
            }));
            return <StatCard key={ind.key} indicator={ind} rows={rows} />;
          })}
        </div>
      )}
    </section>
  );
}
