"use client";

import { useMemo } from "react";
import { BAG, renderPrimitives } from "../lib/pictogramIcons";
import { iconCountForValue } from "../lib/pictogram";
import { formatIndicatorValue } from "../lib/format";

// This view's personita is green rather than the shared yellow one used for
// population icons elsewhere (CountryPictogram/lib/pictogramIcons.js), so
// the two never get confused when they appear side by side (e.g. Density's
// silhouette vs. this GDP-per-capita figure). Same shape as POSES.front —
// only the shirt color changes — with the pants/skin/hair tones duplicated
// from lib/pictogramIcons.js so the shared file stays untouched.
const GREEN = "#5C9C6C";
const GREEN_D = "#417348";
const PANT = "#1E2A2C";
const PANT_D = "#0F1719";
const HAIR = "#24312F";
const SKIN = "#C8A184";

const GREEN_PERSON = [
  ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
  ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: GREEN }],
  ["rect", { x: 37.6, y: 39, width: 5.4, height: 30, rx: 2.7, fill: GREEN_D }],
  ["rect", { x: 24, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT }],
  ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D }],
  ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: GREEN }],
  ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: GREEN_D }],
  ["rect", { x: 27, y: 30, width: 6, height: 8, fill: SKIN }],
  ["circle", { cx: 30, cy: 25, r: 9, fill: HAIR }],
];

// Fixed sizes for this view. Unlike CountryPictogram, nothing here is
// shaped by the country's geography or scaled to its population — it's
// one personita (a stand-in for "the average person") next to a stack of
// money bags, so the point is a quick, comparable read of GDP per capita.
// PERSON_HEIGHT and bagStackHeight are exported so CompareModal can size
// this view's canvas to what it actually contains (a person + however
// many bags the richest country in the group needs), instead of reusing
// CountryPictogram's much taller silhouette canvas and leaving a big gap
// above the figures.
export const PERSON_WIDTH = 34;
export const PERSON_HEIGHT = 68;
const BAG_WIDTH = 22;
const BAG_HEIGHT = 44;
const BAG_COLUMNS = 5;
const BAG_GAP = 3;

// Height of a stack of `count` bags, arranged BAG_COLUMNS-wide.
export function bagStackHeight(count) {
  const safeCount = Math.max(count, 0);
  const rows = safeCount === 0 ? 0 : Math.max(1, Math.ceil(safeCount / BAG_COLUMNS));
  return rows * BAG_HEIGHT + Math.max(rows - 1, 0) * BAG_GAP;
}

// Row-major grid, filled bottom-up so the stack of bags reads like it's
// growing from a shared ground line next to the personita.
function stackedBagGrid(count) {
  const safeCount = Math.max(count, 0);
  const rows = safeCount === 0 ? 0 : Math.max(1, Math.ceil(safeCount / BAG_COLUMNS));
  const width = BAG_COLUMNS * BAG_WIDTH + Math.max(BAG_COLUMNS - 1, 0) * BAG_GAP;
  const height = bagStackHeight(count);
  const points = [];
  for (let i = 0; i < safeCount; i++) {
    const row = Math.floor(i / BAG_COLUMNS);
    const col = i % BAG_COLUMNS;
    points.push([col * (BAG_WIDTH + BAG_GAP), height - BAG_HEIGHT - row * (BAG_HEIGHT + BAG_GAP)]);
  }
  return { width, height, points };
}

// One country's GDP-per-capita comparison: a single personita (standing in
// for "one person") next to a stack of money bags sized relative to the
// group's highest GDP per capita. Same column/stats/caption structure as
// CountryPictogram (title, then a fixed-height canvas, then the stats
// table, then the icon-count caption), but `canvasHeight` is sized by
// CompareModal specifically for this view's content (see PERSON_HEIGHT/
// bagStackHeight above) rather than reused from the much taller silhouette
// canvas, so the title-to-figure gap reads the same as the other views
// instead of leaving a big empty gap above a much shorter figure. Used by
// CompareModal when the "GDP per capita" indicator is selected.
export default function GdpPerCapitaPictogram({ country, iconValue, canvasHeight }) {
  const gdpPerCapita = Number(country.gdp_per_capita_usd) || 0;
  const bagCount = useMemo(
    () => iconCountForValue(gdpPerCapita, iconValue),
    [gdpPerCapita, iconValue]
  );
  const bagGrid = useMemo(() => stackedBagGrid(bagCount), [bagCount]);

  return (
    <div className="pictogram-column">
      <h3 className="pictogram-column__title">
        {country.flag} {country.name}
      </h3>

      <div className="pictogram-canvas" style={{ height: canvasHeight }}>
        <div className="gpc-figures">
          <svg
            width={PERSON_WIDTH}
            height={PERSON_HEIGHT}
            viewBox="0 0 60 120"
            role="img"
            aria-label={`One person, standing in for the average person in ${country.name}`}
          >
            {renderPrimitives(GREEN_PERSON)}
          </svg>

          <svg
            width={bagGrid.width || BAG_WIDTH}
            height={bagGrid.height || BAG_HEIGHT}
            viewBox={`0 0 ${bagGrid.width || BAG_WIDTH} ${bagGrid.height || BAG_HEIGHT}`}
            role="img"
            aria-label={`${bagCount} money bags representing this country's GDP per capita`}
          >
            <defs>
              <symbol id={`gpc-bag-${country.iso3}`} viewBox="0 0 60 120">
                {renderPrimitives(BAG)}
              </symbol>
            </defs>
            {bagGrid.points.map(([x, y], i) => (
              <use
                key={i}
                href={`#gpc-bag-${country.iso3}`}
                x={x}
                y={y}
                width={BAG_WIDTH}
                height={BAG_HEIGHT}
                className="pictogram-icon"
              />
            ))}
          </svg>
        </div>
      </div>

      <dl className="pictogram-stats">
        <div>
          <dt>GDP per capita</dt>
          <dd>{formatIndicatorValue(country.gdp_per_capita_usd, "US$")}</dd>
        </div>
      </dl>

      <p className="pictogram-icon-count">
        1 person ≈ {bagCount} {bagCount === 1 ? "bag" : "bags"}
      </p>
    </div>
  );
}
