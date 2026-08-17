"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorldMap from "../components/WorldMap";
import FilterPanel from "../components/FilterPanel";
import CountryList from "../components/CountryList";
import CompareZone from "../components/CompareZone";
import CompareModal from "../components/CompareModal";
import { metaForAlpha3 } from "../lib/countryMeta";
import { MAX_COMPARE } from "../lib/constants";

const DEFAULT_COMPARE = ["ARG", "ESP"];

function applyFilters(countries, filters) {
  const term = filters.search.toLowerCase();
  const filtered = countries.filter(
    (c) => filters.regions.includes(c.region) && (term === "" || c.name.toLowerCase().includes(term))
  );

  const [key, direction] = filters.sort.split("-");
  const sortKey = filters.sort.startsWith("area_km2") ? "area_km2" : key;
  const sign = direction === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name) * sign;
    return ((a[sortKey] || 0) - (b[sortKey] || 0)) * sign;
  });

  return filtered;
}

export default function Home() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "", regions: [], sort: "name-asc" });
  const [compareAlpha3, setCompareAlpha3] = useState(DEFAULT_COMPARE);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((rows) => {
        if (rows.error) throw new Error(rows.error);
        const enriched = rows.map((c) => ({ ...c, ...metaForAlpha3(c.iso3) }));
        setCountries(enriched);
        const regions = [...new Set(enriched.map((c) => c.region))].sort();
        setFilters((f) => ({ ...f, regions }));
      })
      .catch((err) => setError(err.message));
  }, []);

  const byAlpha3 = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);
  const allRegions = useMemo(() => [...new Set(countries.map((c) => c.region))].sort(), [countries]);

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
      <div className="app-header__intro">
        <p className="app-header__tagline">Compará países por población, superficie y economía.</p>
        {countries.length > 0 && (
          <span className="app-header__stat">{countries.length} países · datos públicos</span>
        )}
      </div>

      {countries.length === 0 && !error && (
        <div className="status">
          <span className="status__spinner" aria-hidden="true" />
          <span>Cargando datos y mapa…</span>
        </div>
      )}

      {error && (
        <div className="status status--error">
          <span>No se pudo cargar la app: {error}</span>
        </div>
      )}

      {countries.length > 0 && (
        <>
          <main className="app-layout">
            <aside className="app-layout__sidebar">
              <FilterPanel
                regions={allRegions}
                filters={filters}
                onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
              />
              <div className="app-layout__list">
                <CountryList
                  countries={filteredCountries}
                  selectedAlpha3={selectedAlpha3Set}
                  onToggle={toggleCompare}
                />
              </div>
            </aside>

            <section className="app-layout__map">
              <WorldMap
                selectedAlpha3={selectedAlpha3Set}
                filteredAlpha3={filteredAlpha3Set}
                onToggleCountry={toggleCompare}
                onDropAlpha3={handleDropAlpha3}
              />
            </section>
          </main>

          <section className="app-layout__compare">
            <CompareZone
              selectedCountries={selectedCountries}
              onDropAlpha3={handleDropAlpha3}
              onRemove={removeCompare}
              onReorder={reorderCompare}
              onOpenCompare={() => setCompareModalOpen(true)}
            />
          </section>

          <CompareModal
            open={compareModalOpen}
            countries={selectedCountries}
            onClose={() => setCompareModalOpen(false)}
          />
        </>
      )}

      <footer className="app-footer">
        <p>Datos de población, superficie y economía de fuentes públicas (World Bank).</p>
      </footer>
    </>
  );
}
