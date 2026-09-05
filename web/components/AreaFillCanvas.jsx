"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { buildLiquidFill } from "../lib/liquidFill";

// Logical SVG units for the board and the box the container's outline is
// fit into, leaving a margin around it.
export const CANVAS_SIZE = 640;
const TARGET_BOX = CANVAS_SIZE * 0.82;
const TARGET_OFFSET = (CANVAS_SIZE - TARGET_BOX) / 2;

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
  const projection = useMemo(() => {
    if (!targetFeature) return null;
    const centroid = d3.geoCentroid(targetFeature);
    return d3
      .geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .fitSize([TARGET_BOX, TARGET_BOX], targetFeature);
  }, [targetFeature]);

  const containerPathD = useMemo(() => {
    if (!targetFeature || !projection) return null;
    return d3.geoPath(projection)(targetFeature);
  }, [targetFeature, projection]);

  const liquid = useMemo(() => {
    if (!targetFeature || !projection) return null;
    return buildLiquidFill(targetFeature, projection);
  }, [targetFeature, projection]);

  const waterPathD = useMemo(() => {
    if (!liquid) return null;
    return liquid.pathForFraction(filledFraction);
  }, [liquid, filledFraction]);

  const percent = Math.round(Math.min(Math.max(filledFraction, 0), 1) * 100);

  return (
    <div className="area-fill-canvas">
      <svg
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        className="area-fill-canvas__svg"
        role="img"
        aria-label={
          targetCountry
            ? `${targetCountry.name}, filled to ${percent}% of its surface`
            : "Area puzzle board"
        }
      >
        <rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} className="area-fill-canvas__bg" />

        {containerPathD && (
          <g transform={`translate(${TARGET_OFFSET}, ${TARGET_OFFSET})`}>
            <path d={containerPathD} className="area-fill-canvas__target" />
            {waterPathD && <path d={waterPathD} className="area-fill-canvas__water" />}
          </g>
        )}
      </svg>
    </div>
  );
}
