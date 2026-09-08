"use client";

import { POSES, renderPrimitives } from "../lib/pictogramIcons";
import { formatIndicatorValue } from "../lib/format";

// Placeholder visual for indicators that don't have a dedicated pictogram
// yet (everything except Density/GDP/GDP per capita): a grid of the same
// shared yellow personita used for population icons, one per `iconValue`
// worth of the indicator's value, so every "Compare by" tab has *some*
// image instead of being text-only. This is intentionally generic and
// temporary — each of these indicators is expected to get its own custom
// visual later (see CompareResults' COMPARISON_INDICATORS).
export const ICON_WIDTH = 22;
export const ICON_HEIGHT = 44;
const ICON_COLUMNS = 6;
const ICON_GAP = 4;

// Height of a grid of `count` icons, ICON_COLUMNS-wide — exported so
// CompareResults can size its canvas to fit the tallest country's grid,
// the same way it does for GDP per capita's bag stack.
export function iconGridHeight(count) {
  const safeCount = Math.max(count, 0);
  const rows = safeCount === 0 ? 0 : Math.max(1, Math.ceil(safeCount / ICON_COLUMNS));
  return rows * ICON_HEIGHT + Math.max(rows - 1, 0) * ICON_GAP;
}

// Row-major grid, filled bottom-up so it reads like a bar chart of icons
// (matches the bag stack in GdpPerCapitaPictogram).
function iconGrid(count) {
  const safeCount = Math.max(count, 0);
  const rows = safeCount === 0 ? 0 : Math.max(1, Math.ceil(safeCount / ICON_COLUMNS));
  const width = ICON_COLUMNS * ICON_WIDTH + Math.max(ICON_COLUMNS - 1, 0) * ICON_GAP;
  const height = iconGridHeight(count);
  const points = [];
  for (let i = 0; i < safeCount; i++) {
    const row = Math.floor(i / ICON_COLUMNS);
    const col = i % ICON_COLUMNS;
    points.push([col * (ICON_WIDTH + ICON_GAP), height - ICON_HEIGHT - row * (ICON_HEIGHT + ICON_GAP)]);
  }
  return { width, height, points };
}

// One country's placeholder comparison for a single indicator: `count`
// personitas (count = value / iconValue, at least 1 if the country has any
// value at all), the indicator's own value as a stat, and a "1 icon ≈ ..."
// caption — same column/canvas/stats/caption structure as the other
// pictograms so it lines up when switching between "Compare by" tabs.
export default function GenericIndicatorPictogram({ country, label, value, unit, iconValue, canvasHeight }) {
  const numericValue = Number(value) || 0;
  const count = iconValue > 0 && numericValue > 0 ? Math.max(1, Math.round(numericValue / iconValue)) : 0;
  const grid = iconGrid(count);

  return (
    <div className="pictogram-column">
      <h3 className="pictogram-column__title">
        {country.flag} {country.name}
      </h3>

      <div className="pictogram-canvas" style={{ height: canvasHeight }}>
        <svg
          width={grid.width || ICON_WIDTH}
          height={grid.height || ICON_HEIGHT}
          viewBox={`0 0 ${grid.width || ICON_WIDTH} ${grid.height || ICON_HEIGHT}`}
          role="img"
          aria-label={`${count} icons representing ${country.name}'s ${label}`}
        >
          <defs>
            <symbol id={`generic-icon-${country.iso3}`} viewBox="0 0 60 120">
              {renderPrimitives(POSES.front)}
            </symbol>
          </defs>
          {grid.points.map(([x, y], i) => (
            <use
              key={i}
              href={`#generic-icon-${country.iso3}`}
              x={x}
              y={y}
              width={ICON_WIDTH}
              height={ICON_HEIGHT}
              className="pictogram-icon"
            />
          ))}
        </svg>
      </div>

      <dl className="pictogram-stats">
        <div>
          <dt>{label}</dt>
          <dd>{formatIndicatorValue(value, unit)}</dd>
        </div>
      </dl>

      <p className="pictogram-icon-count">1 icon ≈ {formatIndicatorValue(iconValue, unit)}</p>
    </div>
  );
}
