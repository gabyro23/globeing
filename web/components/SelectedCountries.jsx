"use client";

import { useState } from "react";
import { handleDragStart, readDraggedAlpha3 } from "../lib/dnd";

// The selected-countries chip row, plus the button that opens the visual
// comparison modal. Sits between the search bar and the map. See
// CompareCharts for the indicator bar-chart breakdown, which lives further
// down the page.
export default function SelectedCountries({ selectedCountries, onRemove, onReorder, onOpenCompare }) {
  const [dropTarget, setDropTarget] = useState(null); // { iso3, before }

  const canOpenCompare = selectedCountries.length >= 2;

  return (
    <div className="compare-zone">
      <div className="compare-zone__header">
        <div className="compare-zone__chips">
          {selectedCountries.length === 0 ? (
            <span className="compare-zone__placeholder">No countries selected yet.</span>
          ) : (
            selectedCountries.map((country, index) => (
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
                <span>
                  {country.flag} {country.name}
                </span>
                <button
                  type="button"
                  className="compare-chip__remove"
                  aria-label={`Remove ${country.name}`}
                  onClick={() => onRemove(country.iso3)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={!canOpenCompare}
          title={canOpenCompare ? "Open visual comparison" : "Pick at least 2 countries to compare"}
          onClick={onOpenCompare}
        >
          View comparison →
        </button>
      </div>
    </div>
  );
}
