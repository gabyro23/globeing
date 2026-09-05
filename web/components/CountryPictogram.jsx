"use client";

import { useMemo } from "react";
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
import { POSES, POSE_NAMES, BAG, renderPrimitives } from "../lib/pictogramIcons";
import { formatArea, formatPopulation, formatIndicatorValue } from "../lib/format";
import { INDICATORS } from "../lib/indicators";

const EXTRUSION_STEPS = 10; // thin stacked layers that build the silhouette's 3D "edge"

const BASELINE_KEYS = new Set(["population", "area_km2", "population_density"]);
const indicatorByKey = new Map(INDICATORS.map((i) => [i.key, i]));

// The "personita" figures (POSES) and money-bag icon (BAG) used below
// live in ../lib/pictogramIcons, shared with GdpPerCapitaPictogram.

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
