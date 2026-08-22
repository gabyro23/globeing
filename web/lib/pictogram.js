// Utilities for the comparison pictogram: point-in-polygon over a
// country's already-projected silhouette, point sampling for the
// population icon grid, and rounding the "value per icon" (how many
// people each little person represents) so the legend stays readable.

const MIN_SPACING = 3.6; // px — below this the icons overlap too much
const MAX_SPACING = 50; // px
const MAX_SAMPLE_ATTEMPTS = 7;
const SPACING_DECAY = 0.72;

// --- Pictogram layout constants (shared between CountryPictogram, which
// draws each silhouette, and CompareModal, which needs to reserve enough
// container height for the largest one) --------------------------------

// Matches the "personita" figure's natural proportions (viewBox 60x120,
// i.e. 1:2) instead of the earlier abstract isotype's 10x11 box.
export const PICTOGRAM_ICON_WIDTH = 7.5; // px — fixed width of each icon
export const PICTOGRAM_ICON_HEIGHT = 15; // px — fixed height (head + torso + legs)
export const PICTOGRAM_BASE_PAD = PICTOGRAM_ICON_HEIGHT * 1.2;

// Simple padding for the corner "true scale" mini-map: it has no 3D edge,
// it only needs room for the border stroke.
export const PICTOGRAM_MINI_PAD = 3;

// Thickness of the silhouette's extruded 3D edge, based on the country's
// on-screen size (clamped so neither a huge nor a tiny country looks
// disproportionate).
export function pictogramExtrusionDepth(targetBoxPx) {
  return Math.min(Math.max(targetBoxPx * 0.035, 1.5), 6);
}

// Total padding to add to the silhouette's real bbox so the extruded edge
// and the soft shadow don't get clipped inside the SVG.
export function pictogramViewPad(targetBoxPx) {
  return PICTOGRAM_BASE_PAD + pictogramExtrusionDepth(targetBoxPx) * 1.5 + 8;
}

// --- Geometry ----------------------------------------------------------

// Projects a ring of [lon, lat] coordinates to pixels with the given
// projection, dropping points the projection can't resolve.
function projectRing(ring, projection) {
  const projected = [];
  for (const coord of ring) {
    const p = projection(coord);
    if (p) projected.push(p);
  }
  return projected;
}

// Converts an already-projected topojson feature's geometry
// (Polygon | MultiPolygon) into a list of { outer, holes } polygons in
// pixel space, ready for point-in-polygon without touching the DOM.
export function extractPolygons(geometry, projection) {
  if (!geometry) return [];
  const rawPolygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  return rawPolygons
    .map((rings) => {
      const [outer, ...holes] = rings.map((ring) => projectRing(ring, projection));
      return { outer: outer || [], holes: holes.filter((h) => h.length > 2) };
    })
    .filter((poly) => poly.outer.length > 2);
}

// Pixel-space bounding box of a list of already-projected polygons.
export function polygonsBounds(polygons) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of polygons) {
    for (const [x, y] of poly.outer) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

// Standard ray casting (even-odd rule).
function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(x, y, polygon) {
  if (!pointInRing(x, y, polygon.outer)) return false;
  for (const hole of polygon.holes) {
    if (pointInRing(x, y, hole)) return false;
  }
  return true;
}

export function pointInAnyPolygon(x, y, polygons) {
  for (const polygon of polygons) {
    if (pointInPolygon(x, y, polygon)) return true;
  }
  return false;
}

// --- Point sampling for the icon grid ----------------------------------

// Generates a "brick"-style grid (alternating rows offset by half a step)
// within the bbox, at the given spacing.
function gridPoints(bbox, spacing) {
  const points = [];
  const halfStep = spacing / 2;
  let row = 0;
  for (let y = bbox.minY + halfStep; y <= bbox.maxY; y += spacing) {
    const offset = row % 2 === 0 ? 0 : halfStep;
    for (let x = bbox.minX + halfStep + offset; x <= bbox.maxX; x += spacing) {
      points.push([x, y]);
    }
    row += 1;
  }
  return points;
}

// Picks `count` points evenly spread across an already-ordered list
// (instead of truncating, which would bias toward one corner).
function evenlySubsample(points, count) {
  if (points.length <= count) return points;
  const stride = points.length / count;
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(points[Math.floor(i * stride)]);
  }
  return picked;
}

// Finds up to `targetCount` points inside the silhouette (polygons),
// densifying the grid as needed down to a minimum spacing. If the
// silhouette is too small for the minimum spacing, returns however many
// fit (fewer than targetCount) instead of getting stuck.
export function samplePictogramPoints({ polygons, bbox, targetCount }) {
  if (targetCount <= 0 || polygons.length === 0) return [];

  const area = Math.max((bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY), 1);
  let spacing = Math.sqrt(area / (targetCount * 1.35));
  spacing = Math.min(Math.max(spacing, MIN_SPACING), MAX_SPACING);

  let inside = [];
  for (let attempt = 0; attempt < MAX_SAMPLE_ATTEMPTS; attempt++) {
    const candidates = gridPoints(bbox, spacing);
    inside = candidates.filter(([x, y]) => pointInAnyPolygon(x, y, polygons));
    if (inside.length >= targetCount || spacing <= MIN_SPACING) break;
    spacing = Math.max(spacing * SPACING_DECAY, MIN_SPACING);
  }

  return evenlySubsample(inside, targetCount);
}

// --- Legend scale (people per icon) -------------------------------------

// Rounds to a "nice number" (1/2/5 × 10^n) so the legend stays readable,
// aiming for the most populous country to show no more than
// ~targetMaxIcons icons.
export function niceIconValue(maxPopulation, targetMaxIcons = 140) {
  const safePopulation = Math.max(maxPopulation || 0, 1);
  const raw = safePopulation / targetMaxIcons;
  const exp = Math.floor(Math.log10(raw));
  const base = raw / 10 ** exp;
  let niceBase;
  if (base <= 1) niceBase = 1;
  else if (base <= 2) niceBase = 2;
  else if (base <= 5) niceBase = 5;
  else niceBase = 10;
  return niceBase * 10 ** exp;
}

// Generic "how many icons" rounding — used both for population (icons =
// little people) and for any other summable quantity like GDP (icons =
// money bags), since the math is identical either way.
export function iconCountForValue(value, iconValue) {
  if (!value || !iconValue) return 0;
  return Math.max(1, Math.round(value / iconValue));
}

// Back-compat alias — population was the only metric this was used for
// before GDP pictograms existed.
export const iconCountForPopulation = iconCountForValue;
