"use client";

import { useEffect, useMemo, useState } from "react";
import CountryPictogram from "./CountryPictogram";
import GdpPerCapitaPictogram, { PERSON_HEIGHT as GDP_PER_CAPITA_PERSON_HEIGHT, bagStackHeight } from "./GdpPerCapitaPictogram";
import GenericIndicatorPictogram, { ICON_HEIGHT as GENERIC_ICON_HEIGHT, iconGridHeight } from "./GenericIndicatorPictogram";
import TrueScalePanel from "./TrueScalePanel";
import CompareStatsGrid from "./CompareCharts";
import { INDICATORS, CATEGORIES } from "../lib/indicators";
import { loadWorld, featuresByAlpha3 } from "../lib/worldAtlas";
import { niceIconValue, pictogramViewPad, iconCountForValue } from "../lib/pictogram";
import { formatNumber, formatIndicatorValue } from "../lib/format";

// How many bags the biggest GDP in the group should show, roughly — kept
// lower than the population target since a bag icon is visually "heavier"
// than a personita.
const GDP_TARGET_MAX_ICONS = 90;

// Same idea for the "GDP per capita" view, but capped lower: it's one
// personita next to its own stack of bags, so there's much less room and
// no need for as many icons to read clearly.
const GDP_PER_CAPITA_TARGET_MAX_ICONS = 20;

// Placeholder-visual indicators (see GenericIndicatorPictogram) can show
// more icons than the money-bag views since a lone personita is a much
// simpler shape.
const GENERIC_TARGET_MAX_ICONS = 30;

const BOX_SIZE = 260; // px — size of the largest country in the compared set
// Height reserved for each country's canvas: the reference size plus the
// padding the LARGEST country (the one that sets the scale) needs so its
// 3D edge and shadow don't get clipped or overlap the badge/title.
const CANVAS_HEIGHT = BOX_SIZE + pictogramViewPad(BOX_SIZE) * 2;

// .pictogram-canvas's own all-around padding (app/globals.css) — reused
// here so the GDP-per-capita/generic canvases below are sized to actually
// fit their (much smaller) content instead of borrowing the silhouette
// canvas's height and leaving a big gap above the figures.
const PICTOGRAM_CANVAS_PADDING = 20;

// Indicators bundled into the "Density" view below, so they aren't also
// offered as their own entries in the selector.
const DENSITY_BUNDLE_KEYS = new Set(["population", "area_km2", "population_density"]);

// Keys with their own explicit entry below (a bundle or a custom image),
// so they're skipped when the generic "everything else" entries are
// derived from INDICATORS further down.
const CUSTOM_VIEW_KEYS = new Set([...DENSITY_BUNDLE_KEYS, "gdp_usd", "gdp_per_capita_usd"]);

// One selectable entry per indicator the comparison screen can show. Only
// one is active at a time — picking one swaps the image. "Density" bundles
// the three baseline stats (area, population, population density) because
// that's what the real-silhouette pictogram already visualizes together.
// "GDP" and "GDP per capita" have their own money-bag pictograms. Every
// other indicator uses `isGeneric: true` — a placeholder visual (repeated
// personitas, see GenericIndicatorPictogram) until each gets its own
// custom image. `needsMap` gates the "Loading silhouettes…" wait on only
// the views that actually draw a country silhouette from the world atlas.
const COMPARISON_INDICATORS = [
  {
    key: "density",
    label: "Density",
    category: "Geography",
    needsMap: true,
    description: "Real silhouettes at relative scale based on area — the largest country sets the scale.",
  },
  {
    key: "gdp_usd",
    label: "GDP",
    category: "Economy",
    needsMap: true,
    description: "A stack of money bags per country — each bag represents a fixed share of GDP.",
  },
  {
    key: "gdp_per_capita_usd",
    label: "GDP per capita",
    category: "Economy",
    needsMap: false,
    description: "One personita per country, next to a stack of money bags sized to its GDP per capita.",
  },
  ...INDICATORS.filter((ind) => !CUSTOM_VIEW_KEYS.has(ind.key)).map((ind) => ({
    key: ind.key,
    label: ind.label,
    category: ind.category,
    needsMap: false,
    isGeneric: true,
    unit: ind.unit,
    description: `${ind.label} — a dedicated visual is coming soon. For now, each icon stands for a fixed share of the value.`,
  })),
];

const DEFAULT_INDICATOR_KEY = "density";

// "True scale" box: initial size (height in px, for the largest country in
// the group) and limits for the enlarge/shrink buttons.
const TRUE_SCALE_DEFAULT = 96;
const TRUE_SCALE_MIN = 56;
const TRUE_SCALE_MAX = 220;
const TRUE_SCALE_STEP = 24;

// The Compare results screen: a category filter (shared by the "Compare
// by" tabs and the stats grid below), the visual comparison for whichever
// indicator is active, and the individual-stats card grid. Lives inline in
// the results screen of app/compare/page.js (that page owns the "← Change
// countries" / Share / Download CSV header above this).
export default function CompareResults({ countries }) {
  const [featureMap, setFeatureMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [category, setCategory] = useState("All");
  const [activeIndicator, setActiveIndicator] = useState(DEFAULT_INDICATOR_KEY);
  const [trueScaleSize, setTrueScaleSize] = useState(TRUE_SCALE_DEFAULT);

  const visibleIndicators = useMemo(
    () => COMPARISON_INDICATORS.filter((ind) => category === "All" || ind.category === category),
    [category]
  );

  // If switching category hides the active tab, fall back to the first
  // tab still visible instead of showing an indicator that's no longer in
  // the chip list above it.
  const activeView =
    visibleIndicators.find((ind) => ind.key === activeIndicator) ?? visibleIndicators[0];

  useEffect(() => {
    if (featureMap) return;
    loadWorld()
      .then((world) => setFeatureMap(featuresByAlpha3(world)))
      .catch((err) => setMapError(err.message));
  }, [featureMap]);

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

  const maxGdpPerCapita = useMemo(
    () => Math.max(...countries.map((c) => Number(c.gdp_per_capita_usd) || 0), 1),
    [countries]
  );
  const gdpPerCapitaIconValue = useMemo(
    () => niceIconValue(maxGdpPerCapita, GDP_PER_CAPITA_TARGET_MAX_ICONS),
    [maxGdpPerCapita]
  );

  // Sized to this view's actual content (a person + however many bags the
  // richest country in the group needs), not to CountryPictogram's much
  // taller silhouette canvas — see PERSON_HEIGHT/bagStackHeight in
  // GdpPerCapitaPictogram for why reusing CANVAS_HEIGHT left a big empty
  // gap above the figures.
  const gdpPerCapitaCanvasHeight = useMemo(() => {
    const maxBagCount = Math.max(
      ...countries.map((c) => iconCountForValue(Number(c.gdp_per_capita_usd) || 0, gdpPerCapitaIconValue)),
      0
    );
    return (
      Math.max(GDP_PER_CAPITA_PERSON_HEIGHT, bagStackHeight(maxBagCount)) + PICTOGRAM_CANVAS_PADDING * 2
    );
  }, [countries, gdpPerCapitaIconValue]);

  // Same idea, but for whichever placeholder ("isGeneric") indicator is
  // currently active — each has its own value range, so the icon count
  // (and therefore the canvas height) is computed per-indicator on demand
  // rather than for all six up front.
  const genericIconValue = useMemo(() => {
    if (!activeView?.isGeneric) return 0;
    const max = Math.max(...countries.map((c) => Number(c[activeView.key]) || 0), 1);
    return niceIconValue(max, GENERIC_TARGET_MAX_ICONS);
  }, [countries, activeView]);

  const genericCanvasHeight = useMemo(() => {
    if (!activeView?.isGeneric) return CANVAS_HEIGHT;
    const maxCount = Math.max(
      ...countries.map((c) => iconCountForValue(Number(c[activeView.key]) || 0, genericIconValue)),
      0
    );
    return Math.max(GENERIC_ICON_HEIGHT, iconGridHeight(maxCount)) + PICTOGRAM_CANVAS_PADDING * 2;
  }, [countries, activeView, genericIconValue]);

  if (!activeView) return null;

  const needsMap = activeView.needsMap;
  const mapReady = !needsMap || (featureMap && !mapError);

  return (
    <>
      <div className="compare-category-filter">
        <span className="compare-category-filter__label">Category</span>
        <div className="compare-category-filter__list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={"category-chip" + (category === cat ? " is-active" : "")}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="compare-modal">
        <header className="compare-modal__header">
          <div>
            <h2>Visual comparison</h2>
            <p>{activeView.description}</p>
          </div>
        </header>

        <div className="compare-modal__indicators">
          <span className="compare-modal__indicators-label">Compare by:</span>
          <div className="compare-modal__indicators-list">
            {visibleIndicators.map((ind) => (
              <label className="indicator-chip" key={ind.key}>
                <input
                  type="radio"
                  name="comparison-indicator"
                  checked={activeView.key === ind.key}
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

              {activeView.key === "gdp_per_capita_usd" && (
                <div className="pictogram-gdp-row">
                  <div className="pictogram-countries">
                    {countries.map((country) => (
                      <GdpPerCapitaPictogram
                        key={country.iso3}
                        country={country}
                        iconValue={gdpPerCapitaIconValue}
                        canvasHeight={gdpPerCapitaCanvasHeight}
                      />
                    ))}
                  </div>
                  <p className="pictogram-row__legend">
                    💰 Each bag represents {formatIndicatorValue(gdpPerCapitaIconValue, "US$")} of GDP per capita.
                  </p>
                </div>
              )}

              {activeView.isGeneric && (
                <div className="pictogram-gdp-row">
                  <div className="pictogram-countries">
                    {countries.map((country) => (
                      <GenericIndicatorPictogram
                        key={country.iso3}
                        country={country}
                        label={activeView.label}
                        value={country[activeView.key]}
                        unit={activeView.unit}
                        iconValue={genericIconValue}
                        canvasHeight={genericCanvasHeight}
                      />
                    ))}
                  </div>
                  <p className="pictogram-row__legend">
                    🧍 Each icon represents {formatIndicatorValue(genericIconValue, activeView.unit)}.
                  </p>
                </div>
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

      <CompareStatsGrid countries={countries} category={category} />
    </>
  );
}
