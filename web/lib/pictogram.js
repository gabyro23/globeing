// Utilidades para el pictograma de comparación: point-in-polygon sobre la
// silueta ya proyectada de un país, muestreo de puntos para la grilla de
// iconitos de población, y el redondeo del "valor por ícono" (cuántos
// habitantes representa cada personita) para que la leyenda sea legible.

const MIN_SPACING = 3; // px — por debajo de esto los iconitos se pisan demasiado
const MAX_SPACING = 46; // px
const MAX_SAMPLE_ATTEMPTS = 7;
const SPACING_DECAY = 0.72;

// --- Geometría -------------------------------------------------------

// Proyecta un anillo de coordenadas [lon, lat] a píxeles con la proyección
// dada, descartando puntos que la proyección no pueda resolver.
function projectRing(ring, projection) {
  const projected = [];
  for (const coord of ring) {
    const p = projection(coord);
    if (p) projected.push(p);
  }
  return projected;
}

// Convierte la geometría (Polygon | MultiPolygon) de un feature de topojson
// ya proyectado en una lista de polígonos { outer, holes } en espacio de
// píxeles, listos para hacer point-in-polygon sin tocar el DOM.
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

// Bounding box en píxeles de una lista de polígonos ya proyectados.
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

// Ray casting estándar (even-odd rule).
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

// --- Muestreo de puntos para la grilla de iconitos --------------------

// Genera una grilla tipo "ladrillo" (filas alternadas desfasadas medio
// paso) dentro del bbox, con el spacing dado.
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

// Toma `count` puntos distribuidos parejo a lo largo de una lista ya
// ordenada (en vez de truncar, lo que sesgaría hacia una esquina).
function evenlySubsample(points, count) {
  if (points.length <= count) return points;
  const stride = points.length / count;
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(points[Math.floor(i * stride)]);
  }
  return picked;
}

// Encuentra hasta `targetCount` puntos dentro de la silueta (polygons),
// densificando la grilla si hace falta hasta un mínimo de spacing. Si la
// silueta es demasiado chica para el spacing mínimo, devuelve los que
// entren (menos que targetCount) en vez de trabar.
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

// --- Escala de la leyenda (habitantes por ícono) -----------------------

// Redondea a un "número lindo" (1/2/5 × 10^n) para que la leyenda sea
// legible, apuntando a que el país con más población no muestre más de
// ~targetMaxIcons iconitos.
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

export function iconCountForPopulation(population, iconValue) {
  if (!population || !iconValue) return 0;
  return Math.max(1, Math.round(population / iconValue));
}
