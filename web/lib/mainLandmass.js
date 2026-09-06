// Some countries carry far-flung overseas exclaves bundled into the same
// GeoJSON feature as their main territory — mainland France + French
// Guiana (~7,000km away, on another continent) is the textbook case.
// Left in, a far-off sliver like that blows out the feature's bounding
// box and drags the azimuthal projection's center point out into open
// ocean, mangling the shape the "fill the country" game actually wants:
// one coherent outline to pour water into.
//
// This keeps the largest landmass plus anything close enough to read as
// part of the same visual cluster (islands, archipelagos, Svalbard-style
// northern territories), and drops only small, distant outliers — a
// polygon is never dropped just for being far away if it's a substantial
// share of the country's own area (Alaska, East Malaysia, Indonesia's
// outer islands all survive), since an oddly-shaped-but-complete country
// beats a wrong one.
import * as d3 from "d3";

const EARTH_RADIUS_KM = 6371;
const MIN_THRESHOLD_KM = 1200;
const THRESHOLD_FACTOR = 1.5;
const PROTECTED_AREA_FRACTION = 0.15;

function polygonInfo(coordinates) {
  const geometry = { type: "Polygon", coordinates };
  return {
    coordinates,
    area: d3.geoArea(geometry),
    centroid: d3.geoCentroid(geometry),
    bounds: d3.geoBounds(geometry),
  };
}

export function mainLandmassFeature(feature) {
  if (!feature || !feature.geometry) return feature;
  const { type, coordinates } = feature.geometry;
  if (type !== "MultiPolygon" || coordinates.length <= 1) return feature;

  const polygons = coordinates.map(polygonInfo);
  const totalArea = polygons.reduce((sum, p) => sum + p.area, 0);
  if (!totalArea) return feature;

  let main = polygons[0];
  for (const p of polygons) {
    if (p.area > main.area) main = p;
  }

  const [[lon0, lat0], [lon1, lat1]] = main.bounds;
  const mainDiagonalKm = d3.geoDistance([lon0, lat0], [lon1, lat1]) * EARTH_RADIUS_KM;
  const distanceThreshold = Math.max(MIN_THRESHOLD_KM, mainDiagonalKm * THRESHOLD_FACTOR);

  const kept = polygons.filter((p) => {
    if (p === main) return true;
    if (p.area / totalArea >= PROTECTED_AREA_FRACTION) return true;
    const distanceKm = d3.geoDistance(main.centroid, p.centroid) * EARTH_RADIUS_KM;
    return distanceKm <= distanceThreshold;
  });

  if (kept.length === polygons.length) return feature;

  const keptCoordinates = kept.map((p) => p.coordinates);
  const geometry =
    keptCoordinates.length === 1
      ? { type: "Polygon", coordinates: keptCoordinates[0] }
      : { type: "MultiPolygon", coordinates: keptCoordinates };

  return { ...feature, geometry };
}
