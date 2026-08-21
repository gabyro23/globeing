"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorldMap from "../../components/WorldMap";
import SearchBar from "../../components/SearchBar";
import SelectedCountries from "../../components/SelectedCountries";
import CompareCharts from "../../components/CompareCharts";
import CompareModal from "../../components/CompareModal";
import { metaForAlpha3 } from "../../lib/countryMeta";
import { MAX_COMPARE } from "../../lib/constants";

const DEFAULT_COMPARE = ["ARG", "ESP"];

function applyFilters(countries, filters) {
  const term = filters.search.trim().toLowerCase();
  const filtered =
    term === "" ? countries : countries.filter((c) => c.name.toLowerCase().includes(term));
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
}

export default function ComparePage() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "" });
  const [compareAlpha3, setCompareAlpha3] = useState(DEFAULT_COMPARE);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((rows) => {
        if (rows.error) throw new Error(rows.error);
        const enriched = rows.map((c) => ({ ...c, ...metaForAlpha3(c.iso3) }));
        setCountries(enriched);
      })
      .catch((err) => setError(err.message));
  }, []);

  const byAlpha3 = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);

  const filteredCountries = useMemo(() => applyFilters(countries, filters), [countries, filters]);
  const selectedAlpha3Set = useMemo(() => new Set(compareAlpha3), [compareAlpha3]);
  const filteredAlpha3Set = useMemo(
    () => new Set(filteredCountries.map((c) => c.iso3)),
    [filteredCountries]
  );
  const selectedCountries = useMemo(
    () => compareAlpha3.map((a) => byAlpha3.get(a)).filter(Boolean),
    [compareAlpha3, byAlpha3]
  );

  const toggleCompare = useCallback((iso3) => {
    setCompareAlpha3((current) => {
      if (current.includes(iso3)) return current.filter((a) => a !== iso3);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, iso3];
    });
  }, []);

  const removeCompare = useCallback((iso3) => {
    setCompareAlpha3((current) => current.filter((a) => a !== iso3));
  }, []);

  const reorderCompare = useCallback((draggedAlpha3, targetIndex, before) => {
    setCompareAlpha3((current) => {
      const withoutDragged = current.filter((a) => a !== draggedAlpha3);
      const targetAlpha3 = current[targetIndex];
      let insertAt = withoutDragged.indexOf(targetAlpha3);
      if (insertAt === -1) insertAt = withoutDragged.length;
      if (!before) insertAt += 1;
      withoutDragged.splice(insertAt, 0, draggedAlpha3);
      return withoutDragged;
    });
  }, []);

  const handleDropAlpha3 = useCallback(
    (iso3) => {
      if (!byAlpha3.has(iso3)) return;
      toggleCompare(iso3);
    },
    [byAlpha3, toggleCompare]
  );

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Compare</h1>
        <p className="app-hero__subtitle">Search for countries, pick up to {MAX_COMPARE}, and compare their data.</p>
        {countries.length > 0 && (
          <span className="app-hero__stat">{countries.length} countries · public data</span>
        )}
      </div>

      {countries.length === 0 && !error && (
        <div className="status">
          <span className="status__spinner" aria-hidden="true" />
          <span>Loading data and map…</span>
        </div>
      )}

      {error && (
        <div className="status status--error">
          <span>Couldn&apos;t load the app: {error}</span>
        </div>
      )}

      {countries.length > 0 && (
        <>
          <div className="search-section">
            <SearchBar
              countries={filteredCountries}
              selectedAlpha3={selectedAlpha3Set}
              onToggle={toggleCompare}
              search={filters.search}
              onSearchChange={(value) => setFilters((f) => ({ ...f, search: value }))}
            />
          </div>

          <section className="app-layout__compare">
            <SelectedCountries
              selectedCountries={selectedCountries}
              onRemove={removeCompare}
              onReorder={reorderCompare}
              onOpenCompare={() => setCompareModalOpen(true)}
            />
          </section>

          <section className="map-section">
            <div className="app-layout__map">
              <WorldMap
                selectedAlpha3={selectedAlpha3Set}
                filteredAlpha3={filteredAlpha3Set}
                onToggleCountry={toggleCompare}
                onDropAlpha3={handleDropAlpha3}
              />
            </div>
          </section>

          <section className="app-layout__compare">
            <CompareCharts selectedCountries={selectedCountries} />
          </section>

          <CompareModal
            open={compareModalOpen}
            countries={selectedCountries}
            onClose={() => setCompareModalOpen(false)}
          />
        </>
      )}

      <footer className="app-footer">
        <p>Population, area, and economic data from public sources (World Bank).</p>
      </footer>
    </>
  );
}
