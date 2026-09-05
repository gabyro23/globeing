"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CompareSubNav from "../../../components/CompareSubNav";
import AreaFillCanvas from "../../../components/AreaFillCanvas";
import AreaFillPalette from "../../../components/AreaFillPalette";
import { metaForAlpha3 } from "../../../lib/countryMeta";
import { loadWorld, featuresByAlpha3 } from "../../../lib/worldAtlas";
import { formatArea, formatAreaCompact } from "../../../lib/format";

// Russia is the poster child for this page (it's the example everyone
// reaches for — "how many Spains fit in Russia?"), so it's the default
// container on load if it's in the dataset.
const DEFAULT_TARGET_ISO3 = "RUS";

let itemIdSeed = 0;
function nextItemId() {
  itemIdSeed += 1;
  return `poured-${Date.now()}-${itemIdSeed}`;
}

// "Fill the country": pick a country as the container, then pour other
// countries into it — each one adds its own real area to a running total
// that raises a single water level inside the container's own real
// outline (see AreaFillCanvas + lib/liquidFill.js). Nothing is
// reprojected onto the container's location; it's just an amount of
// surface, rising inside it, until it reaches the whole container.
export default function FillTheCountryPage() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [featureMap, setFeatureMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [targetIso3, setTargetIso3] = useState(DEFAULT_TARGET_ISO3);
  const [pouredItems, setPouredItems] = useState([]);

  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((rows) => {
        if (rows.error) throw new Error(rows.error);
        const enriched = rows.map((c) => ({ ...c, ...metaForAlpha3(c.iso3) }));
        setCountries(enriched);
        setTargetIso3((current) => {
          if (enriched.some((c) => c.iso3 === current)) return current;
          return enriched[0]?.iso3 ?? current;
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadWorld()
      .then((world) => setFeatureMap(featuresByAlpha3(world)))
      .catch((err) => setMapError(err.message));
  }, []);

  const countriesByIso3 = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  );
  const targetCountry = countriesByIso3.get(targetIso3) || null;
  const targetFeature = featureMap && targetCountry ? featureMap.get(targetCountry.iso3) : null;

  const emptyContainer = useCallback(() => setPouredItems([]), []);

  // Switching containers empties it — the amounts poured in were a share
  // of the old country's area, so carrying them over to a different-sized
  // container would just be a confusing, meaningless percentage.
  const handleSelectTarget = useCallback(
    (iso3) => {
      setTargetIso3(iso3);
      emptyContainer();
    },
    [emptyContainer]
  );

  const addPoured = useCallback(
    (iso3) => {
      if (!iso3 || iso3 === targetIso3) return;
      setPouredItems((current) => [...current, { id: nextItemId(), iso3 }]);
    },
    [targetIso3]
  );

  const removePoured = useCallback((id) => {
    setPouredItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const totalPouredArea = useMemo(
    () =>
      pouredItems.reduce((sum, item) => {
        const c = countriesByIso3.get(item.iso3);
        return sum + (c ? Number(c.area_km2) || 0 : 0);
      }, 0),
    [pouredItems, countriesByIso3]
  );

  const targetArea = targetCountry ? Number(targetCountry.area_km2) || 0 : 0;
  const fraction = targetArea > 0 ? totalPouredArea / targetArea : 0;
  const percent = fraction * 100;
  const isComplete = percent >= 100;

  const loading = countries.length === 0 && !error;
  const mapLoading = !featureMap && !mapError;

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Fill the country</h1>
        <p className="app-hero__subtitle">
          Pick a country as the container, then pour others into it, one by one — each one&apos;s
          real area raises the fill level inside the container&apos;s own outline. Try filling
          Russia with Spain, the UK, Panama, and a few more, until it&apos;s full.
        </p>
      </div>

      <CompareSubNav />

      {error && (
        <div className="status status--error area-fill-status">
          <span>Couldn&apos;t load the countries: {error}</span>
        </div>
      )}

      {loading && !error && (
        <div className="status area-fill-status">
          <span className="status__spinner" aria-hidden="true" />
          <span>Loading countries…</span>
        </div>
      )}

      {!loading && !error && (
        <div className="area-fill-layout">
          <div className="area-fill-main">
            <div className="area-fill-target-picker">
              <label htmlFor="area-fill-target">Container country</label>
              <select
                id="area-fill-target"
                value={targetIso3}
                onChange={(e) => handleSelectTarget(e.target.value)}
              >
                {sortedCountries.map((c) => (
                  <option key={c.iso3} value={c.iso3}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-text"
                onClick={emptyContainer}
                disabled={pouredItems.length === 0}
              >
                ↺ Empty the container
              </button>
            </div>

            {targetCountry && (
              <div className="area-fill-progress">
                <div className="area-fill-progress__row">
                  <span className="area-fill-progress__label">
                    Filled: {Math.round(percent)}% of {targetCountry.name}
                  </span>
                  <span className="area-fill-progress__value">
                    {formatAreaCompact(totalPouredArea)} / {formatArea(targetCountry.area_km2)}
                  </span>
                </div>
                <div className="area-fill-progress__bar">
                  <div
                    className={"area-fill-progress__fill" + (isComplete ? " is-complete" : "")}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                {isComplete && (
                  <p className="area-fill-progress__note">
                    🎉 That&apos;s the whole surface of {targetCountry.name} — full to the brim! Keep
                    pouring or try another country.
                  </p>
                )}
              </div>
            )}

            {mapError && (
              <div className="status status--error">
                <span>Couldn&apos;t load the outline: {mapError}</span>
              </div>
            )}

            {mapLoading && !mapError && (
              <div className="status">
                <span className="status__spinner" aria-hidden="true" />
                <span>Loading outline…</span>
              </div>
            )}

            {!mapLoading && !mapError && targetCountry && (
              <AreaFillCanvas
                targetCountry={targetCountry}
                targetFeature={targetFeature}
                filledFraction={fraction}
              />
            )}

            <div className="area-fill-used">
              <h2 className="area-fill-used__title">Poured in ({pouredItems.length})</h2>
              <div className="compare-zone__chips">
                {pouredItems.length === 0 ? (
                  <span className="compare-zone__placeholder">
                    Nothing poured in yet — tap a country from the list.
                  </span>
                ) : (
                  pouredItems.map((item) => {
                    const c = countriesByIso3.get(item.iso3);
                    if (!c) return null;
                    return (
                      <div key={item.id} className="compare-chip">
                        <span>
                          {c.flag} {c.name} · {formatAreaCompact(c.area_km2)}
                        </span>
                        <button
                          type="button"
                          className="compare-chip__remove"
                          aria-label={`Remove ${c.name}`}
                          onClick={() => removePoured(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <AreaFillPalette
            countries={countries}
            excludeIso3={targetIso3}
            targetCountry={targetCountry}
            onAdd={addPoured}
          />
        </div>
      )}
    </>
  );
}
