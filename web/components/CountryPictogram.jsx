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

const EXTRUSION_STEPS = 10; // capas finas que arman el "canto" 3D de la silueta

const BASELINE_KEYS = new Set(["population", "area_km2", "population_density"]);
const indicatorByKey = new Map(INDICATORS.map((i) => [i.key, i]));

// 4 variantes de color (en base a la paleta de marca) para que la grilla de
// personitas tenga variedad visual, como en la referencia adjunta por el
// usuario, sin salirse del sistema de diseño de Globeing.
const PERSON_VARIANTS = [
  { head: "var(--accent-deep)", torso: "var(--accent)", legs: "var(--ink)" },
  { head: "var(--accent-deep)", torso: "var(--sage)", legs: "var(--accent-deep)" },
  { head: "var(--ink)", torso: "var(--sand)", legs: "var(--accent-deep)" },
  { head: "var(--accent-deep)", torso: "var(--sage-light)", legs: "var(--accent)" },
];

// Personita "de verdad" (cabeza + remera + pantalón + sombra en el piso) en
// vez del isotype plano anterior — inspirada en la referencia del usuario.
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

// Dibuja la silueta de un país en un lienzo del MISMO tamaño para todos los
// países comparados (para que la grilla de población se lea clara sin
// importar cuán chico sea el país), con relieve 3D (degradé + canto
// extruido + sombra) y una grilla de personitas con volumen representando
// su población. Debajo, la tabla de datos clave (área, población, densidad
// + extras). El mini-mapa de tamaño REAL entre países vive aparte, en
// TrueScalePanel (un solo recuadro compartido dentro de pictogram-row).
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

    const targetBoxPx = boxSize; // mismo tamaño de lienzo para todos los países
    const depth = pictogramExtrusionDepth(targetBoxPx); // grosor del canto 3D
    const viewPad = pictogramViewPad(targetBoxPx); // deja lugar a canto + sombra difusa

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
            aria-label={`Silueta de ${country.name} con iconitos representando su población`}
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

            {/* sombra ambiente difusa, da la sensación de que la silueta "flota" */}
            <path
              d={layout.pathD}
              className="pictogram-shadow"
              transform={`translate(${layout.shadowOffset.dx} ${layout.shadowOffset.dy})`}
            />

            {/* canto extruido: capas finas apiladas simulan el grosor 3D */}
            {layout.extrusionSteps.map((step, i) => (
              <path
                key={i}
                d={layout.pathD}
                className="pictogram-extrusion"
                transform={`translate(${step.dx} ${step.dy})`}
              />
            ))}

            {/* cara superior */}
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
          <p className="pictogram-missing">Sin datos de mapa para este país.</p>
        )}
      </div>

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
