// The "war history" section on /country/[slug]: every war a country has
// been in (from the country_wars Supabase table — see
// docs/data/wars_README.md) as a bar on a shared 1946–present timeline,
// grouped visually the same way for every country so a glance tells you
// how much of its history has been spent at war.
//
// Pure presentational — country.js already filters country_wars down to
// this one country and passes the rows in; this component just lays
// them out. No client-side state, so it stays a plain server component.
import { warSideActors } from "../lib/warActors";

const START_YEAR = 1946;

// Matches the CC BY 4.0-cited UCDP/PRIO type_of_conflict categories
// (see docs/data/wars_README.md) to a label and a timeline color. The
// first two reuse the site's own accent/sage tokens; the other two are
// dedicated tokens (app/globals.css) chosen to sit alongside them without
// being mistaken for either.
const WAR_TYPE_META = {
  interstate: { label: "Interstate", color: "var(--war-interstate)" },
  intrastate: { label: "Intrastate", color: "var(--war-intrastate)" },
  "internationalized intrastate": {
    label: "Internationalized intrastate",
    color: "var(--war-intl-intrastate)",
  },
  extrastate: { label: "Extrastate", color: "var(--war-extrastate)" },
};

function typeMeta(type) {
  return WAR_TYPE_META[type] || { label: type || "Conflict", color: "var(--muted)" };
}

function WarSideChips({ actors }) {
  if (actors.length === 0) return null;
  return (
    <span className="country-war-timeline__side">
      {actors.map((a, i) => (
        <span
          key={i}
          className={
            a.flag
              ? "country-war-timeline__chip"
              : "country-war-timeline__chip country-war-timeline__chip--noflag"
          }
          title={a.name}
          aria-hidden="true"
        >
          {a.flag || "✳"}
        </span>
      ))}
      <span className="country-war-timeline__label">{actors.map((a) => a.name).join(", ")}</span>
    </span>
  );
}

export default function CountryWarTimeline({ wars }) {
  if (!wars || wars.length === 0) return null;

  const currentYear = new Date().getFullYear();
  const endYear = Math.max(currentYear, ...wars.map((w) => w.end_year || w.start_year));
  const span = Math.max(endYear - START_YEAR, 1);

  const decades = [];
  for (let y = START_YEAR; y <= endYear; y += 10) decades.push(y);
  if (decades[decades.length - 1] !== endYear) decades.push(endYear);

  const rows = wars.map((w) => {
    const barEnd = w.end_year || currentYear;
    const left = ((w.start_year - START_YEAR) / span) * 100;
    const width = Math.max(0.9, ((barEnd - w.start_year + 1) / span) * 100);
    const meta = typeMeta(w.type_of_conflict);
    return {
      id: w.id,
      left: `${left.toFixed(2)}%`,
      width: `${width.toFixed(2)}%`,
      span: w.start_year === w.end_year ? String(w.start_year) : `${w.start_year}–${w.end_year || "present"}`,
      typeLabel: meta.label,
      color: meta.color,
      sideAActors: warSideActors(w.side_a),
      sideBActors: warSideActors(w.side_b),
    };
  });

  const usedTypes = [...new Set(wars.map((w) => w.type_of_conflict).filter(Boolean))];

  return (
    <div className="country-war-timeline">
      <div className="country-war-timeline__axis" aria-hidden="true">
        {decades.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <ul className="country-war-timeline__list">
        {rows.map((w) => (
          <li className="country-war-timeline__row" key={w.id}>
            <div className="country-war-timeline__row-top">
              <WarSideChips actors={w.sideAActors} />
              {w.sideBActors.length > 0 && (
                <>
                  <span className="country-war-timeline__vs">vs</span>
                  <WarSideChips actors={w.sideBActors} />
                </>
              )}
              <span className="country-war-timeline__meta">
                {w.span} · {w.typeLabel}
              </span>
            </div>
            <div className="country-war-timeline__track">
              <div
                className="country-war-timeline__fill"
                style={{ left: w.left, width: w.width, background: w.color }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="country-war-timeline__legend">
        {usedTypes.map((t) => {
          const meta = typeMeta(t);
          return (
            <span className="country-war-timeline__legend-item" key={t}>
              <span className="country-war-timeline__legend-swatch" style={{ background: meta.color }} />
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
