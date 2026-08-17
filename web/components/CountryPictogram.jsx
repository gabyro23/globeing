"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { extractPolygons, samplePictogramPoints, iconCountForPopulation } from "../lib/pictogram";
import { formatArea, formatPopulation, formatIndicatorValue } from "../lib/format";
import { INDICATORS } from "../lib/indicators";

const ICON_SIZE = 8; // px — tamaño fijo de cada iconito, igual para todos los países
const MIN_VISIBLE_BOX = 30; // px — piso para que un país muy chico no desaparezca del todo
const VIEW_PAD = ICON_SIZE * 1.2;

const BASELINE_KEYS = new Set(["population", "area_km2", "population_density"]);
const indicatorByKey = new Map(INDICATORS.map((i) => [i.key, i]));

// Ícono tipo isotype: cabeza + cuerpo, en un viewBox de 10x10.
function PersonSymbol({ id }) {
  return (
    <symbol id={id} viewBox="0 0 10 10">
      <circle cx="5" cy="2.1" r="1.7" />
      <path d="M1.9,10 C1.9,6.1 2.6,3.9 5,3.9 C7.4,3.9 8.1,6.1 8.1,10 Z" />
    </symbol>
  );
}

// Dibuja la silueta real de un país a escala relativa (sqrt del área frente
// al país más grande del set comparado), con una grilla de iconitos que
// representa su población y las cifras etiquetadas debajo.
export default function CountryPictogram({
  country,
  feature,
  boxSize,
  maxArea,
  iconValue,
  extraIndicatorKeys,
}) {
  const iconSymbolId = `pictogram-person-${country.iso3}`;

  const layout = useMemo(() => {
    if (!feature) return null;

    const area = Number(country.area_km2) || 0;
    const displayScale = maxArea > 0 ? Math.sqrt(Math.max(area, 1) / maxArea) : 1;
    const targetBoxPx = Math.max(boxSize * displayScale, MIN_VISIBLE_BOX);

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

    return {
      pathD,
      points,
      requestedIconCount: iconCount,
      shownIconCount: points.length,
      width: x1 - x0 + VIEW_PAD * 2,
      height: y1 - y0 + VIEW_PAD * 2,
      viewBox: `${x0 - VIEW_PAD} ${y0 - VIEW_PAD} ${x1 - x0 + VIEW_PAD * 2} ${y1 - y0 + VIEW_PAD * 2}`,
    };
  }, [feature, country.area_km2, country.population, maxArea, boxSize, iconValue]);

  const extraStats = extraIndicatorKeys
    .map((key) => indicatorByKey.get(key))
    .filter((ind) => ind && !BASELINE_KEYS.has(ind.key));

  return (
    <div className="pictogram-column">
      <div className="pictogram-canvas" style={{ height: boxSize }}>
        {layout ? (
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={layout.viewBox}
            className="pictogram-svg"
            role="img"
            aria-label={`Silueta de ${country.name} con iconitos representando su población`}
          >
            <defs>
              <PersonSymbol id={iconSymbolId} />
            </defs>
            <path d={layout.pathD} className="pictogram-silhouette" />
            {layout.points.map(([x, y], i) => (
              <use
                key={i}
                href={`#${iconSymbolId}`}
                x={x - ICON_SIZE / 2}
                y={y - ICON_SIZE / 2}
                width={ICON_SIZE}
                height={ICON_SIZE}
                className="pictogram-icon"
              />
            ))}
          </svg>
        ) : (
          <p className="pictogram-missing">Sin datos de mapa para este país.</p>
        )}
      </div>

      <h3 className="pictogram-column__title">
        {country.flag} {country.name}
      </h3>

      <dl className="pictogram-stats">
        <div>
          <dt>Área</dt>
          <dd>{formatArea(country.area_km2)}</dd>
        </div>
        <div>
          <dt>Población</dt>
          <dd>{formatPopulation(country.population)}</dd>
        </div>
        <div>
          <dt>Densidad</dt>
          <dd>{formatIndicatorValue(country.population_density, "hab/km²")}</dd>
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
          ≈ {layout.shownIconCount.toLocaleString("en-US")} iconitos
          {layout.shownIconCount < layout.requestedIconCount && " (espacio limitado)"}
        </p>
      )}
    </div>
  );
}
