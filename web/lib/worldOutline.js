// Server-side computation of the whole world's landmass outline — same
// technique as lib/countryOutline.js (fetch the world atlas once, run it
// through d3-geo, hand back a plain SVG path + viewBox so the shape is
// present in the static HTML immediately, no client fetch) but for every
// country at once instead of a single iso3. This is the /country hub
// page's version of the same background watermark each /country/[slug]
// page has — one country's silhouette there, the whole map here.
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { loadWorld } from "./worldAtlas";
import topoIds from "./countryTopoIds.json";

// Matches WorldMap.jsx's own box (960x480-ish) so the watermark reads as
// the same map, just decorative — width/height only set the aspect ratio
// baked into the path data; the actual on-screen size is controlled by
// the .country-outline-bg CSS the per-country pages already use.
const PROJECTION_BOX_WIDTH = 960;
const PROJECTION_BOX_HEIGHT = 480;

const normalizeId = (id) => String(Number(id));
// Same filter WorldMap.jsx applies: only landmasses we actually track in
// countryTopoIds.json — leaves out Antarctica and any other shape the
// world atlas has that isn't one of our countries.
const knownTopoIds = new Set(topoIds.map((c) => normalizeId(c.id)));

let outlinePromise = null;

// Returns { pathD, viewBox } for the whole world, or null if the map
// data isn't available. Callers should treat a network/parse failure
// here as non-fatal (wrap in try/catch, same as lib/countryOutline.js's
// callers do) — this is a decorative watermark, not core content.
export function getWorldOutline() {
  if (!outlinePromise) {
    outlinePromise = loadWorld().then((world) => {
      const land = topojson
        .feature(world, world.objects.countries)
        .features.filter((f) => knownTopoIds.has(normalizeId(f.id)));
      const collection = { type: "FeatureCollection", features: land };

      const projection = d3
        .geoNaturalEarth1()
        .fitSize([PROJECTION_BOX_WIDTH, PROJECTION_BOX_HEIGHT], collection);
      const pathGenerator = d3.geoPath(projection);
      const pathD = pathGenerator(collection);
      const bounds = pathGenerator.bounds(collection);
      if (!pathD || !bounds) return null;

      const [[x0, y0], [x1, y1]] = bounds;
      const pad = (x1 - x0 + (y1 - y0)) * 0.02;
      return {
        pathD,
        viewBox: `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`,
      };
    });
  }
  return outlinePromise;
}
