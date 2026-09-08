"use client";

import { useState } from "react";
import { handleDragStart, readDraggedAlpha3 } from "../lib/dnd";
import { paletteColor } from "../lib/palette";
import { MAX_COMPARE } from "../lib/constants";

// The sticky bottom bar: chosen-country chips (color-coded to match their
// slot card, draggable to reorder) plus the CTA that moves to the results
// screen. Fixed to the bottom of the viewport so it's reachable from
// anywhere on the selection screen (search, slots, or map) without
// scrolling back up. See CompareSlots for the bigger per-country preview
// cards above it in the page.
export default function SelectedCountries({ selectedCountries, onRemove, onReorder, onOpenCompare }) {
  const [dropTarget, setDropTarget] = useState(null); // { iso3, before }

  const canOpenCompare = selectedCountries.length >= 2;
  const label =
    selectedCountries.length === 0
      ? "Pick at least two countries"
      : selectedCountries.length === 1
        ? "One more to go"
        : `Comparing ${selectedCountries.length} of ${MAX_COMPARE}`;

  return (
    <div className="compare-sticky-bar">
      <div className="compare-sticky-bar__inner">
        <div className="compare-sticky-bar__chips-group">
          <span className="compare-sticky-bar__label">{label}</span>
          <div className="compare-zone__chips">
            {selectedCountries.map((country, index) => (
              <div
                key={country.iso3}
                className={
                  "compare-chip" +
                  (dropTarget?.iso3 === country.iso3 ? (dropTarget.before ? " drop-before" : " drop-after") : "")
                }
                draggable
                onDragStart={handleDragStart(country.iso3)}
                onDragOver={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const before = e.clientX - rect.left < rect.width / 2;
                  setDropTarget({ iso3: country.iso3, before });
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const draggedAlpha3 = readDraggedAlpha3(e);
                  const before = dropTarget?.before ?? true;
                  setDropTarget(null);
                  if (!draggedAlpha3 || draggedAlpha3 === country.iso3) return;
                  onReorder(draggedAlpha3, index, before);
                }}
              >
                <span className="compare-chip__dot" style={{ background: paletteColor(index) }} aria-hidden="true" />
                <span>{country.name}</span>
                <button
                  type="button"
                  className="compare-chip__remove"
                  aria-label={`Remove ${country.name}`}
                  onClick={() => onRemove(country.iso3)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={!canOpenCompare}
          title={canOpenCompare ? "Compare these countries" : "Pick at least 2 countries to compare"}
          onClick={onOpenCompare}
        >
          Compare →
        </button>
      </div>
    </div>
  );
}
