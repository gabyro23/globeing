"use client";

// The interactive part of /war-timeline: every war in country_wars (one
// entry per conflict — app/war-timeline/page.js already grouped the
// per-country rows) on a shared 1946–present axis, with the same
// continent chips as Rankings / Random Facts plus a country picker.
//
// A war matches a continent if ANY country involved in it is on that
// continent, and matches a country if that country is one of the states
// involved. Filters are mirrored into the URL (?continent=Asia&country=IND)
// so a filtered view can be shared or linked from a country page.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { warSideActors } from "../lib/warActors";
import WarPoster from "./WarPoster";

const START_YEAR = 1946;
const REGION_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania", "Other"];

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

function SideChips({ actors }) {
  if (actors.length === 0) return null;
  return (
    <span className="country-war-timeline__side">
      {actors.map((a, i) => (
        <span
          key={i}
          className={
            a.flag ? "country-war-timeline__chip" : "country-war-timeline__chip country-war-timeline__chip--noflag"
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

// Reads ?continent / ?country and hands them to the explorer as its
// initial filters. useSearchParams makes this part client-rendered, so
// app/war-timeline/page.js wraps it in <Suspense> with a plain
// <WarTimelineExplorer> as the fallback — the server HTML still contains
// the full, unfiltered timeline for crawlers.
export function WarTimelineFromUrl({ wars, countries, currentYear }) {
  const params = useSearchParams();
  const c = params.get("continent");
  const iso3 = (params.get("country") || "").toUpperCase();
  return (
    <WarTimelineExplorer
      wars={wars}
      countries={countries}
      currentYear={currentYear}
      initialContinent={c && REGION_ORDER.includes(c) ? c : "All"}
      initialCountry={countries.some((x) => x.iso3 === iso3) ? iso3 : ""}
    />
  );
}

export default function WarTimelineExplorer({
  wars,
  countries,
  currentYear: currentYearProp,
  initialContinent = "All",
  initialCountry = "",
}) {
  const [continent, setContinent] = useState(initialContinent);
  const [country, setCountry] = useState(initialCountry);
  const [view, setView] = useState("poster");

  const countryByIso3 = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);

  // Mirror the filters into the URL so a filtered view can be shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (continent === "All") params.delete("continent");
    else params.set("continent", continent);
    if (country) params.set("country", country);
    else params.delete("country");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [continent, country]);

  const availableRegions = useMemo(() => {
    const present = new Set(countries.map((c) => c.region || "Other"));
    return REGION_ORDER.filter((r) => present.has(r));
  }, [countries]);

  const countryOptions = useMemo(
    () => (continent === "All" ? countries : countries.filter((c) => (c.region || "Other") === continent)),
    [countries, continent]
  );

  function pickContinent(r) {
    setContinent(r);
    // Drop a selected country that isn't on the new continent.
    const sel = countryByIso3.get(country);
    if (sel && r !== "All" && (sel.region || "Other") !== r) setCountry("");
  }

  const filtered = useMemo(() => {
    return wars.filter((w) => {
      if (country && !w.iso3s.includes(country)) return false;
      if (continent !== "All" && !w.iso3s.some((iso3) => (countryByIso3.get(iso3)?.region || "Other") === continent))
        return false;
      return true;
    });
  }, [wars, country, continent, countryByIso3]);

  const currentYear = currentYearProp || new Date().getFullYear();

  // Poster view keeps every bar and dims the non-matching ones; `region`
  // is the continent column a bar sits in (a war can span several).
  const isMatch = (w, region) =>
    (!country || w.iso3s.includes(country)) &&
    (continent === "All" ||
      (region
        ? region === continent
        : w.iso3s.some((iso3) => (countryByIso3.get(iso3)?.region || "Other") === continent)));
  const endYear = Math.max(currentYear, ...wars.map((w) => w.end_year || w.start_year));
  const span = endYear - START_YEAR + 1;
  const pct = (year) => ((year - START_YEAR) / span) * 100;

  const decades = [];
  for (let y = 1950; y <= endYear; y += 10) decades.push(y);

  const ongoingCount = filtered.filter((w) => !w.end_year).length;
  const involvedCount = new Set(filtered.flatMap((w) => w.iso3s)).size;
  const usedTypes = [...new Set(filtered.map((w) => w.type_of_conflict).filter(Boolean))];
  const selected = countryByIso3.get(country);
  const hasFilters = continent !== "All" || Boolean(country);

  return (
    <div className="war-explorer">
      <div className="war-explorer__filters">
        <div className="ranking-filters">
          <span className="ranking-filters__label">Continent</span>
          <div className="ranking-region-tabs" role="tablist" aria-label="Filter by continent">
            {["All", ...availableRegions].map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={r === continent}
                className={"ranking-region-tab" + (r === continent ? " is-active" : "")}
                onClick={() => pickContinent(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="ranking-filters">
          <label className="ranking-filters__label" htmlFor="war-country">
            Country
          </label>
          <select
            id="war-country"
            className="war-explorer__select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">All countries ({countryOptions.length})</option>
            {countryOptions.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.flag} {c.name} · {c.warCount}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setContinent("All");
                setCountry("");
              }}
            >
              ↺ Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="ranking-filters">
        <span className="ranking-filters__label">View</span>
        <div className="ranking-region-tabs" role="tablist" aria-label="Choose a view">
          {[
            ["poster", "Poster"],
            ["list", "List"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              className={"ranking-tab" + (view === key ? " is-active" : "")}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="war-explorer__stats" aria-live="polite">
        <div className="war-explorer__stat">
          <span className="war-explorer__stat-number">{filtered.length}</span>
          <span className="war-explorer__stat-label">war{filtered.length === 1 ? "" : "s"}</span>
        </div>
        <div className="war-explorer__stat">
          <span className="war-explorer__stat-number">{involvedCount}</span>
          <span className="war-explorer__stat-label">countr{involvedCount === 1 ? "y" : "ies"} involved</span>
        </div>
        <div className="war-explorer__stat">
          <span className="war-explorer__stat-number">{ongoingCount}</span>
          <span className="war-explorer__stat-label">ongoing</span>
        </div>
        {selected?.slug && (
          <Link className="war-explorer__country-link" href={`/country/${selected.slug}`}>
            {selected.flag} Open {selected.name}&apos;s country page →
          </Link>
        )}
      </div>

      {view === "poster" ? (
        <section className="war-explorer__card war-explorer__card--poster" aria-label="War timeline poster">
          <WarPoster
            wars={wars}
            countries={countries}
            currentYear={currentYear}
            isMatch={isMatch}
            onPickCountry={(iso3) => {
              const c = countryByIso3.get(iso3);
              setCountry((prev) => (prev === iso3 ? "" : iso3));
              if (c && continent !== "All" && (c.region || "Other") !== continent) setContinent("All");
            }}
          />
        </section>
      ) : (
        <section className="war-explorer__card" aria-label="War timeline">
          {filtered.length === 0 ? (
            <p className="war-explorer__empty">No wars match these filters.</p>
          ) : (
            <>
              <div className="war-explorer__axis" aria-hidden="true">
                {decades.map((d) => (
                  <span key={d} style={{ left: `${pct(d)}%` }}>
                    {d}
                  </span>
                ))}
              </div>
              <ul className="country-war-timeline__list">
                {filtered.map((w) => {
                  const meta = typeMeta(w.type_of_conflict);
                  const barEnd = w.end_year || currentYear;
                  const left = pct(w.start_year);
                  const width = Math.max(0.9, pct(barEnd + 1) - left);
                  const sideA = warSideActors(w.side_a);
                  const sideB = warSideActors(w.side_b);
                  const years =
                    w.start_year === w.end_year ? String(w.start_year) : `${w.start_year}–${w.end_year || "present"}`;
                  return (
                    <li className="country-war-timeline__row" key={w.id}>
                      <div className="country-war-timeline__row-top">
                        <SideChips actors={sideA} />
                        {sideB.length > 0 && (
                          <>
                            <span className="country-war-timeline__vs">vs</span>
                            <SideChips actors={sideB} />
                          </>
                        )}
                        <span className="country-war-timeline__meta">
                          {!w.end_year && <span className="war-explorer__ongoing">Ongoing</span>}
                          {years} · {meta.label}
                        </span>
                      </div>
                      <div className="country-war-timeline__track">
                        <div
                          className="country-war-timeline__fill"
                          style={{ left: `${left.toFixed(2)}%`, width: `${width.toFixed(2)}%`, background: meta.color }}
                        />
                      </div>
                      <div className="war-explorer__involved">
                        {w.iso3s.map((iso3) => {
                          const c = countryByIso3.get(iso3);
                          if (!c) return null;
                          return (
                            <button
                              key={iso3}
                              type="button"
                              className={"war-explorer__country-chip" + (iso3 === country ? " is-active" : "")}
                              onClick={() => {
                                setCountry(iso3 === country ? "" : iso3);
                                if (continent !== "All" && (c.region || "Other") !== continent) setContinent("All");
                              }}
                              title={iso3 === country ? "Show all countries" : `Show only ${c.name}'s wars`}
                            >
                              {c.flag} {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="country-war-timeline__legend">
                {usedTypes.map((t) => {
                  const m = typeMeta(t);
                  return (
                    <span className="country-war-timeline__legend-item" key={t}>
                      <span className="country-war-timeline__legend-swatch" style={{ background: m.color }} />
                      {m.label}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
