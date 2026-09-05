"use client";

import { useMemo, useState } from "react";
import { formatAreaCompact, formatSharePercent } from "../lib/format";

// The list of countries you can pour into the container: search, then
// click a row (or its + button) to add one to the mix. Each click adds
// that country's real area to the running total that raises the water
// level in AreaFillCanvas — the same country can be added more than
// once (two Panamas' worth of area is a perfectly good amount to pour).
export default function AreaFillPalette({ countries, excludeIso3, targetCountry, onAdd }) {
  const [search, setSearch] = useState("");
  const targetArea = Number(targetCountry?.area_km2) || 0;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return countries
      .filter((c) => c.iso3 !== excludeIso3)
      .filter((c) => (term ? c.name.toLowerCase().includes(term) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, excludeIso3, search]);

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

      <p className="area-fill-palette__hint">Tap a country (or its + button) to pour it in.</p>

      <div className="area-fill-palette__list">
        {filtered.length === 0 && <p className="country-list__empty">No countries match your search.</p>}
        {filtered.map((country) => (
          <article
            key={country.iso3}
            className="country-card area-fill-palette__item"
            role="button"
            tabIndex={0}
            title={`Pour ${country.name} into the container`}
            onClick={() => onAdd(country.iso3)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAdd(country.iso3);
              }
            }}
          >
            <span className="country-card__flag" aria-hidden="true">
              {country.flag}
            </span>
            <div className="country-card__body">
              <h3 className="country-card__name">{country.name}</h3>
              <dl className="country-card__stats">
                <div>
                  <dt>Area</dt>
                  <dd>{formatAreaCompact(country.area_km2)}</dd>
                </div>
                {targetArea > 0 && (
                  <div>
                    <dt>Share</dt>
                    <dd>
                      {formatSharePercent((Number(country.area_km2) / targetArea) * 100)} of{" "}
                      {targetCountry.name}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <span className="country-card__check" aria-hidden="true">
              +
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
