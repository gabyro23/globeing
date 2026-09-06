"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { buildLiquidFill } from "../lib/liquidFill";
import { mainLandmassFeature } from "../lib/mainLandmass";

// Same normalization "Guess the country" uses for its silhouettes:
// project into a generous reference box, then let the actual rendered
// SVG width/height cap out at a modest pixel maximum (with the browser's
// default preserveAspectRatio doing the letterboxing) — so the panel is
// only ever as big as the country's own shape needs, never padded out
// into a big square canvas, and never balloons to fill whatever column
// width happens to be available.
const REFERENCE_BOX = 320;
const PAD = 10;
const MAX_WIDTH = 340;
const MAX_HEIGHT = 300;

// The area puzzle, as a container-and-liquid visual: the chosen country
// (say, Russia) is the container — drawn once, as its own real outline —
// and every country added to the list is poured in like water, raising a
// single fill level inside that outline. The filled region's area is
// always exactly the combined real area of everything added: we clip the
// container's own geometry to a horizontal line and solve for the line
// that gives the right area (see lib/liquidFill.js), so what's on screen
// is never a reprojection of the poured countries onto the container —
// just their combined amount of area, rising inside it.
export default function AreaFillCanvas({ targetCountry, targetFeature, filledFraction }) {
  // Drop far-off overseas exclaves (mainland France + French Guiana is
  // the textbook case) before doing anything else with the geometry —
  // otherwise they blow out the bounding box and drag the projection's
  // center out into open ocean, shrinking the actual shape we care about
  // into a corner. See lib/mainLandmass.js.
  const mainFeature = useMemo(
    () => (targetFeature ? mainLandmassFeature(targetFeature) : null),
    [targetFeature]
  );

  const projection = useMemo(() => {
    if (!mainFeature) return null;
    const centroid = d3.geoCentroid(mainFeature);
    return d3
      .geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .fitSize([REFERENCE_BOX, REFERENCE_BOX], mainFeature);
  }, [mainFeature]);

  const outline = useMemo(() => {
    if (!mainFeature || !projection) return null;
    const pathGenerator = d3.geoPath(projection);
    const pathD = pathGenerator(mainFeature);
    const bounds = pathGenerator.bounds(mainFeature);
    if (!pathD || !bounds) return null;
    const [[x0, y0], [x1, y1]] = bounds;
    return {
      pathD,
      viewBox: `${x0 - PAD} ${y0 - PAD} ${x1 - x0 + PAD * 2} ${y1 - y0 + PAD * 2}`,
      width: x1 - x0 + PAD * 2,
      height: y1 - y0 + PAD * 2,
    };
  }, [mainFeature, projection]);

  const liquid = useMemo(() => {
    if (!mainFeature || !projection) return null;
    return buildLiquidFill(mainFeature, projection);
  }, [mainFeature, projection]);

  const waterPathD = useMemo(() => {
    if (!liquid) return null;
    return liquid.pathForFraction(filledFraction);
  }, [liquid, filledFraction]);

  const percent = Math.round(Math.min(Math.max(filledFraction, 0), 1) * 100);

  return (
    <div className="area-fill-canvas">
      <div className="area-fill-canvas__svg-wrap">
        {outline && (
          <svg
            viewBox={outline.viewBox}
            width={Math.min(MAX_WIDTH, outline.width)}
            height={Math.min(MAX_HEIGHT, outline.height)}
            className="area-fill-canvas__svg"
            role="img"
            aria-label={
              targetCountry
                ? `${targetCountry.name}, filled to ${percent}% of its surface`
                : "Area puzzle board"
            }
          >
            <path d={outline.pathD} className="area-fill-canvas__target" />
            {waterPathD && <path d={waterPathD} className="area-fill-canvas__water" />}
          </svg>
        )}
      </div>
    </div>
  );
}
