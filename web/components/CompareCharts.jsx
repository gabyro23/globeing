import { INDICATORS } from "../lib/indicators";
import { formatCompareValue } from "../lib/format";

function BarGroup({ title, unit, rows }) {
  const max = Math.max(...rows.map((r) => r.value || 0), 1);
  return (
    <section className="compare-bars">
      <h3>
        {title} {unit && `(${unit})`}
      </h3>
      {rows.map((r) => (
        <div className="compare-bar-row" key={r.iso3}>
          <span className="compare-bar-row__label">
            {r.flag} {r.name}
          </span>
          <div className="compare-bar-row__track">
            <div
              className="compare-bar-row__fill"
              style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="compare-bar-row__value">{formatCompareValue(r.value, unit)}</span>
        </div>
      ))}
    </section>
  );
}

// The indicator-by-indicator bar-chart breakdown for the selected
// countries. Shown after the map, further down the page than the search
// bar / selected-countries dropbox.
export default function CompareCharts({ selectedCountries }) {
  return (
    <div className="compare-charts">
      <h2 className="compare-charts__title">Comparison charts</h2>
      {selectedCountries.length === 0 ? (
        <p className="compare-zone__empty">You haven&apos;t picked any countries to compare yet.</p>
      ) : (
        <div className="compare-zone__charts">
          {INDICATORS.map((ind) => {
            const rows = selectedCountries
              .map((c) => ({
                iso3: c.iso3,
                flag: c.flag,
                name: c.name,
                value: Number(c[ind.key]) || 0,
              }))
              .sort((a, b) => b.value - a.value);
            return <BarGroup key={ind.key} title={ind.label} unit={ind.unit} rows={rows} />;
          })}
        </div>
      )}
    </div>
  );
}
