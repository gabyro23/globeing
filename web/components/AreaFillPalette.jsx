"use client";

import { useMemo, useState } from "react";
import { formatAreaCompact, formatSharePercent } from "../lib/format";

// The list of countries you can pour into the container: search, sort,
// then click a row to add one to the mix. Each click adds that
// country's real area to the running total that raises the water level
// in AreaFillCanvas — the same country can be added more than once (two
// Panamas' worth of area is a perfectly good amount to pour).
export default function AreaFillPalette({ countries, excludeIso3, targetCountry, onAdd }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const targetArea = Number(targetCountry?.area_km2) || 0;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = countries
      .filter((c) => c.iso3 !== excludeIso3)
      .filter((c) => (term ? c.name.toLowerCase().includes(term) : true));
    if (sort === "area") {
      return list.slice().sort((a, b) => (Number(b.area_km2) || 0) - (Number(a.area_km2) || 0));
    }
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, excludeIso3, search, sort]);

  return (
    <div className="area-fill-palette">
      <div className="search-bar">
        <div className="search-bar__box">
          <span className="search-bar__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search a country to pour in... e.g. Spain, Panama"
            autoComplete="off"
            aria-label="Search country to add to the container"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-bar__clear"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="area-fill-palette__toolbar">
        <span className="area-fill-palette__count">
          {filtered.length} {filtered.length === 1 ? "country" : "countries"}
        </span>
        <div className="area-fill-sort" role="group" aria-label="Sort countries">
          <button
            type="button"
            className={"area-fill-sort__btn" + (sort === "name" ? " is-active" : "")}
            aria-pressed={sort === "name"}
            onClick={() => setSort("name")}
          >
            A–Z
          </button>
          <button
            type="button"
            className={"area-fill-sort__btn" + (sort === "area" ? " is-active" : "")}
            aria-pressed={sort === "area"}
            onClick={() => setSort("area")}
          >
            Area
          </button>
        </div>
      </div>

      <p className="area-fill-palette__hint">Tap a country to pour it in.</p>

      <div className="area-fill-palette__list">
        {filtered.length === 0 && <p className="country-list__empty">No countries match your search.</p>}
        {filtered.map((country) => {
          const share = targetArea > 0 ? (Number(country.area_km2) / targetArea) * 100 : 0;
          const barWidth = targetArea > 0 ? Math.max(2, Math.min(100, share)) : 0;
          return (
            <button
              key={country.iso3}
              type="button"
              className="area-fill-row"
              title={`Pour ${country.name} into the container`}
              onClick={() => onAdd(country.iso3)}
            >
              <span className="area-fill-row__flag" aria-hidden="true">
                {country.flag}
              </span>
              <span className="area-fill-row__main">
                <span className="area-fill-row__name">{country.name}</span>
                {targetArea > 0 && (
                  <span className="area-fill-row__bar-track">
                    <span className="area-fill-row__bar-fill" style={{ width: `${barWidth}%` }} />
                  </span>
                )}
              </span>
              <span className="area-fill-row__stats">
                <span className="area-fill-row__area">{formatAreaCompact(country.area_km2)}</span>
                {targetArea > 0 && (
                  <span className="area-fill-row__share">{formatSharePercent(share)}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
