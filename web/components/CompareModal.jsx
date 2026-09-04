"use client";

import { useEffect, useMemo, useState } from "react";
import CountryPictogram from "./CountryPictogram";
import TrueScalePanel from "./TrueScalePanel";
import { INDICATORS } from "../lib/indicators";
import { loadWorld, featuresByAlpha3 } from "../lib/worldAtlas";
import { niceIconValue, pictogramViewPad } from "../lib/pictogram";
import { buildStatComparisons } from "../lib/compareInsights";
import { formatNumber, formatIndicatorValue } from "../lib/format";

// How many bags the biggest GDP in the group should show, roughly — kept
// lower than the population target since a bag icon is visually "heavier"
// than a personita.
const GDP_TARGET_MAX_ICONS = 90;

const BOX_SIZE = 260; // px — size of the largest country in the compared set
// Height reserved for each country's canvas: the reference size plus the
// padding the LARGEST country (the one that sets the scale) needs so its
// 3D edge and shadow don't get clipped or overlap the badge/title.
const CANVAS_HEIGHT = BOX_SIZE + pictogramViewPad(BOX_SIZE) * 2;

// Indicators bundled into the "Density" view below, so they aren't also
// offered as their own (imageless) entries in the selector.
const DENSITY_BUNDLE_KEYS = new Set(["population", "area_km2", "population_density"]);

// One selectable entry per indicator the comparison screen can show. Only
// one is active at a time — picking one swaps both the image (when it has
// one) and the "Key differences" below it. "Density" bundles the three
// baseline stats (area, population, population density) because that's
// what the real-silhouette pictogram already visualizes together: the
// personitas scattered inside each country's true-scale shape read as a
// literal density map. "GDP" has its own money-bag pictogram. Every other
// indicator is stats-only for now (no image yet) — flip `hasImage` and add
// a rendering branch below once its visual is designed.
const COMPARISON_INDICATORS = [
  {
    key: "density",
    label: "Density",
    hasImage: true,
    description: "Real silhouettes at relative scale based on area — the largest country sets the scale.",
    statKeys: [
      { key: "area_km2", label: "Area" },
      { key: "population", label: "Population" },
      { key: "population_density", label: "Density" },
    ],
  },
  {
    key: "gdp_usd",
    label: "GDP",
    hasImage: true,
    description: "A stack of money bags per country — each bag represents a fixed share of GDP.",
    statKeys: [{ key: "gdp_usd", label: "GDP" }],
  },
  ...INDICATORS.filter((ind) => !DENSITY_BUNDLE_KEYS.has(ind.key) && ind.key !== "gdp_usd").map((ind) => ({
    key: ind.key,
    label: ind.label,
    hasImage: false,
    description: `${ind.label} comparison — a dedicated visual is coming soon. For now, here's how the group compares.`,
    statKeys: [{ key: ind.key, label: ind.label }],
  })),
];

const DEFAULT_INDICATOR_KEY = "density";

// "True scale" box: initial size (height in px, for the largest country in
// the group) and limits for the enlarge/shrink buttons.
const TRUE_SCALE_DEFAULT = 96;
const TRUE_SCALE_MIN = 56;
const TRUE_SCALE_MAX = 220;
const TRUE_SCALE_STEP = 24;

// Dedicated comparison screen: pick one indicator at a time from the chips
// below — it drives both the image (a real-silhouette population map for
// "Density", money bags for "GDP", nothing yet for the rest) and the "Key
// differences" sentences underneath. Opens as a full-screen overlay
// (doesn't change the URL).
export default function CompareModal({ open, countries, onClose }) {
  const [featureMap, setFeatureMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [activeIndicator, setActiveIndicator] = useState(DEFAULT_INDICATOR_KEY);
  const [trueScaleSize, setTrueScaleSize] = useState(TRUE_SCALE_DEFAULT);

  const activeView =
    COMPARISON_INDICATORS.find((ind) => ind.key === activeIndicator) ?? COMPARISON_INDICATORS[0];

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

  const maxGdp = useMemo(
    () => Math.max(...countries.map((c) => Number(c.gdp_usd) || 0), 1),
    [countries]
  );
  const gdpIconValue = useMemo(() => niceIconValue(maxGdp, GDP_TARGET_MAX_ICONS), [maxGdp]);

  const comparisonGroups = useMemo(() => {
    return activeView.statKeys
      .map((stat) => ({ ...stat, items: buildStatComparisons(countries, stat.key, stat.label) }))
      .filter((group) => group.items.length > 0);
  }, [countries, activeView]);

  if (!open) return null;

  const needsMap = activeView.hasImage;
  const mapReady = !needsMap || (featureMap && !mapError);

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
            <p>{activeView.description}</p>
          </div>
          <button type="button" className="compare-modal__close" aria-label="Close comparison" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="compare-modal__indicators">
          <span className="compare-modal__indicators-label">Compare by:</span>
          <div className="compare-modal__indicators-list">
            {COMPARISON_INDICATORS.map((ind) => (
              <label className="indicator-chip" key={ind.key}>
                <input
                  type="radio"
                  name="comparison-indicator"
                  checked={activeIndicator === ind.key}
                  onChange={() => setActiveIndicator(ind.key)}
                />
                <span>{ind.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="compare-modal__body">
          {needsMap && mapError && (
            <div className="status status--error">
              <span>Couldn&apos;t load the map: {mapError}</span>
            </div>
          )}

          {needsMap && !mapError && !featureMap && (
            <div className="status">
              <span className="status__spinner" aria-hidden="true" />
              <span>Loading silhouettes…</span>
            </div>
          )}

          {mapReady && (
            <>
              {activeView.key === "density" && (
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
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeView.key === "gdp_usd" && (
                <div className="pictogram-gdp-row">
                  <div className="pictogram-countries">
                    {countries.map((country) => (
                      <CountryPictogram
                        key={country.iso3}
                        country={country}
                        feature={featureMap.get(country.iso3)}
                        boxSize={BOX_SIZE}
                        canvasHeight={CANVAS_HEIGHT}
                        iconValue={gdpIconValue}
                        metric="gdp"
                        showStats={false}
                      />
                    ))}
                  </div>
                  <p className="pictogram-row__legend">
                    💰 Each bag represents {formatIndicatorValue(gdpIconValue, "US$")} of GDP.
                  </p>
                </div>
              )}

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

        {activeView.key === "density" && mapReady && (
          <footer className="compare-modal__legend">
            <span className="compare-modal__legend-icon" aria-hidden="true">
              🧍
            </span>
            <span>
              Each icon represents {formatNumber(iconValue)} people. Size scale based on the real area
              of {largestCountry?.name} (the largest in the group).
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
