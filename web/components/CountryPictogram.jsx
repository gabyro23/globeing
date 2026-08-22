"use client";

import { createElement, useMemo } from "react";
import * as d3 from "d3";
import {
  extractPolygons,
  samplePictogramPoints,
  iconCountForValue,
  pictogramExtrusionDepth,
  pictogramViewPad,
  PICTOGRAM_ICON_WIDTH as ICON_WIDTH,
  PICTOGRAM_ICON_HEIGHT as ICON_HEIGHT,
} from "../lib/pictogram";
import { formatArea, formatPopulation, formatIndicatorValue } from "../lib/format";
import { INDICATORS } from "../lib/indicators";

const EXTRUSION_STEPS = 10; // thin stacked layers that build the silhouette's 3D "edge"

const BASELINE_KEYS = new Set(["population", "area_km2", "population_density"]);
const indicatorByKey = new Map(INDICATORS.map((i) => [i.key, i]));

// --- "Personita" icon set (from the project's Personitas design doc) ---
// Flat vector figures, same outfit (yellow shirt, dark pants), six poses
// for variety across the population grid, plus a money-bag icon used when
// the pictogram represents GDP instead of population. Colors are fixed
// (not theme-aware) — like the logo mark, these are meant to read the
// same regardless of light/dark mode.
const SHIRT = "#E8B93C";
const SHIRT_D = "#C9971F";
const SHIRT_L = "#F0C75A";
const PANT = "#1E2A2C";
const PANT_D = "#0F1719";
const HAIR = "#24312F";
const SKIN = "#C8A184";

const POSES = {
  front: [
    ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: SHIRT }],
    ["rect", { x: 37.6, y: 39, width: 5.4, height: 30, rx: 2.7, fill: SHIRT_D }],
    ["rect", { x: 24, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT }],
    ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D }],
    ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: SHIRT }],
    ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: SHIRT_D }],
    ["rect", { x: 27, y: 30, width: 6, height: 8, fill: SKIN }],
    ["circle", { cx: 30, cy: 25, r: 9, fill: HAIR }],
  ],
  back: [
    ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 16.6, y: 39, width: 5.4, height: 31, rx: 2.7, fill: "#D9A82C" }],
    ["rect", { x: 38, y: 39, width: 5.4, height: 31, rx: 2.7, fill: SHIRT_D }],
    ["rect", { x: 23.4, y: 68, width: 5.8, height: 45, rx: 2.9, fill: "#182223" }],
    ["rect", { x: 30.8, y: 68, width: 5.8, height: 45, rx: 2.9, fill: PANT_D }],
    ["rect", { x: 20.6, y: 36, width: 18.8, height: 34, rx: 6, fill: "#D9A82C" }],
    ["rect", { x: 33, y: 36, width: 6.4, height: 34, rx: 5, fill: "#B98B18" }],
    ["rect", { x: 27, y: 30, width: 6, height: 8, fill: "#B08F72" }],
    ["circle", { cx: 30, cy: 25, r: 9, fill: "#1C2725" }],
  ],
  right: [
    ["ellipse", { cx: 30, cy: 114, rx: 9, ry: 3.2, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 27.6, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT_D }],
    ["rect", { x: 30.4, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT }],
    ["rect", { x: 26, y: 36, width: 11, height: 34, rx: 5, fill: SHIRT }],
    ["rect", { x: 32.6, y: 36, width: 4.4, height: 34, rx: 4, fill: SHIRT_D }],
    ["rect", { x: 29.6, y: 39, width: 4.6, height: 29, rx: 2.3, fill: SHIRT_L }],
    ["rect", { x: 29.6, y: 30, width: 5, height: 8, fill: SKIN }],
    ["circle", { cx: 31.6, cy: 25, r: 8.2, fill: HAIR }],
    ["rect", { x: 38, y: 23.4, width: 3.4, height: 4.4, rx: 1.7, fill: SKIN }],
  ],
  left: [
    ["ellipse", { cx: 30, cy: 114, rx: 9, ry: 3.2, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 27, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT_D }],
    ["rect", { x: 24.2, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT }],
    ["rect", { x: 23, y: 36, width: 11, height: 34, rx: 5, fill: SHIRT }],
    ["rect", { x: 30.6, y: 36, width: 3.4, height: 34, rx: 3, fill: SHIRT_D }],
    ["rect", { x: 25.8, y: 39, width: 4.6, height: 29, rx: 2.3, fill: SHIRT_L }],
    ["rect", { x: 25.4, y: 30, width: 5, height: 8, fill: SKIN }],
    ["circle", { cx: 28.4, cy: 25, r: 8.2, fill: HAIR }],
    ["rect", { x: 18.6, y: 23.4, width: 3.4, height: 4.4, rx: 1.7, fill: SKIN }],
  ],
  walk: [
    ["ellipse", { cx: 30, cy: 114, rx: 15, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 25, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D, transform: "rotate(13 27.8 70)" }],
    ["rect", { x: 29.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT, transform: "rotate(-14 32.2 70)" }],
    ["rect", { x: 21.4, y: 36, width: 18, height: 34, rx: 6, fill: SHIRT }],
    ["rect", { x: 32.4, y: 36, width: 7, height: 34, rx: 5, fill: SHIRT_D }],
    ["rect", { x: 17.4, y: 39, width: 5.4, height: 29, rx: 2.7, fill: SHIRT, transform: "rotate(-16 20.1 41)" }],
    ["rect", { x: 38, y: 39, width: 5.4, height: 29, rx: 2.7, fill: SHIRT_D, transform: "rotate(15 40.7 41)" }],
    ["rect", { x: 27.4, y: 30, width: 6, height: 8, fill: SKIN }],
    ["circle", { cx: 30.4, cy: 25, r: 9, fill: HAIR }],
  ],
  wave: [
    ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: SHIRT }],
    ["rect", { x: 37.6, y: 20, width: 5.4, height: 28, rx: 2.7, fill: SHIRT_D, transform: "rotate(18 40.3 46)" }],
    ["rect", { x: 25.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT, transform: "rotate(-7 28.2 70)" }],
    ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D, transform: "rotate(6 33.2 70)" }],
    ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: SHIRT }],
    ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: SHIRT_D }],
    ["rect", { x: 27, y: 30, width: 6, height: 8, fill: SKIN }],
    ["circle", { cx: 29.4, cy: 25, r: 9, fill: HAIR }],
  ],
};
const POSE_NAMES = ["front", "back", "right", "left", "walk", "wave"];

// Money bag — same visual language as the personitas (flat shapes, side
// shading, ground shadow) — used as the icon when a pictogram is showing
// GDP instead of population.
const BAG = [
  ["ellipse", { cx: 30, cy: 114, rx: 16, ry: 4, fill: PANT, opacity: 0.16 }],
  ["ellipse", { cx: 30, cy: 84, rx: 23, ry: 29, fill: SHIRT }],
  ["ellipse", { cx: 39, cy: 86, rx: 14, ry: 27, fill: SHIRT_D, opacity: 0.55 }],
  ["rect", { x: 21, y: 40, width: 18, height: 18, rx: 4, fill: SHIRT }],
  ["rect", { x: 31, y: 40, width: 8, height: 18, rx: 4, fill: SHIRT_D }],
  ["rect", { x: 18.5, y: 49, width: 23, height: 8, rx: 4, fill: PANT }],
  ["rect", { x: 23, y: 31, width: 14, height: 11, rx: 5.5, fill: SHIRT_L }],
  [
    "text",
    { x: 26, y: 96, fontSize: 30, fontWeight: 800, fill: PANT_D, fontFamily: "Helvetica,Arial,sans-serif", opacity: 0.85 },
    "$",
  ],
];

function renderPrimitives(list) {
  return list.map(([tag, props, text], i) => createElement(tag, { key: i, ...props }, text));
}

// Draws a country's silhouette on a canvas of the SAME size for every
// compared country (so the icon grid reads clearly no matter how small
// the country is), with 3D relief (gradient + extruded edge + shadow) and
// a grid of icons with volume representing either its population
// (personitas, cycling through 6 poses) or its GDP (money bags), based on
// `metric`. Below it, the key data table (area, population, density +
// extras) — omitted when `showStats` is false, for a secondary pictogram
// (e.g. the GDP row) that shouldn't repeat the main stats. The REAL-size
// mini-map between countries lives separately, in TrueScalePanel (a
// single shared box inside pictogram-row).
export default function CountryPictogram({
  country,
  feature,
  boxSize,
  canvasHeight,
  iconValue,
  extraIndicatorKeys = [],
  metric = "population",
  showStats = true,
}) {
  const fillGradientId = `pictogram-fill-${country.iso3}-${metric}`;
  const metricValue = metric === "gdp" ? Number(country.gdp_usd) || 0 : Number(country.population) || 0;

  const layout = useMemo(() => {
    if (!feature) return null;

    const targetBoxPx = boxSize; // same canvas size for every country
    const depth = pictogramExtrusionDepth(targetBoxPx); // thickness of the 3D edge
    const viewPad = pictogramViewPad(targetBoxPx); // leaves room for the edge + soft shadow

    const centroid = d3.geoCentroid(feature);
    const projection = d3
      .geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .fitSize([targetBoxPx, targetBoxPx], feature);
    const pathGenerator = d3.geoPath(projection);
    const pathD = pathGenerator(feature);
    const bounds = pathGenerator.bounds(feature);
    if (!pathD || !bounds) return null;

    const [[x0, y0], [x1, y1]] = bounds;
    const polygons = extractPolygons(feature.geometry, projection);
    const iconCount = iconCountForValue(metricValue, iconValue);
    const points = samplePictogramPoints({
      polygons,
      bbox: { minX: x0, minY: y0, maxX: x1, maxY: y1 },
      targetCount: iconCount,
    });

    const extrusionSteps = Array.from({ length: EXTRUSION_STEPS }, (_, i) => {
      const t = (i + 1) / EXTRUSION_STEPS;
      return { dx: depth * t, dy: depth * 1.3 * t };
    });

    return {
      pathD,
      points,
      extrusionSteps,
      shadowOffset: { dx: depth * 1.6, dy: depth * 2.1 },
      requestedIconCount: iconCount,
      shownIconCount: points.length,
      width: x1 - x0 + viewPad * 2,
      height: y1 - y0 + viewPad * 2,
      viewBox: `${x0 - viewPad} ${y0 - viewPad} ${x1 - x0 + viewPad * 2} ${y1 - y0 + viewPad * 2}`,
    };
  }, [feature, metricValue, boxSize, iconValue]);

  const extraStats = extraIndicatorKeys
    .map((key) => indicatorByKey.get(key))
    .filter((ind) => ind && !BASELINE_KEYS.has(ind.key));

  const iconAlt = metric === "gdp" ? "money bags representing its GDP" : "icons representing its population";

  return (
    <div className="pictogram-column">
      <h3 className="pictogram-column__title">
        {country.flag} {country.name}
      </h3>

      <div className="pictogram-canvas" style={{ height: canvasHeight ?? boxSize }}>
        {layout ? (
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={layout.viewBox}
            className="pictogram-svg"
            role="img"
            aria-label={`Silhouette of ${country.name} with ${iconAlt}`}
          >
            <defs>
              <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--sage-light)" />
                <stop offset="55%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-deep)" />
              </linearGradient>
              {metric === "gdp" ? (
                <symbol id={`pictogram-bag-${country.iso3}`} viewBox="0 0 60 120">
                  {renderPrimitives(BAG)}
                </symbol>
              ) : (
                POSE_NAMES.map((name) => (
                  <symbol key={name} id={`pictogram-pose-${country.iso3}-${name}`} viewBox="0 0 60 120">
                    {renderPrimitives(POSES[name])}
                  </symbol>
                ))
              )}
            </defs>

            {/* soft ambient shadow, gives the sense that the silhouette "floats" */}
            <path
              d={layout.pathD}
              className="pictogram-shadow"
              transform={`translate(${layout.shadowOffset.dx} ${layout.shadowOffset.dy})`}
            />

            {/* extruded edge: thin stacked layers simulate the 3D thickness */}
            {layout.extrusionSteps.map((step, i) => (
              <path
                key={i}
                d={layout.pathD}
                className="pictogram-extrusion"
                transform={`translate(${step.dx} ${step.dy})`}
              />
            ))}

            {/* top face */}
            <path d={layout.pathD} className="pictogram-silhouette" fill={`url(#${fillGradientId})`} />

            <g className="pictogram-icon-layer">
              {layout.points.map(([x, y], i) => (
                <use
                  key={i}
                  href={
                    metric === "gdp"
                      ? `#pictogram-bag-${country.iso3}`
                      : `#pictogram-pose-${country.iso3}-${POSE_NAMES[i % POSE_NAMES.length]}`
                  }
                  x={x - ICON_WIDTH / 2}
                  y={y - ICON_HEIGHT / 2}
                  width={ICON_WIDTH}
                  height={ICON_HEIGHT}
                  className="pictogram-icon"
                />
              ))}
            </g>
          </svg>
        ) : (
          <p className="pictogram-missing">No map data available for this country.</p>
        )}
      </div>

      {showStats ? (
        <dl className="pictogram-stats">
          <div>
            <dt>Area</dt>
            <dd>{formatArea(country.area_km2)}</dd>
          </div>
          <div>
            <dt>Population</dt>
            <dd>{formatPopulation(country.population)}</dd>
          </div>
          <div>
            <dt>Density</dt>
            <dd>{formatIndicatorValue(country.population_density, "people/km²")}</dd>
          </div>
          {extraStats.map((ind) => (
            <div key={ind.key}>
              <dt>{ind.label}</dt>
              <dd>{formatIndicatorValue(country[ind.key], ind.unit)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="pictogram-stats">
          <div>
            <dt>GDP</dt>
            <dd>{formatIndicatorValue(country.gdp_usd, "US$")}</dd>
          </div>
        </dl>
      )}

      {layout && (
        <p className="pictogram-icon-count">
          ≈ {layout.shownIconCount.toLocaleString("en-US")} {metric === "gdp" ? "bags" : "icons"}
          {layout.shownIconCount < layout.requestedIconCount && " (limited space)"}
        </p>
      )}
    </div>
  );
}
