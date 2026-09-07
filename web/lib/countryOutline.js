// Server-side computation of a country's plain geographic silhouette (no
// icons, no gradient — just a path) for use as a low-opacity background
// watermark on /country/[slug]. Reuses the same world-atlas + azimuthal
// projection approach as CountryPictogram.jsx / CompareModal.jsx, but
// runs during the server render (this file has no "use client") so the
// shape is present in the static HTML immediately instead of popping in
// after a client fetch.
import * as d3 from "d3";
import { loadWorld, featuresByAlpha3 } from "./worldAtlas";
import { mainLandmassFeature } from "./mainLandmass";

// Resolution only matters for path-coordinate precision, not on-screen
// size (the SVG is scaled by its viewBox) — 600 is plenty for a smooth
// silhouette at any container size.
const PROJECTION_BOX_PX = 600;

let featuresPromise = null;

function getFeatures() {
  if (!featuresPromise) {
    featuresPromise = loadWorld().then((world) => featuresByAlpha3(world));
  }
  return featuresPromise;
}

// Returns { pathD, viewBox } for the country's outline, or null if the
// map data isn't available for it. Callers should treat a network/parse
// failure here as non-fatal (wrap in try/catch) — the watermark is
// decorative, not core content.
export async function getCountryOutline(iso3) {
  const byAlpha3 = await getFeatures();
  const feature = byAlpha3.get(iso3);
  if (!feature) return null;

  const mainFeature = mainLandmassFeature(feature);
  const centroid = d3.geoCentroid(mainFeature);
  const projection = d3
    .geoAzimuthalEqualArea()
    .rotate([-centroid[0], -centroid[1]])
    .fitSize([PROJECTION_BOX_PX, PROJECTION_BOX_PX], mainFeature);
  const pathGenerator = d3.geoPath(projection);
  const pathD = pathGenerator(mainFeature);
  const bounds = pathGenerator.bounds(mainFeature);
  if (!pathD || !bounds) return null;

  const [[x0, y0], [x1, y1]] = bounds;
  const pad = (x1 - x0 + (y1 - y0)) * 0.04; // a little breathing room around the shape
  return {
    pathD,
    viewBox: `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`,
  };
}
