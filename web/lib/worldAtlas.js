// Loads the same world-atlas (110m) that WorldMap.jsx uses, but exposed as
// a reusable utility to extract the GeoJSON feature for a single country
// (needed by CompareModal/CountryPictogram to draw the real silhouette of
// each selected country).
import * as topojson from "topojson-client";
import topoIds from "./countryTopoIds.json";

export const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const normalizeId = (id) => String(Number(id));

const topoIdByAlpha3 = new Map(topoIds.map((c) => [c.alpha3, normalizeId(c.id)]));

let worldPromise = null;

// Fetches (with an in-memory cache for the rest of the tab's session) the
// whole world's TopoJSON.
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = fetch(WORLD_ATLAS_URL).then((res) => {
      if (!res.ok) throw new Error(`Couldn't load the map (${res.status})`);
      return res.json();
    });
  }
  return worldPromise;
}

// Builds a Map of alpha3 -> GeoJSON feature from the raw TopoJSON.
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
