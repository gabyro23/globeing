"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorldMap from "../../components/WorldMap";
import SearchBar from "../../components/SearchBar";
import SelectedCountries from "../../components/SelectedCountries";
import CompareSlots from "../../components/CompareSlots";
import CompareQuickPicks from "../../components/CompareQuickPicks";
import CompareResults from "../../components/CompareResults";
import { paletteColor } from "../../lib/palette";
import { metaForAlpha3 } from "../../lib/countryMeta";
import { MAX_COMPARE } from "../../lib/constants";

function applyFilters(countries, filters) {
  const term = filters.search.trim().toLowerCase();
  const filtered =
    term === "" ? countries : countries.filter((c) => c.name.toLowerCase().includes(term));
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
}

// Deep-link support: /compare?countries=JPN,KOR preselects those
// countries so a link like "Compare Japan vs South Korea" (e.g. from a
// /country/[slug] page) opens the comparator ready to go instead of
// making the visitor search for both countries again. Read once as the
// initial state (not in an effect) — this only ever affects the render
// that happens *after* /api/countries has loaded (the loading skeleton
// that renders first, on the server and on the client, doesn't reference
// compareAlpha3 at all), so there's no hydration mismatch to worry about.
// Anything invalid/unknown in the URL is silently dropped downstream
// wherever compareAlpha3 is resolved through byAlpha3.get(...).filter(Boolean).
function initialCompareAlpha3FromUrl() {
  if (typeof window === "undefined") return [];
  const raw = new URLSearchParams(window.location.search).get("countries");
  if (!raw) return [];
  const codes = [...new Set(raw.split(",").map((code) => code.trim().toUpperCase()).filter(Boolean))];
  return codes.slice(0, MAX_COMPARE);
}

function focusSearchInput() {
  document.getElementById("global-search")?.focus();
}

export default function ComparePage() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "" });
  const [compareAlpha3, setCompareAlpha3] = useState(initialCompareAlpha3FromUrl);
  // 'select': pick countries (search/quick picks/slots/map). 'results':
  // the visual comparison + individual stats, replacing the old modal
  // overlay so it reads as its own screen with a "← Change countries"
  // way back instead of a dialog on top of the picker.
  const [screen, setScreen] = useState("select");

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

  const pickQuickSet = useCallback((codes) => {
    setCompareAlpha3(codes.slice(0, MAX_COMPARE));
  }, []);

  const canCompare = selectedCountries.length >= 2;
  const goToResults = useCallback(() => {
    if (!canCompare) return;
    setScreen("results");
    window.scrollTo(0, 0);
  }, [canCompare]);
  const goToSelect = useCallback(() => {
    setScreen("select");
    window.scrollTo(0, 0);
  }, []);

  if (screen === "results" && canCompare) {
    return (
      <div className="compare-results-screen">
        <div className="compare-results-screen__toolbar">
          <button type="button" className="compare-results-screen__back" onClick={goToSelect}>
            ← Change countries
          </button>
          <div className="compare-results-screen__actions">
            <button type="button" className="btn-secondary" disabled title="Coming soon">
              Share
            </button>
            <button type="button" className="btn-secondary" disabled title="Coming soon">
              Download CSV
            </button>
          </div>
        </div>

        <header className="compare-results-screen__header">
          <h1>{selectedCountries.map((c) => c.name).join(" vs ")}</h1>
          <div className="compare-results-screen__chips">
            {selectedCountries.map((c, i) => (
              <div className="compare-results-chip" key={c.iso3}>
                <span className="compare-chip__dot" style={{ background: paletteColor(i) }} aria-hidden="true" />
                {c.name}
              </div>
            ))}
          </div>
        </header>

        <div className="compare-results-screen__body">
          <CompareResults countries={selectedCountries} />
        </div>
      </div>
    );
  }

  return (
    <div className="compare-select-screen">
      <div className="app-hero">
        <h1 className="app-hero__title">Compare up to {MAX_COMPARE} countries</h1>
        <p className="app-hero__subtitle">
          Select a country or search for the name. Pick two or three countries to see visual
          comparisons and graphics.
        </p>
        {countries.length > 0 && (
          <span className="app-hero__stat">{countries.length} countries · public data</span>
        )}
      </div>

      {countries.length === 0 && !error && (
        <div aria-busy="true" aria-label="Loading countries and map">
          <div className="search-section">
            <div className="search-bar">
              <div className="skeleton compare-skeleton__search" />
            </div>
          </div>

          <section className="map-section">
            <div className="app-layout__map">
              <div className="skeleton compare-skeleton__map" />
            </div>
          </section>

          <section className="app-layout__compare">
            <div className="compare-zone">
              <div className="skeleton compare-skeleton__zone-line" />
            </div>
          </section>
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
            <CompareQuickPicks onPick={pickQuickSet} />
          </div>

          <div className="compare-section-heading">
            <h2>Choose from the map</h2>
            <p>Click the country and add it to the comparison graphics.</p>
          </div>

          <section className="map-section">
            <div className="app-layout__map">
              <WorldMap
                selectedAlpha3={selectedAlpha3Set}
                filteredAlpha3={filteredAlpha3Set}
                onToggleCountry={toggleCompare}
                onDropAlpha3={handleDropAlpha3}
                statsByAlpha3={byAlpha3}
              />
            </div>
          </section>

          <section className="app-layout__compare">
            <CompareSlots
              selectedCountries={selectedCountries}
              onRemove={removeCompare}
              onFocusSearch={focusSearchInput}
            />

            <div className="compare-select-screen__cta">
              <button
                type="button"
                className="btn-primary"
                disabled={!canCompare}
                title={canCompare ? "Compare these countries" : "Pick at least 2 countries to compare"}
                onClick={goToResults}
              >
                Compare →
              </button>
            </div>
          </section>

          <SelectedCountries
            selectedCountries={selectedCountries}
            onRemove={removeCompare}
            onReorder={reorderCompare}
            onOpenCompare={goToResults}
          />
          <div className="compare-sticky-bar__spacer" aria-hidden="true" />
        </>
      )}
    </div>
  );
}
