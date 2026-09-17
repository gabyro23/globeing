"use client";

import { useMemo } from "react";
import { formatIndicatorValue } from "../lib/format";
import { EMPLOYED_POSES, IDLE_POSES, POSE_NAMES, renderPrimitives } from "../lib/employmentIcons";

// Unemployment's own bespoke visual (replaces the generic placeholder):
// a fixed 5x5 grid of 25 figures per country, green (employed) first and
// grey (unemployed) trailing at the end, with one transitional figure
// shaded grey from the feet up when the rate doesn't land on an exact
// icon boundary. Unlike population/GDP, unemployment is already a 0-100%
// share, so a FIXED total (rather than one scaled to the group's largest
// country) reads correctly for every country on its own — each icon is
// always a fixed 4% of the labor force. Mirrors the "1A" layout from the
// Unemployment.dc.html reference design.
export const GRID_TOTAL = 25;
const GRID_COLUMNS = 5;
export const UNIT_PCT = 100 / GRID_TOTAL; // 4% per icon

export const ICON_WIDTH = 26;
export const ICON_HEIGHT = 52;
const ICON_COLUMN_GAP = 10;
const ICON_ROW_GAP = 12;

const GRID_ROWS = Math.ceil(GRID_TOTAL / GRID_COLUMNS);
// Exported so CompareResults can size this view's canvas — the grid's
// row/column count never changes (always 25 icons, 5 wide), so this is a
// fixed height rather than something computed per comparison group.
export const CANVAS_CONTENT_HEIGHT = GRID_ROWS * ICON_HEIGHT + (GRID_ROWS - 1) * ICON_ROW_GAP;

// Deterministic pose spread per country so the grid reads as a crowd, not
// clones, and stays stable across re-renders.
function poseFor(seed, i) {
  const n = (seed * 7 + i * 11 + ((i * i) % 5)) % POSE_NAMES.length;
  return POSE_NAMES[n];
}

function seedFor(code) {
  return Array.from(code || "").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

// One figure's state: 1 = employed, 0 = unemployed, 0<f<1 = the single
// transitional figure (shaded grey from the feet up by `f`). Employed
// figures come first, the transitional one next, unemployed (grey) ones
// trail at the end — "greys at the end" per the reference design.
function statesForRate(ratePct) {
  const n = Math.max(0, ratePct) / UNIT_PCT;
  const full = Math.min(GRID_TOTAL, Math.floor(n));
  const hasFrac = full < GRID_TOTAL && +(n - full).toFixed(2) > 0;
  const frac = hasFrac ? +(n - full).toFixed(2) : 0;
  const employedCount = Math.max(0, GRID_TOTAL - full - (hasFrac ? 1 : 0));

  const states = [];
  for (let i = 0; i < employedCount; i++) states.push(1);
  if (hasFrac) states.push(frac);
  for (let i = 0; i < full; i++) states.push(0);
  return states;
}

function Figure({ state, pose, clipId }) {
  if (state === 1 || state === 0) {
    return (
      <svg width={ICON_WIDTH} height={ICON_HEIGHT} viewBox="0 0 60 120" aria-hidden="true">
        {renderPrimitives((state === 1 ? EMPLOYED_POSES : IDLE_POSES)[pose])}
      </svg>
    );
  }
  return (
    <svg width={ICON_WIDTH} height={ICON_HEIGHT} viewBox="0 0 60 120" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x={-8} y={120 - 120 * state} width={76} height={120 * state + 8} />
        </clipPath>
      </defs>
      {renderPrimitives(EMPLOYED_POSES[pose])}
      <g clipPath={`url(#${clipId})`}>{renderPrimitives(IDLE_POSES[pose])}</g>
    </svg>
  );
}

// One country's unemployment grid, inside the same .pictogram-column /
// .pictogram-canvas / .pictogram-stats structure as the other comparison
// views (CompareResults renders the shared legend footer below, and sizes
// `canvasHeight` from CANVAS_CONTENT_HEIGHT above).
export default function UnemploymentPictogram({ country, canvasHeight }) {
  const ratePct = Number(country.unemployment_pct) || 0;
  const states = useMemo(() => statesForRate(ratePct), [ratePct]);
  const seed = useMemo(() => seedFor(country.iso3), [country.iso3]);
  const unemployedShare = ratePct / UNIT_PCT;

  return (
    <div className="pictogram-column">
      <h3 className="pictogram-column__title">
        {country.flag} {country.name}
      </h3>

      <div className="pictogram-canvas" style={{ height: canvasHeight }}>
        <div
          className="unemployment-grid"
          style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${ICON_WIDTH}px)`, columnGap: ICON_COLUMN_GAP, rowGap: ICON_ROW_GAP }}
          role="img"
          aria-label={`${GRID_TOTAL} figures representing ${country.name}'s labor force; about ${unemployedShare.toFixed(1)} are unemployed`}
        >
          {states.map((state, i) => (
            <Figure key={i} state={state} pose={poseFor(seed, i)} clipId={`unemp-clip-${country.iso3}-${i}`} />
          ))}
        </div>
      </div>

      <dl className="pictogram-stats">
        <div>
          <dt>Unemployment</dt>
          <dd>{formatIndicatorValue(ratePct, "%")}</dd>
        </div>
      </dl>

      <p className="pictogram-icon-count">
        {unemployedShare.toFixed(1)} out of every {GRID_TOTAL} people
      </p>
    </div>
  );
}
