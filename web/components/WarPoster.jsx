"use client";

// "Poster" view of /war-timeline, modeled on classic world-history
// timeline posters: time runs top to bottom (1946 → today), each
// continent is a column, and every war is a vertical bar in that column,
// colored by UCDP conflict type. The whole post-1946 picture fits in one
// image, so you can see at a glance when and where the world was at war.
//
// A war that involved countries on more than one continent (Iraq 2003,
// Suez 1956, ...) gets a bar in each of those continents' columns, joined
// by a dotted line at its start year.
//
// Filters don't remove bars here (that would break the "whole picture");
// non-matching bars are dimmed instead.
import { useMemo, useState } from "react";

const START_YEAR = 1946;
const REGION_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania", "Other"];

const PX_PER_YEAR = 16;
const LANE_W = 22;
const BAR_W = 18;
const COL_PAD = 12;
const AXIS_W = 78;
const HEADER_H = 46;
const TOP_PAD = 10;
const BOTTOM_PAD = 26;
const MIN_COL_W = 96; // room for the continent name in the header
const EVENT_GUTTER = 150; // right-hand margin for the context-event labels

// Context lines drawn across the whole poster.
const EVENTS = [
  { year: 1962, label: "Cuban Missile Crisis" },
  { year: 1989, label: "Fall of the Berlin Wall" },
  { year: 1991, label: "Dissolution of the USSR" },
  { year: 2001, label: "September 11 attacks" },
];

// Big rotated labels on the left axis, like the era bands on the poster.
const ERAS = [
  { from: 1946, to: 1991, label: "COLD WAR" },
  { from: 1991, to: null, label: "POST–COLD WAR" },
];

const TYPE_COLOR = {
  interstate: "var(--war-interstate)",
  intrastate: "var(--war-intrastate)",
  "internationalized intrastate": "var(--war-intl-intrastate)",
  extrastate: "var(--war-extrastate)",
};
const TYPE_LABEL = {
  interstate: "Interstate",
  intrastate: "Intrastate",
  "internationalized intrastate": "Internationalized intrastate",
  extrastate: "Extrastate",
};

function stripGov(side) {
  return (side || "")
    .split(",")
    .map((s) => s.trim().replace(/^Government of /, ""))
    .filter(Boolean)
    .join(", ");
}

// Rough width of a label at 10.5px bold — good enough to decide how much
// of it fits inside a bar without measuring the DOM.
function fitText(text, maxPx) {
  const charW = 6.3;
  if (text.length * charW <= maxPx) return text;
  const n = Math.floor(maxPx / charW) - 1;
  return n >= 4 ? text.slice(0, n).trimEnd() + "…" : "";
}

export default function WarPoster({ wars, countries, currentYear, isMatch, onPickCountry }) {
  const [hover, setHover] = useState(null); // { entry, x, y }

  const countryByIso3 = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);
  const endYear = Math.max(currentYear, ...wars.map((w) => w.end_year || w.start_year));
  const y = (year) => HEADER_H + TOP_PAD + (year - START_YEAR) * PX_PER_YEAR;

  const layout = useMemo(() => {
    // One entry per (war, continent).
    const byRegion = new Map();
    for (const w of wars) {
      const groups = new Map();
      for (const iso3 of w.iso3s) {
        const region = countryByIso3.get(iso3)?.region || "Other";
        if (!groups.has(region)) groups.set(region, []);
        groups.get(region).push(iso3);
      }
      for (const [region, iso3s] of groups) {
        if (!byRegion.has(region)) byRegion.set(region, []);
        byRegion.get(region).push({ war: w, region, iso3s, key: `${w.id}-${region}` });
      }
    }

    let x = AXIS_W;
    const columns = [];
    const entries = [];
    for (const region of REGION_ORDER) {
      const list = byRegion.get(region);
      if (!list) continue;
      // Greedy interval packing: longest-first within the same start year
      // keeps the long wars in the leftmost lanes.
      list.sort(
        (a, b) =>
          a.war.start_year - b.war.start_year ||
          (b.war.end_year || endYear) - (a.war.end_year || endYear)
      );
      const laneEnds = [];
      for (const e of list) {
        const top = y(e.war.start_year);
        const bottom = y((e.war.end_year || currentYear) + 1) - 2;
        let lane = laneEnds.findIndex((end) => end + 4 <= top);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(bottom);
        } else {
          laneEnds[lane] = bottom;
        }
        entries.push({ ...e, lane, top, bottom, x: x + COL_PAD + lane * LANE_W });
      }
      const lanesW = COL_PAD * 2 + Math.max(laneEnds.length, 1) * LANE_W - (LANE_W - BAR_W);
      const width = Math.max(lanesW, MIN_COL_W);
      // Center the lanes when the header forces a wider column.
      const shift = (width - lanesW) / 2;
      for (const e of entries) if (e.region === region) e.x += shift;
      columns.push({ region, x, width, count: list.length });
      x += width;
    }

    // Dotted connectors between the bars of the same multi-continent war.
    const byWar = new Map();
    for (const e of entries) {
      if (!byWar.has(e.war.id)) byWar.set(e.war.id, []);
      byWar.get(e.war.id).push(e);
    }
    const links = [];
    for (const [id, es] of byWar) {
      if (es.length < 2) continue;
      const xs = es.map((e) => e.x + BAR_W / 2).sort((a, b) => a - b);
      links.push({ id, war: es[0].war, x1: xs[0], x2: xs[xs.length - 1], y: es[0].top + 7 });
    }

    return { columns, entries, links, chartRight: x, width: x + EVENT_GUTTER };
  }, [wars, countryByIso3, currentYear, endYear]);

  const height = y(endYear + 1) + BOTTOM_PAD;
  const years = [START_YEAR];
  for (let yr = 1950; yr <= endYear; yr += 5) years.push(yr);

  // "Side A vs Side B", straight from UCDP (governments shown by country
  // name) — reads the same in every column the war appears in.
  function labelFor(e) {
    const a = stripGov(e.war.side_a);
    const b = stripGov(e.war.side_b);
    return b ? `${a} vs ${b}` : a;
  }

  function showTip(ev, entry) {
    const box = ev.currentTarget.ownerSVGElement.getBoundingClientRect();
    const scale = box.width / layout.width;
    setHover({
      entry,
      left: (entry.x + BAR_W + 6) * scale,
      top: entry.top * scale,
      flip: (entry.x + BAR_W) * scale > box.width - 280,
      rightEdge: (entry.x - 6) * scale,
    });
  }

  const tipWar = hover?.entry.war;

  return (
    <div className="war-poster">
      <p className="war-poster__hint">Swipe sideways to see every continent · tap a bar for details</p>
      <div className="war-poster__scroll">
        <div className="war-poster__canvas" style={{ minWidth: Math.min(layout.width, 980) }}>
          <svg
            className="war-poster__svg"
            viewBox={`0 0 ${layout.width} ${height}`}
            role="img"
            aria-label={`Timeline poster of ${wars.length} wars since ${START_YEAR}, grouped by continent`}
            onMouseLeave={() => setHover(null)}
          >
            {/* continent columns */}
            {layout.columns.map((c, i) => (
              <g key={c.region}>
                <rect
                  x={c.x}
                  y={HEADER_H}
                  width={c.width}
                  height={height - HEADER_H - BOTTOM_PAD + 6}
                  style={{ fill: i % 2 ? "var(--war-poster-col-alt)" : "var(--war-poster-col)" }}
                />
                <text x={c.x + c.width / 2} y={20} textAnchor="middle" className="war-poster__col-title">
                  {c.region.toUpperCase()}
                </text>
                <text x={c.x + c.width / 2} y={36} textAnchor="middle" className="war-poster__col-sub">
                  {c.count} war{c.count === 1 ? "" : "s"}
                </text>
              </g>
            ))}

            {/* era bands on the axis */}
            {ERAS.map((era) => {
              const y1 = y(era.from);
              const y2 = y((era.to || endYear) + (era.to ? 0 : 1));
              const cx = 16;
              const cy = (y1 + y2) / 2;
              return (
                <g key={era.label}>
                  <line x1={cx + 12} x2={cx + 12} y1={y1 + 4} y2={y2 - 4} className="war-poster__era-line" />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    className="war-poster__era"
                    dominantBaseline="middle"
                  >
                    {era.label}
                  </text>
                </g>
              );
            })}

            {/* year grid */}
            {years.map((yr) => (
              <g key={yr}>
                <line
                  x1={AXIS_W - 26}
                  x2={layout.chartRight}
                  y1={y(yr)}
                  y2={y(yr)}
                  className={yr % 10 === 0 ? "war-poster__grid war-poster__grid--decade" : "war-poster__grid"}
                />
                <text
                  x={AXIS_W - 6}
                  y={y(yr) + 4}
                  textAnchor="end"
                  className={
                    yr % 10 === 0 || yr === START_YEAR ? "war-poster__year war-poster__year--decade" : "war-poster__year"
                  }
                >
                  {yr}
                </text>
              </g>
            ))}

            {/* context events */}
            {EVENTS.filter((ev) => ev.year <= endYear).map((ev) => (
              <g key={ev.year}>
                <line x1={AXIS_W} x2={layout.chartRight + 6} y1={y(ev.year)} y2={y(ev.year)} className="war-poster__event" />
                <text x={layout.chartRight + 10} y={y(ev.year) - 2} className="war-poster__event-label">
                  <tspan className="war-poster__event-year">{ev.year}</tspan>
                  <tspan x={layout.chartRight + 10} dy="12">
                    {ev.label}
                  </tspan>
                </text>
              </g>
            ))}

            {/* multi-continent connectors */}
            {layout.links.map((l) => (
              <line
                key={l.id}
                x1={l.x1}
                x2={l.x2}
                y1={l.y}
                y2={l.y}
                className="war-poster__link"
                style={{ opacity: isMatch(l.war) ? 1 : 0.12 }}
              />
            ))}

            {/* war bars */}
            {layout.entries.map((e) => {
              const h = Math.max(e.bottom - e.top, 10);
              const match = isMatch(e.war, e.region);
              const flag = e.iso3s.length === 1 ? countryByIso3.get(e.iso3s[0])?.flag : "";
              const showFlag = flag && h >= 20;
              const textRoom = h - (showFlag ? 26 : 8);
              const label = textRoom > 24 ? fitText(labelFor(e), textRoom) : "";
              const cx = e.x + BAR_W / 2;
              const textCy = e.top + (showFlag ? 22 : 4) + textRoom / 2;
              const active = hover?.entry.key === e.key;
              return (
                <g
                  key={e.key}
                  className={"war-poster__bar" + (active ? " is-active" : "")}
                  style={{ opacity: match ? 1 : 0.13 }}
                  onMouseEnter={(ev) => showTip(ev, e)}
                  onClick={(ev) => {
                    showTip(ev, e);
                    if (e.iso3s.length === 1) onPickCountry?.(e.iso3s[0]);
                  }}
                >
                  <rect
                    x={e.x}
                    y={e.top}
                    width={BAR_W}
                    height={h}
                    rx={BAR_W / 2}
                    style={{ fill: TYPE_COLOR[e.war.type_of_conflict] || "var(--muted)" }}
                  />
                  {!e.war.end_year && <circle cx={cx} cy={e.top + h + 5} r={3} className="war-poster__ongoing-dot" />}
                  {showFlag && (
                    <text x={cx} y={e.top + 14} textAnchor="middle" className="war-poster__flag">
                      {flag}
                    </text>
                  )}
                  {label && (
                    <text
                      x={cx}
                      y={textCy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(-90 ${cx} ${textCy})`}
                      className="war-poster__label"
                    >
                      {label}
                    </text>
                  )}
                  <title>{`${labelFor(e)} (${e.war.start_year}–${e.war.end_year || "present"})`}</title>
                </g>
              );
            })}
          </svg>

          {hover && (
            <div
              className="war-poster__tip"
              style={
                hover.flip
                  ? { top: hover.top, right: `calc(100% - ${hover.rightEdge}px)` }
                  : { top: hover.top, left: hover.left }
              }
            >
              <div className="war-poster__tip-years">
                {tipWar.start_year === tipWar.end_year
                  ? tipWar.start_year
                  : `${tipWar.start_year}–${tipWar.end_year || "present"}`}
                {" · "}
                {TYPE_LABEL[tipWar.type_of_conflict] || tipWar.type_of_conflict}
                {!tipWar.end_year && <span className="war-explorer__ongoing war-poster__tip-ongoing">Ongoing</span>}
              </div>
              <div className="war-poster__tip-sides">
                <strong>{stripGov(tipWar.side_a)}</strong>
                {tipWar.side_b && (
                  <>
                    <span className="war-poster__tip-vs">vs</span>
                    <strong>{stripGov(tipWar.side_b)}</strong>
                  </>
                )}
              </div>
              <div className="war-poster__tip-countries">
                {tipWar.iso3s.map((iso3) => {
                  const c = countryByIso3.get(iso3);
                  return c ? (
                    <span key={iso3}>
                      {c.flag} {c.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="country-war-timeline__legend war-poster__legend">
        {Object.keys(TYPE_LABEL).map((t) => (
          <span className="country-war-timeline__legend-item" key={t}>
            <span className="country-war-timeline__legend-swatch" style={{ background: TYPE_COLOR[t] }} />
            {TYPE_LABEL[t]}
          </span>
        ))}
        <span className="country-war-timeline__legend-item">
          <span className="war-poster__legend-dot" /> Still ongoing
        </span>
        <span className="country-war-timeline__legend-item">
          <span className="war-poster__legend-link" /> Same war, several continents
        </span>
      </div>
    </div>
  );
}
