// Turns a country's own outline into a "container" that can be filled
// like a liquid: given a fraction of its area, returns the SVG path of
// the region of the shape that lies within that bottom share of its
// area — water poured in from the bottom up, rising as the fraction
// grows. This is how "Fill the country" shows one country's area as a
// share of another's: not a reprojection of the poured country onto the
// container, just an amount of area rising inside the container's own
// real shape.
import * as d3 from "d3";

// Runs the projection through the exact same adaptive-resampling pipeline
// d3.geoPath uses to draw a shape (antimeridian cuts, curvature
// resampling, the works) but captures the raw [x, y] rings it would have
// drawn instead of an SVG path string — done by handing geoPath a fake
// "context" that just records moveTo/lineTo/closePath calls.
function projectedRings(feature, projection) {
  const rings = [];
  let current = null;
  const context = {
    moveTo(x, y) {
      current = [[x, y]];
      rings.push(current);
    },
    lineTo(x, y) {
      if (current) current.push([x, y]);
    },
    closePath() {
      current = null;
    },
  };
  d3.geoPath(projection, context)(feature);
  return rings.filter((ring) => ring.length >= 3);
}

function ringSignedArea(points) {
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

// Sutherland-Hodgman clip of a closed ring against the half-plane
// y >= h — the part of the shape "at or below" a waterline at height h
// (SVG y grows downward, so this is the visually lower part).
function clipRingToBottom(points, h) {
  const n = points.length;
  if (n === 0) return [];
  const output = [];
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const prev = points[(i - 1 + n) % n];
    const currIn = curr[1] >= h;
    const prevIn = prev[1] >= h;
    if (currIn) {
      if (!prevIn) output.push(intersectAtHeight(prev, curr, h));
      output.push(curr);
    } else if (prevIn) {
      output.push(intersectAtHeight(prev, curr, h));
    }
  }
  return output;
}

function intersectAtHeight(a, b, h) {
  const t = (h - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), h];
}

// Builds the liquid-fill helper for one projected feature. `projection`
// must be the exact projection used to draw the container's own outline,
// so the water lines up with it pixel-for-pixel.
export function buildLiquidFill(feature, projection) {
  const rings = projectedRings(feature, projection);
  if (rings.length === 0) return null;

  let y0 = Infinity;
  let y1 = -Infinity;
  for (const ring of rings) {
    for (const [, y] of ring) {
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (!Number.isFinite(y0) || !Number.isFinite(y1) || y0 >= y1) return null;

  // Sum of every ring's own signed area (exterior rings and holes carry
  // opposite orientation, so this already nets out to the true total —
  // same identity d3.geoPath.area relies on) gives us both the total
  // area and, via its sign, the projection's winding handedness.
  const fullSigned = rings.reduce((sum, ring) => sum + ringSignedArea(ring), 0);
  const totalArea = Math.abs(fullSigned);
  if (!totalArea) return null;
  const sign = fullSigned < 0 ? -1 : 1;

  function areaBelow(h) {
    let sum = 0;
    for (const ring of rings) {
      const clipped = clipRingToBottom(ring, h);
      if (clipped.length >= 3) sum += ringSignedArea(clipped);
    }
    return sum * sign; // normalized positive, growing as h decreases from y1 to y0
  }

  function levelForFraction(fraction) {
    const desired = Math.min(Math.max(fraction, 0), 1) * totalArea;
    let a = y0; // areaBelow(y0) ~= totalArea (whole shape counts as "below" the top edge)
    let b = y1; // areaBelow(y1) ~= 0 (nothing left below the very bottom edge)
    for (let i = 0; i < 26; i++) {
      const mid = (a + b) / 2;
      if (areaBelow(mid) > desired) a = mid;
      else b = mid;
    }
    return (a + b) / 2;
  }

  function pathBelow(h) {
    const parts = [];
    for (const ring of rings) {
      const clipped = clipRingToBottom(ring, h);
      if (clipped.length < 3) continue;
      parts.push(clipped.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + " Z");
    }
    return parts.join(" ");
  }

  return {
    totalArea,
    // fraction: 0 (empty) .. 1 (the whole outline, brim-full). Anything
    // outside that range is clamped.
    pathForFraction(fraction) {
      return pathBelow(levelForFraction(fraction));
    },
  };
}
