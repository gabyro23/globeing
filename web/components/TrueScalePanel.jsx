"use client";

import { useMemo } from "react";
import * as d3 from "d3";

const MINI_PAD = 3; // px — margen interno para que el trazo no se recorte
const MINI_MIN_VISIBLE = 8; // px — piso para que un país chico no desaparezca

// Un solo recuadro (no uno por país) con la silueta de cada país del grupo
// dibujada a su escala real relativa entre sí — el país más grande del
// grupo ocupa el alto `size`, el resto se escala proporcional según su
// superficie real (sqrt del área). Vive dentro de pictogram-row, con
// botones +/- para agrandar o achicar el recuadro completo.
export default function TrueScalePanel({
  countries,
  featureMap,
  maxArea,
  size,
  onIncrease,
  onDecrease,
  canIncrease,
  canDecrease,
}) {
  const items = useMemo(() => {
    return countries
      .map((country) => {
        const feature = featureMap.get(country.iso3);
        if (!feature) return null;

        const scale = maxArea > 0 ? Math.sqrt(Math.max(Number(country.area_km2) || 1, 1) / maxArea) : 1;
        const targetPx = Math.max(size * scale, MINI_MIN_VISIBLE);

        const centroid = d3.geoCentroid(feature);
        const projection = d3
          .geoAzimuthalEqualArea()
          .rotate([-centroid[0], -centroid[1]])
          .fitSize([targetPx, targetPx], feature);
        const pathGenerator = d3.geoPath(projection);
        const pathD = pathGenerator(feature);
        const bounds = pathGenerator.bounds(feature);
        if (!pathD || !bounds) return null;

        const [[x0, y0], [x1, y1]] = bounds;
        return {
          iso3: country.iso3,
          name: country.name,
          flag: country.flag,
          pathD,
          width: x1 - x0 + MINI_PAD * 2,
          height: y1 - y0 + MINI_PAD * 2,
          viewBox: `${x0 - MINI_PAD} ${y0 - MINI_PAD} ${x1 - x0 + MINI_PAD * 2} ${y1 - y0 + MINI_PAD * 2}`,
        };
      })
      .filter(Boolean);
  }, [countries, featureMap, maxArea, size]);

  if (items.length === 0) return null;

  return (
    <div className="true-scale-panel">
      <div className="true-scale-panel__header">
        <span className="true-scale-panel__title">Tamaño real</span>
        <div className="true-scale-panel__zoom">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!canDecrease}
            aria-label="Achicar recuadro de tamaño real"
          >
            −
          </button>
          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            aria-label="Agrandar recuadro de tamaño real"
          >
            +
          </button>
        </div>
      </div>

      <div className="true-scale-panel__shapes">
        {items.map((item) => (
          <div className="true-scale-panel__item" key={item.iso3} title={item.name}>
            <div className="true-scale-panel__item-canvas" style={{ height: size + MINI_PAD * 2 }}>
              <svg
                width={item.width}
                height={item.height}
                viewBox={item.viewBox}
                role="img"
                aria-label={`Tamaño real de ${item.name}`}
              >
                <path d={item.pathD} className="pictogram-mini-silhouette" />
              </svg>
            </div>
            <span className="true-scale-panel__item-flag">{item.flag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
