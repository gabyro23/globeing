"use client";

import { useState } from "react";
import { MAX_COMPARE } from "../lib/constants";
import { INDICATORS } from "../lib/indicators";
import { handleDragStart, readDraggedAlpha3 } from "../lib/dnd";
import { formatCompareValue } from "../lib/format";

function BarGroup({ title, unit, rows }) {
  const max = Math.max(...rows.map((r) => r.value || 0), 1);
  return (
    <section className="compare-bars">
      <h3>
        {title} {unit && `(${unit})`}
      </h3>
      {rows.map((r) => (
        <div className="compare-bar-row" key={r.iso3}>
          <span className="compare-bar-row__label">
            {r.flag} {r.name}
          </span>
          <div className="compare-bar-row__track">
            <div
              className="compare-bar-row__fill"
              style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="compare-bar-row__value">{formatCompareValue(r.value, unit)}</span>
        </div>
      ))}
    </section>
  );
}

// Port of js/components/compareZone.js — extended to show all 11
// indicators instead of just population and area.
export default function CompareZone({ selectedCountries, onDropAlpha3, onRemove, onReorder, onOpenCompare }) {
  const [dragOver, setDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState(null); // { iso3, before }

  const isFull = selectedCountries.length >= MAX_COMPARE;
  const canOpenCompare = selectedCountries.length >= 2;

  return (
    <div className="compare-zone">
      <div
        className={"compare-zone__dropbox" + (dragOver ? " is-dragover" : "") + (isFull ? " is-full" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const alpha3 = readDraggedAlpha3(e);
          if (alpha3) onDropAlpha3(alpha3);
        }}
      >
        <div className="compare-zone__dropbox-header">
          <p className="compare-zone__hint">
            Drag countries here (or click on the map / list) to compare them — up to {MAX_COMPARE}.
          </p>
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
          ))}
        </div>
      </div>

      <div className="compare-zone__charts">
        {selectedCountries.length === 0 ? (
          <p className="compare-zone__empty">You haven&apos;t picked any countries to compare yet.</p>
        ) : (
          INDICATORS.map((ind) => {
            const rows = selectedCountries
              .map((c) => ({
                iso3: c.iso3,
                flag: c.flag,
                name: c.name,
                value: Number(c[ind.key]) || 0,
              }))
              .sort((a, b) => b.value - a.value);
            return <BarGroup key={ind.key} title={ind.label} unit={ind.unit} rows={rows} />;
          })
        )}
      </div>
    </div>
  );
}
