"use client";

import CountryCard from "./CountryCard";

// Port of js/components/countryList.js — now used exclusively as the
// search dropdown's result list (see SearchBar).
export default function CountryList({ countries, selectedAlpha3, onToggle }) {
  return (
    <div>
      <p className="country-list__count">
        {countries.length} {countries.length === 1 ? "country" : "countries"}
      </p>
      <div className="country-list">
        {countries.length === 0 ? (
          <p className="country-list__empty">No country matches your search.</p>
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
