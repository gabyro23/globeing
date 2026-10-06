"use client";

// Interactive part of /war-timeline, built from the "War Timeline" design
// in the project:
//   1. filters — continent, type of war (these pills double as the color
//      legend), a country/group search, sort order and "only ongoing".
//      Every filter applies to the whole page: numbers, chart and list;
//   2. an overview card — headline numbers and a stacked bar per year of
//      how many wars were active;
//   3. every war as a bar on a shared 1946–today axis, grouped by the
//      continent where it was fought.
//
// `wars` comes pre-shaped from lib/warTimeline.js:
//   { id, name, start, end (null = ongoing), type, continent, also[],
//     actors[] }
import { useId, useMemo, useState } from "react";
import { WAR_CONTINENTS } from "../lib/warTimeline";

const START = 1946;

// Stacking order of the yearly bars, bottom to top, and the legend order.
const TYPE_ORDER = ["interstate", "internationalized intrastate", "intrastate", "extrastate"];
const TYPES = {
  interstate: { label: "Interstate", color: "var(--war-interstate)" },
  "internationalized intrastate": { label: "Internationalized intrastate", color: "var(--war-intl-intrastate)" },
  intrastate: { label: "Intrastate", color: "var(--war-intrastate)" },
  extrastate: { label: "Extrastate (colonial)", color: "var(--war-extrastate)" },
};
const typeOf = (t) => TYPES[t] || { label: t || "Conflict", color: "var(--muted)" };

// [year, label, label row] — row 1 drops the label a line so 1989/1991
// don't collide.
const EVENTS = [
  [1962, "Cuban Missile Crisis", 0],
  [1989, "Berlin Wall falls", 0],
  [1991, "USSR dissolves", 1],
  [2001, "September 11", 0],
];
const COLD_WAR_END = 1992; // first post–Cold War year

const SORTS = [
  ["start", "Start year"],
  ["duration", "Duration"],
];

export default function WarTimelineExplorer({ wars: rawWars, currentYear }) {
  // Tolerate entries without `actors`/`also` (e.g. a cached server payload
  // from before those fields existed) instead of crashing the page.
  const wars = useMemo(
    () => rawWars.map((w) => (w.actors && w.also ? w : { ...w, actors: w.actors || [], also: w.also || [] })),
    [rawWars]
  );
  const [continent, setContinent] = useState("All");
  const [sort, setSort] = useState("start");
  const [ongoingOnly, setOngoingOnly] = useState(false);
  const [hidden, setHidden] = useState({});
  const [actor, setActor] = useState("");
  const actorListId = useId();

  // Every country or group that fought in at least one war, for the
  // search box's suggestions. Typing anything else still works — the
  // filter is a plain "contains" match on each side's names.
  const actorOptions = useMemo(() => {
    const counts = new Map();
    for (const w of wars) for (const a of w.actors) counts.set(a, (counts.get(a) || 0) + 1);
    return [...counts.entries()].sort((x, y) => x[0].localeCompare(y[0]));
  }, [wars]);
  const actorQuery = actor.trim().toLowerCase();

  const now = Math.max(currentYear, ...wars.map((w) => w.end || w.start));
  const span = now - START + 1;
  const pct = (year) => `${(((year - START) / span) * 100).toFixed(3)}%`;

  const visible = useMemo(
    () =>
      wars.filter(
        (w) =>
          !hidden[w.type] &&
          (!ongoingOnly || !w.end) &&
          (continent === "All" || w.continent === continent || w.also.includes(continent)) &&
          (!actorQuery || w.actors.some((a) => a.toLowerCase().includes(actorQuery)))
      ),
    [wars, hidden, ongoingOnly, continent, actorQuery]
  );

  const groups = useMemo(() => {
    const toRow = (w) => {
      const end = w.end || now;
      const ongoing = !w.end;
      const startPct = ((w.start - START) / span) * 100;
      const endPct = ((end + 1 - START) / span) * 100;
      const years = end - w.start + 1;
      const label = ongoing ? `${w.start}–now` : w.start === w.end ? String(w.start) : `${w.start}–${w.end}`;
      // The year tag sits right after the bar, unless the bar ends too
      // close to the right edge — then it goes just before it.
      const after = endPct < 82;
      return {
        id: w.id,
        name: w.name,
        also: w.also.join(", "),
        label,
        ongoing,
        years,
        start: w.start,
        color: typeOf(w.type).color,
        barStyle: {
          left: `${startPct.toFixed(3)}%`,
          width: `${Math.max(0.55, endPct - startPct).toFixed(3)}%`,
          background: typeOf(w.type).color,
        },
        tagStyle: after ? { left: `${endPct.toFixed(3)}%` } : { right: `${(100 - startPct).toFixed(3)}%` },
        title: `${w.name}\n${label} · ${years} ${years === 1 ? "year" : "years"} · ${typeOf(w.type).label}`,
      };
    };
    const order =
      sort === "start"
        ? (x, y) => x.start - y.start || y.years - x.years
        : (x, y) => y.years - x.years || x.start - y.start;

    const conts = continent === "All" ? WAR_CONTINENTS : [continent];
    return conts
      .map((c) => ({
        title: c,
        rows: visible
          .filter((w) => (continent === "All" ? w.continent === c : true))
          .map(toRow)
          .sort(order),
      }))
      .filter((g) => g.rows.length > 0);
  }, [visible, continent, sort, now, span]);

  // How many of the visible wars were active in each year, by type.
  const overview = useMemo(() => {
    const years = [];
    let peak = 0;
    let peakYear = START;
    for (let y = START; y <= now; y++) {
      const counts = {};
      let total = 0;
      for (const w of visible) {
        if (y >= w.start && y <= (w.end || now)) {
          counts[w.type] = (counts[w.type] || 0) + 1;
          total++;
        }
      }
      if (total > peak) {
        peak = total;
        peakYear = y;
      }
      years.push({ year: y, counts, total });
    }
    return { years, peak, peakYear, scale: 100 / Math.max(peak, 10) };
  }, [visible, now]);

  const axis = [];
  for (let y = START; y <= now; y += 10) axis.push(y);
  if (axis[axis.length - 1] !== now) axis.push(now);

  const ongoingCount = visible.filter((w) => !w.end).length;
  const hasFilters =
    continent !== "All" || ongoingOnly || Boolean(actorQuery) || Object.values(hidden).some(Boolean);

  const axisEl = (
    <div className="wt-axis" aria-hidden="true">
      {axis.map((y, i) => (
        <span key={y} className={i === axis.length - 1 ? "is-last" : undefined} style={{ left: pct(y) }}>
          {y}
        </span>
      ))}
    </div>
  );

  return (
    <div className="wt">
      <div className="wt-filters">
        <div className="wt-filters__group">
          <span className="wt-eyebrow">Continent</span>
          {["All", ...WAR_CONTINENTS].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={continent === c}
              className={"wt-pill" + (continent === c ? " is-active" : "")}
              onClick={() => setContinent(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="wt-filters__group">
          <span className="wt-eyebrow">Type</span>
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={!hidden[t]}
              title="Show or hide this type"
              className={"wt-type" + (hidden[t] ? " is-hidden" : "")}
              onClick={() => setHidden((h) => ({ ...h, [t]: !h[t] }))}
            >
              <span className="wt-type__swatch" style={{ background: TYPES[t].color }} />
              {TYPES[t].label}
            </button>
          ))}
        </div>
        <div className="wt-filters__group">
          <label className="wt-eyebrow" htmlFor={actorListId + "-input"}>
            Country or group
          </label>
          <div className="wt-search">
            <span className="wt-search__icon" aria-hidden="true">
              ⌕
            </span>
            <input
              id={actorListId + "-input"}
              type="search"
              list={actorListId}
              placeholder="e.g. France, FARC, IS…"
              autoComplete="off"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
            />
            <datalist id={actorListId}>
              {actorOptions.map(([name, n]) => (
                <option key={name} value={name}>
                  {n} war{n === 1 ? "" : "s"}
                </option>
              ))}
            </datalist>
          </div>
        </div>
        <div className="wt-filters__group">
          <span className="wt-eyebrow">Sort</span>
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              className={"wt-pill" + (sort === key ? " is-active" : "")}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={ongoingOnly}
          className={"wt-pill wt-pill--ongoing" + (ongoingOnly ? " is-active" : "")}
          onClick={() => setOngoingOnly((v) => !v)}
        >
          <span className="wt-pill__dot" />
          Only ongoing
        </button>
        {hasFilters && (
          <button
            type="button"
            className="btn-text"
            onClick={() => {
              setContinent("All");
              setHidden({});
              setActor("");
              setOngoingOnly(false);
            }}
          >
            ↺ Clear filters
          </button>
        )}
      </div>

      <section className="wt-card" aria-label="Overview">
        <div className="wt-card__top">
          <div className="wt-stat">
            <div className="wt-stat__number">{visible.length}</div>
            <div className="wt-stat__label">war{visible.length === 1 ? "" : "s"}</div>
          </div>
          <div className="wt-stat">
            <div className="wt-stat__number wt-stat__number--ongoing">{ongoingCount}</div>
            <div className="wt-stat__label">still ongoing</div>
          </div>
          <div className="wt-stat">
            <div className="wt-stat__number">{overview.peak}</div>
            <div className="wt-stat__label">at once, at the peak in {overview.peakYear}</div>
          </div>
        </div>

        <div className="wt-eyebrow">Wars active each year</div>

        <div className="wt-chart">
          {EVENTS.map(([year, label, row]) => (
            <div
              key={year}
              className={"wt-chart__event" + (row ? " wt-chart__event--low" : "")}
              style={{ left: pct(year + 0.5) }}
            >
              <div className="wt-chart__event-label">
                <b>{year}</b> <span>{label}</span>
              </div>
            </div>
          ))}
          <div className="wt-chart__bars" role="img" aria-label="Number of wars active in each year since 1946">
            {overview.years.map((y) => (
              <div
                key={y.year}
                className="wt-chart__col"
                title={`${y.year} · ${y.total} ${y.total === 1 ? "war" : "wars"}`}
              >
                {TYPE_ORDER.filter((t) => y.counts[t]).map((t) => (
                  <div
                    key={t}
                    className="wt-chart__seg"
                    style={{ height: `${(y.counts[t] * overview.scale).toFixed(2)}%`, background: TYPES[t].color }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          className="wt-eras"
          style={{
            gridTemplateColumns: `minmax(0, ${COLD_WAR_END - START}fr) minmax(0, ${now + 1 - COLD_WAR_END}fr)`,
          }}
        >
          <div className="wt-eras__era wt-eras__era--cold">Cold War · 1946–1991</div>
          <div className="wt-eras__era">Post–Cold War</div>
        </div>
      </section>

      <section className="wt-list" aria-label="All wars">
        <div className="wt-list__head">
          <span className="wt-eyebrow">War</span>
          {axisEl}
        </div>

        {groups.length === 0 && <div className="wt-list__empty">No wars match these filters.</div>}

        {groups.map((g) => (
          <div className="wt-group" key={g.title}>
            <div className="wt-group__head">
              <h2 className="wt-group__title">{g.title}</h2>
              <span className="wt-group__count">
                {g.rows.length} war{g.rows.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="wt-group__body">
              <div className="wt-group__grid" aria-hidden="true">
                {axis.map((y) => (
                  <div key={y} style={{ left: pct(y) }} />
                ))}
                <div className="wt-group__coldwar" style={{ left: pct(COLD_WAR_END) }} />
              </div>
              {g.rows.map((w) => (
                <div className="wt-row" key={w.id} title={w.title}>
                  <div className="wt-row__name">
                    <span className="wt-row__title">{w.name}</span>
                    {w.also && <span className="wt-row__also">+{w.also}</span>}
                    <span className="wt-row__years-inline">{w.label}</span>
                  </div>
                  <div className="wt-row__track">
                    <div className={"wt-row__bar" + (w.ongoing ? " is-ongoing" : "")} style={w.barStyle} />
                    {w.ongoing && <div className="wt-row__ongoing" />}
                    <span className="wt-row__years" style={w.tagStyle}>
                      {w.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
