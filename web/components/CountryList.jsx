"use client";

import CountryCard from "./CountryCard";

// Port de js/components/countryList.js
export default function CountryList({ countries, selectedAlpha3, onToggle }) {
  return (
    <div>
      <p className="country-list__count">
        {countries.length} {countries.length === 1 ? "país" : "países"}
      </p>
      <div className="country-list">
        {countries.length === 0 ? (
          <p className="country-list__empty">Ningún país coincide con tus filtros.</p>
        ) : (
          countries.map((country) => (
            <CountryCard
              key={country.iso3}
              country={country}
              selected={selectedAlpha3.has(country.iso3)}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
