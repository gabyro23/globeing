"use client";

import { useMemo } from "react";
import { POSES, BAG, renderPrimitives } from "../lib/pictogramIcons";
import { iconCountForValue } from "../lib/pictogram";
import { formatIndicatorValue } from "../lib/format";

// Fixed sizes for this view. Unlike CountryPictogram, nothing here is
// shaped by the country's geography or scaled to its population — it's
// one personita (a stand-in for "the average person") next to a stack of
// money bags, so the point is a quick, comparable read of GDP per capita.
const PERSON_WIDTH = 34;
const PERSON_HEIGHT = 68;
const BAG_WIDTH = 22;
const BAG_HEIGHT = 44;
const BAG_COLUMNS = 5;
const BAG_GAP = 3;

// Row-major grid, filled bottom-up so the stack of bags reads like it's
// growing from a shared ground line next to the personita.
function stackedBagGrid(count) {
  const safeCount = Math.max(count, 0);
  const rows = safeCount === 0 ? 0 : Math.max(1, Math.ceil(safeCount / BAG_COLUMNS));
  const width = BAG_COLUMNS * BAG_WIDTH + Math.max(BAG_COLUMNS - 1, 0) * BAG_GAP;
  const height = rows * BAG_HEIGHT + Math.max(rows - 1, 0) * BAG_GAP;
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
// group's highest GDP per capita. Same column/canvas/stats/caption layout
// as CountryPictogram (title, then a fixed-height canvas, then the stats
// table, then the icon-count caption) so it lines up with the Density and
// GDP views instead of introducing its own spacing. Used by CompareModal
// when the "GDP per capita" indicator is selected.
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
            {renderPrimitives(POSES.front)}
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
