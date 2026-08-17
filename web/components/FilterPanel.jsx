"use client";

import { useEffect, useRef, useState } from "react";
import { SORT_OPTIONS } from "../lib/constants";

// Port de js/components/filterPanel.js
export default function FilterPanel({ regions, filters, onChange }) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const debounceRef = useRef(null);

  useEffect(() => setSearchValue(filters.search), [filters.search]);

  function handleSearchInput(e) {
    const value = e.target.value;
    setSearchValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ search: value.trim() }), 150);
  }

  function toggleRegion(region) {
    const has = filters.regions.includes(region);
    const next = has ? filters.regions.filter((r) => r !== region) : [...filters.regions, region];
    onChange({ regions: next });
  }

  function handleReset() {
    setSearchValue("");
    onChange({ search: "", sort: "name-asc", regions: [...regions] });
  }

  return (
    <div className="filter-panel">
      <div className="filter-field filter-field--search">
        <label htmlFor="filter-search">Buscar país</label>
        <div className="filter-search-box">
          <span className="filter-search-box__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            id="filter-search"
            type="search"
            placeholder="ej. Argentina, Japón..."
            autoComplete="off"
            value={searchValue}
            onChange={handleSearchInput}
          />
        </div>
      </div>

      <fieldset className="filter-field filter-field--regions">
        <legend>Región</legend>
        <div className="filter-regions">
          {regions.map((region) => (
            <label className="filter-region-chip" key={region}>
              <input
                type="checkbox"
                value={region}
                checked={filters.regions.includes(region)}
                onChange={() => toggleRegion(region)}
              />
              <span>{region}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="filter-field">
        <label htmlFor="filter-sort">Ordenar por</label>
        <select id="filter-sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className="filter-reset" onClick={handleReset}>
        ↺ Limpiar filtros
      </button>
    </div>
  );
}
