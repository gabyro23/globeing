"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import {
  extractPolygons,
  samplePictogramPoints,
  iconCountForPopulation,
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

// 4 color variants (based on the brand palette) so the grid of little
// people has visual variety, like in the reference the user attached,
// without straying from Globeing's design system.
const PERSON_VARIANTS = [
  { head: "var(--accent-deep)", torso: "var(--accent)", legs: "var(--ink)" },
  { head: "var(--accent-deep)", torso: "var(--sage)", legs: "var(--accent-deep)" },
  { head: "var(--ink)", torso: "var(--sand)", legs: "var(--accent-deep)" },
  { head: "var(--accent-deep)", torso: "var(--sage-light)", legs: "var(--accent)" },
];

// A "real" little person (head + shirt + pants + ground shadow) instead of
// the earlier flat isotype — inspired by the user's reference.
function PersonSymbol({ id, colors }) {
  return (
    <symbol id={id} viewBox="0 0 10 11">
      <ellipse cx="5" cy="10.35" rx="2" ry="0.5" className="pictogram-icon-shadow" />
      <circle cx="5" cy="1.9" r="1.5" className="pictogram-icon-head" />
      <path
        d="M2.3,7 C2.3,4.6 3.2,3.4 5,3.4 C6.8,3.4 7.7,4.6 7.7,7 L7.7,7.4 L2.3,7.4 Z"
        fill={colors.torso}
      />
      <path d="M2.6,7.4 L2.9,10.2 L4.5,10.2 L4.7,7.4 Z" fill={colors.legs} />
      <path d="M7.4,7.4 L7.1,10.2 L5.5,10.2 L5.3,7.4 Z" fill={colors.legs} />
    </symbol>
  );
}

// Draws a country's silhouette on a canvas of the SAME size for every
// compared country (so the population grid reads clearly no matter how
// small the country is), with 3D relief (gradient + extruded edge +
// shadow) and a grid of little people with volume representing its
// population. Below it, the key data table (area, population, density +
// extras). The REAL-size mini-map between countries lives separately, in
// TrueScalePanel (a single shared box inside pictogram-row).
export default function CountryPictogram({
  country,
  feature,
  boxSize,
  canvasHeight,
  iconValue,
  extraIndicatorKeys,
}) {
  const fillGradientId = `pictogram-fill-${country.iso3}`;

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
    const iconCount = iconCountForPopulation(country.population, iconValue);
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
  }, [feature, country.population, boxSize, iconValue]);

  const extraStats = extraIndicatorKeys
    .map((key) => indicatorByKey.get(key))
    .filter((ind) => ind && !BASELINE_KEYS.has(ind.key));

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
            aria-label={`Silhouette of ${country.name} with icons representing its population`}
          >
            <defs>
              <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--sage-light)" />
                <stop offset="55%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-deep)" />
              </linearGradient>
              {PERSON_VARIANTS.map((colors, i) => (
                <PersonSymbol key={i} id={`pictogram-person-${country.iso3}-${i}`} colors={colors} />
              ))}
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
                  href={`#pictogram-person-${country.iso3}-${i % PERSON_VARIANTS.length}`}
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

      {layout && (
        <p className="pictogram-icon-count">
          ≈ {layout.shownIconCount.toLocaleString("en-US")} icons
          {layout.shownIconCount < layout.requestedIconCount && " (limited space)"}
        </p>
      )}
    </div>
  );
}
