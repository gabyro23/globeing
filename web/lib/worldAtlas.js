// Carga del mismo world-atlas (110m) que usa WorldMap.jsx, pero expuesto
// como utilidad reusable para extraer el GeoJSON feature de un país
// puntual (lo necesita CompareModal/CountryPictogram para dibujar la
// silueta real de cada país seleccionado).
import * as topojson from "topojson-client";
import topoIds from "./countryTopoIds.json";

export const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const normalizeId = (id) => String(Number(id));

const topoIdByAlpha3 = new Map(topoIds.map((c) => [c.alpha3, normalizeId(c.id)]));

let worldPromise = null;

// Fetch (con cache en memoria para el resto de la sesión de la pestaña)
// del TopoJSON del mundo entero.
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = fetch(WORLD_ATLAS_URL).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar el mapa (${res.status})`);
      return res.json();
    });
  }
  return worldPromise;
}

// A partir del TopoJSON crudo, arma un Map alpha3 -> GeoJSON feature.
export function featuresByAlpha3(world) {
  const land = topojson.feature(world, world.objects.countries).features;
  const byTopoId = new Map(land.map((f) => [normalizeId(f.id), f]));
  const map = new Map();
  for (const [alpha3, topoId] of topoIdByAlpha3) {
    const feature = byTopoId.get(topoId);
    if (feature) map.set(alpha3, feature);
  }
  return map;
}
