"use client";

import { useEffect, useMemo, useState } from "react";
import CountryPictogram from "./CountryPictogram";
import TrueScalePanel from "./TrueScalePanel";
import { INDICATORS } from "../lib/indicators";
import { loadWorld, featuresByAlpha3 } from "../lib/worldAtlas";
import { niceIconValue, pictogramViewPad } from "../lib/pictogram";
import { buildStatComparisons } from "../lib/compareInsights";
import { formatNumber } from "../lib/format";

const BOX_SIZE = 260; // px — size of the largest country in the compared set
// Height reserved for each country's canvas: the reference size plus the
// padding the LARGEST country (the one that sets the scale) needs so its
// 3D edge and shadow don't get clipped or overlap the badge/title.
const CANVAS_HEIGHT = BOX_SIZE + pictogramViewPad(BOX_SIZE) * 2;
const BASELINE_KEYS = new Set(["population", "area_km2", "population_density"]);
const EXTRA_INDICATORS = INDICATORS.filter((i) => !BASELINE_KEYS.has(i.key));
const DEFAULT_EXTRA_KEYS = ["gdp_per_capita_usd", "life_expectancy_years"];

// "True scale" box: initial size (height in px, for the largest country in
// the group) and limits for the enlarge/shrink buttons.
const TRUE_SCALE_DEFAULT = 96;
const TRUE_SCALE_MIN = 56;
const TRUE_SCALE_MAX = 220;
const TRUE_SCALE_STEP = 24;

// Statistics that are always compared, in addition to whatever the user
// checks in the extra-indicators checklist.
const BASELINE_COMPARISON_STATS = [
  { key: "area_km2", label: "Area" },
  { key: "population", label: "Population" },
  { key: "population_density", label: "Density" },
];

// Dedicated comparison screen: each country's real silhouette at relative
// scale (the largest sets the scale), with a grid of icons representing
// population, labeled figures, and a legend. Opens as a full-screen
// overlay (doesn't change the URL).
export default function CompareModal({ open, countries, onClose }) {
  const [featureMap, setFeatureMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [extraKeys, setExtraKeys] = useState(DEFAULT_EXTRA_KEYS);
  const [trueScaleSize, setTrueScaleSize] = useState(TRUE_SCALE_DEFAULT);

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || featureMap) return;
    loadWorld()
      .then((world) => setFeatureMap(featuresByAlpha3(world)))
      .catch((err) => setMapError(err.message));
  }, [open, featureMap]);

  const maxArea = useMemo(
    () => Math.max(...countries.map((c) => Number(c.area_km2) || 0), 1),
    [countries]
  );
  const maxPopulation = useMemo(
    () => Math.max(...countries.map((c) => Number(c.population) || 0), 1),
    [countries]
  );
  const iconValue = useMemo(() => niceIconValue(maxPopulation), [maxPopulation]);
  const largestCountry = useMemo(
    () => countries.find((c) => Number(c.area_km2) === maxArea) || countries[0],
    [countries, maxArea]
  );

  const comparisonGroups = useMemo(() => {
    const extraStats = extraKeys
      .map((key) => INDICATORS.find((i) => i.key === key))
      .filter(Boolean)
      .map((ind) => ({ key: ind.key, label: ind.label }));

    return [...BASELINE_COMPARISON_STATS, ...extraStats]
      .map((stat) => ({ ...stat, items: buildStatComparisons(countries, stat.key, stat.label) }))
      .filter((group) => group.items.length > 0);
  }, [countries, extraKeys]);

  function toggleExtra(key) {
    setExtraKeys((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  }

  if (!open) return null;

  return (
    <div className="compare-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="compare-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Visual comparison of countries"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="compare-modal__header">
          <div>
            <h2>Visual comparison</h2>
            <p>Real silhouettes at relative scale based on area — the largest country sets the scale.</p>
          </div>
          <button type="button" className="compare-modal__close" aria-label="Close comparison" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="compare-modal__indicators">
          <span className="compare-modal__indicators-label">Extra data to show:</span>
          <div className="compare-modal__indicators-list">
            {EXTRA_INDICATORS.map((ind) => (
              <label className="indicator-chip" key={ind.key}>
                <input
                  type="checkbox"
                  checked={extraKeys.includes(ind.key)}
                  onChange={() => toggleExtra(ind.key)}
                />
                <span>{ind.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="compare-modal__body">
          {mapError && (
            <div className="status status--error">
              <span>Couldn&apos;t load the map: {mapError}</span>
            </div>
          )}

          {!mapError && !featureMap && (
            <div className="status">
              <span className="status__spinner" aria-hidden="true" />
              <span>Loading silhouettes…</span>
            </div>
          )}

          {featureMap && (
            <>
              <div className="pictogram-row">
                <TrueScalePanel
                  countries={countries}
                  featureMap={featureMap}
                  maxArea={maxArea}
                  size={trueScaleSize}
                  onIncrease={() => setTrueScaleSize((s) => Math.min(s + TRUE_SCALE_STEP, TRUE_SCALE_MAX))}
                  onDecrease={() => setTrueScaleSize((s) => Math.max(s - TRUE_SCALE_STEP, TRUE_SCALE_MIN))}
                  canIncrease={trueScaleSize < TRUE_SCALE_MAX}
                  canDecrease={trueScaleSize > TRUE_SCALE_MIN}
                />

                <div className="pictogram-countries">
                  {countries.map((country) => (
                    <CountryPictogram
                      key={country.iso3}
                      country={country}
                      feature={featureMap.get(country.iso3)}
                      boxSize={BOX_SIZE}
                      canvasHeight={CANVAS_HEIGHT}
                      iconValue={iconValue}
                      extraIndicatorKeys={extraKeys}
                    />
                  ))}
                </div>
              </div>

              {comparisonGroups.length > 0 && (
                <section className="compare-insights">
                  <h3>Key differences</h3>
                  <div className="compare-insights__groups">
                    {comparisonGroups.map((group) => (
                      <div className="compare-insights__group" key={group.key}>
                        <h4>{group.label}</h4>
                        <ul>
                          {group.items.map((item) => (
                            <li key={item.key}>{item.text}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="compare-modal__legend">
          <span className="compare-modal__legend-icon" aria-hidden="true">
            🧍
          </span>
          <span>
            Each icon represents {formatNumber(iconValue)} people. Size scale based on the real area
            of {largestCountry?.name} (the largest in the group).
          </span>
        </footer>
      </div>
    </div>
  );
}
