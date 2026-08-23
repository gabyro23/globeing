"use client";

import { useEffect, useMemo, useState } from "react";
import { INDICATORS } from "../../lib/indicators";
import { metaForAlpha3 } from "../../lib/countryMeta";
import { formatCompareValue } from "../../lib/format";

// Display order for the continent filter — real continents first, "Other"
// (Taiwan, Antarctica-type edge cases) last, and only shown if it's
// actually present in the loaded data.
const REGION_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania", "Other"];

// Rankings page: pick an indicator (GDP, area, etc.) with the buttons up
// top and 3 tables get built — the top 10, the bottom 10, and the full
// list — all sorted by that indicator. A continent filter narrows all
// three tables at once. The "all countries" table also has its own search
// box to filter by name without losing the overall rank.
export default function RankingsPage() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(INDICATORS[0].key);
  const [regionFilter, setRegionFilter] = useState("All");
  const [allSearch, setAllSearch] = useState("");

  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((rows) => {
        if (rows.error) throw new Error(rows.error);
        setCountries(rows.map((c) => ({ ...c, ...metaForAlpha3(c.iso3) })));
      })
      .catch((err) => setError(err.message));
  }, []);

  const indicator = useMemo(
    () => INDICATORS.find((i) => i.key === selectedKey) ?? INDICATORS[0],
    [selectedKey]
  );

  // Only offer continents that actually have countries in the loaded data.
  const availableRegions = useMemo(() => {
    const present = new Set(countries.map((c) => c.region || "Other"));
    return REGION_ORDER.filter((r) => present.has(r));
  }, [countries]);

  const regionFilteredCountries = useMemo(
    () => (regionFilter === "All" ? countries : countries.filter((c) => (c.region || "Other") === regionFilter)),
    [countries, regionFilter]
  );

  const ranked = useMemo(() => {
    const dir = indicator.betterWhen === "low" ? 1 : -1;
    return regionFilteredCountries
      .map((c) => ({ ...c, __value: Number(c[indicator.key]) }))
      .filter((c) => c[indicator.key] !== null && c[indicator.key] !== undefined && c[indicator.key] !== "" && !Number.isNaN(c.__value))
      .sort((a, b) => (a.__value - b.__value) * dir);
  }, [regionFilteredCountries, indicator]);

  const best10 = useMemo(() => ranked.slice(0, 10).map((c, i) => ({ ...c, rank: i + 1 })), [ranked]);
  const worst10 = useMemo(
    () =>
      ranked
        .slice(-10)
        .reverse()
        .map((c, i) => ({ ...c, rank: ranked.length - i })),
    [ranked]
  );
  const allRanked = useMemo(() => ranked.map((c, i) => ({ ...c, rank: i + 1 })), [ranked]);

  // Filtering keeps each country's overall rank number (doesn't renumber),
  // so searching still shows where a country actually stands.
  const visibleAllRanked = useMemo(() => {
    const term = allSearch.trim().toLowerCase();
    if (!term) return allRanked;
    return allRanked.filter((c) => c.name.toLowerCase().includes(term));
  }, [allRanked, allSearch]);

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Rankings</h1>
        <p className="app-hero__subtitle">
          Pick an indicator and see which countries lead the table — and which ones rank last. Filter by
          continent to narrow it down.
        </p>
      </div>

      {countries.length === 0 && !error && (
        <div className="rankings-page" aria-busy="true" aria-label="Loading rankings">
          <div className="ranking-tabs" role="presentation">
            {INDICATORS.map((ind) => (
              <span
                key={ind.key}
                className="skeleton rankings-skeleton__tab"
                style={{ width: ind.label.length * 6.5 + 40 }}
              />
            ))}
          </div>

          <div className="ranking-filters">
            <span className="ranking-filters__label">Continent</span>
            <div className="ranking-region-tabs">
              {["All", "Africa", "Americas", "Asia", "Europe", "Oceania"].map((r) => (
                <span key={r} className="skeleton rankings-skeleton__region" />
              ))}
            </div>
          </div>

          <div className="ranking-tables">
            <RankingSkeletonCard tone="best" />
            <RankingSkeletonCard tone="worst" />
          </div>

          <RankingSkeletonCard tone="all" tall rows={8} withSearch />
        </div>
      )}

      {error && (
        <div className="status status--error">
          <span>Couldn&apos;t load the app: {error}</span>
        </div>
      )}

      {countries.length > 0 && (
        <div className="rankings-page">
          <div className="ranking-tabs" role="tablist" aria-label="Choose an indicator">
            {INDICATORS.map((ind) => (
              <button
                key={ind.key}
                type="button"
                role="tab"
                aria-selected={ind.key === selectedKey}
                className={"ranking-tab" + (ind.key === selectedKey ? " is-active" : "")}
                onClick={() => setSelectedKey(ind.key)}
              >
                {ind.label}
              </button>
            ))}
          </div>

          <div className="ranking-filters">
            <span className="ranking-filters__label">Continent</span>
            <div className="ranking-region-tabs" role="tablist" aria-label="Filter by continent">
              {["All", ...availableRegions].map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={r === regionFilter}
                  className={"ranking-region-tab" + (r === regionFilter ? " is-active" : "")}
                  onClick={() => setRegionFilter(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="ranking-tables">
            <RankingTable
              title={`Top 10 — ${indicator.label}`}
              rows={best10}
              indicator={indicator}
              tone="best"
            />
            <RankingTable
              title={`Bottom 10 — ${indicator.label}`}
              rows={worst10}
              indicator={indicator}
              tone="worst"
            />
          </div>

          <RankingTable
            title={`All countries — ${indicator.label}`}
            rows={visibleAllRanked}
            indicator={indicator}
            tone="all"
            tall
            searchValue={allSearch}
            onSearchChange={setAllSearch}
          />
        </div>
      )}
    </>
  );
}

// Placeholder card shaped exactly like RankingTable below (same header,
// same table grid), with skeleton bars standing in for the title, search
// box, and cell text — shown while /api/countries is still loading.
function RankingSkeletonCard({ tone, tall, rows = 6, withSearch }) {
  return (
    <section className={"ranking-table-card ranking-table-card--" + tone}>
      <div className="ranking-table-card__header">
        <span className="skeleton rankings-skeleton__title" aria-hidden="true" />
        {withSearch && <span className="skeleton rankings-skeleton__search" aria-hidden="true" />}
      </div>
      <div className={"ranking-table-scroll" + (tall ? " ranking-table-scroll--tall" : "")}>
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="ranking-table__rank-col">#</th>
              <th>Country</th>
              <th className="ranking-table__value-col">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="ranking-table__rank-col">
                  <span className="skeleton rankings-skeleton__cell" style={{ width: 14 }} aria-hidden="true" />
                </td>
                <td>
                  <span
                    className="skeleton rankings-skeleton__cell"
                    style={{ width: `${58 - (i % 4) * 8}%` }}
                    aria-hidden="true"
                  />
                </td>
                <td className="ranking-table__value-col">
                  <span
                    className="skeleton rankings-skeleton__cell"
                    style={{ width: 46, marginLeft: "auto" }}
                    aria-hidden="true"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RankingTable({ title, rows, indicator, tone, tall, searchValue, onSearchChange }) {
  const hasSearch = typeof onSearchChange === "function";

  return (
    <section className={"ranking-table-card ranking-table-card--" + tone}>
      <div className="ranking-table-card__header">
        <h2 className="ranking-table-card__title">{title}</h2>
        {hasSearch && (
          <div className="ranking-table-search">
            <span className="ranking-table-search__icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search country..."
              autoComplete="off"
              aria-label="Search country in this table"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className={"ranking-table-scroll" + (tall ? " ranking-table-scroll--tall" : "")}>
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="ranking-table__rank-col">#</th>
              <th>Country</th>
              <th className="ranking-table__value-col">
                {indicator.label}
                {indicator.unit && ` (${indicator.unit})`}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="ranking-table__empty">
                  {hasSearch && searchValue
                    ? "No country matches your search."
                    : "No data available for this indicator."}
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.iso3}>
                  <td className="ranking-table__rank-col">{c.rank}</td>
                  <td>
                    <span className="ranking-table__flag" aria-hidden="true">
                      {c.flag}
                    </span>{" "}
                    {c.name}
                  </td>
                  <td className="ranking-table__value-col">
                    {formatCompareValue(c.__value, indicator.unit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
