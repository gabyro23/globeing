"use client";

import {
  formatArea,
  formatAreaCompact,
  formatPopulation,
  formatPopulationCompact,
} from "../lib/format";
import { handleDragStart } from "../lib/dnd";

// Port de js/components/countryCard.js
export default function CountryCard({ country, selected, onToggle }) {
  return (
    <article
      className={"country-card" + (selected ? " is-selected" : "")}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      title={selected ? "Click o arrastrá para quitar de la comparación" : "Click o arrastrá para agregar a la comparación"}
      draggable
      onDragStart={handleDragStart(country.iso3)}
      onClick={() => onToggle(country.iso3)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(country.iso3);
        }
      }}
    >
      <span className="country-card__flag" aria-hidden="true">
        {country.flag}
      </span>
      <div className="country-card__body">
        <h3 className="country-card__name">{country.name}</h3>
        <dl className="country-card__stats">
          <div>
            <dt>Población</dt>
            <dd title={formatPopulation(country.population)}>
              {formatPopulationCompact(country.population)}
            </dd>
          </div>
          <div>
            <dt>Superficie</dt>
            <dd title={formatArea(country.area_km2)}>{formatAreaCompact(country.area_km2)}</dd>
          </div>
        </dl>
      </div>
      <span className="country-card__check" aria-hidden="true">
        {selected ? "✓" : "+"}
      </span>
    </article>
  );
}
