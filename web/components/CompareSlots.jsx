"use client";

import { INDICATORS } from "../lib/indicators";
import { formatCompareValue } from "../lib/format";
import { paletteColor } from "../lib/palette";
import { MAX_COMPARE } from "../lib/constants";

// The five indicators shown as a quick preview on each slot card — the
// same "headline" set Density/GDP/GDP per capita already treat as the
// baseline story for a country (see CompareResults' DENSITY_BUNDLE_KEYS /
// CUSTOM_VIEW_KEYS).
const PREVIEW_KEYS = ["population", "population_density", "area_km2", "gdp_usd", "gdp_per_capita_usd"];
const PREVIEW_INDICATORS = PREVIEW_KEYS.map((key) => INDICATORS.find((ind) => ind.key === key)).filter(
  Boolean
);

// Three fixed slots (MAX_COMPARE) — an empty one is a dashed "+ Add
// country" button that focuses the search input; a filled one previews
// its headline stats relative to the *other currently selected*
// countries, so you get a first read before opening the full comparison.
export default function CompareSlots({ selectedCountries, onRemove, onFocusSearch }) {
  const slots = Array.from({ length: MAX_COMPARE }, (_, i) => selectedCountries[i] ?? null);

  return (
    <div className="compare-slots">
      {slots.map((country, i) => (
        <div className={"compare-slot" + (country ? " is-filled" : "")} key={country?.iso3 ?? `empty-${i}`}>
          <div className="compare-slot__header">
            <div className="compare-slot__identity">
              {country && (
                <span className="compare-slot__flag" aria-hidden="true">
                  {country.flag}
                </span>
              )}
              <div className="compare-slot__name">{country ? country.name : `Country ${i + 1}`}</div>
            </div>
            {country && (
              <button
                type="button"
                className="compare-slot__remove"
                aria-label={`Remove ${country.name}`}
                onClick={() => onRemove(country.iso3)}
              >
                ×
              </button>
            )}
          </div>

          {country ? (
            <div className="compare-slot__rows">
              {PREVIEW_INDICATORS.map((ind) => {
                const others = selectedCountries.map((c) => Number(c[ind.key]) || 0);
                const max = Math.max(...others, Number(country[ind.key]) || 0, 1);
                const value = Number(country[ind.key]) || 0;
                return (
                  <div className="compare-slot__row" key={ind.key}>
                    <div className="compare-slot__row-top">
                      <span>{ind.label}</span>
                      <span>{formatCompareValue(value, ind.unit)}</span>
                    </div>
                    <div className="compare-bar-row__track">
                      <div
                        className="compare-bar-row__fill"
                        style={{ width: `${Math.max((value / max) * 100, 2)}%`, background: paletteColor(i) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <button type="button" className="compare-slot__add" onClick={onFocusSearch}>
              + Add country
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
