"use client";

import { useEffect, useRef, useState } from "react";
import CountryList from "./CountryList";

// Single search bar (replaces the old filter panel): the results list is a
// dropdown that only appears while there's text typed in.
export default function SearchBar({ countries, selectedAlpha3, onToggle, search, onSearchChange }) {
  const [searchValue, setSearchValue] = useState(search);
  const debounceRef = useRef(null);

  useEffect(() => setSearchValue(search), [search]);

  function handleInput(e) {
    const value = e.target.value;
    setSearchValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value.trim()), 150);
  }

  function handleClear() {
    clearTimeout(debounceRef.current);
    setSearchValue("");
    onSearchChange("");
  }

  const hasQuery = searchValue.trim().length > 0;

  return (
    <div className="search-bar">
      <div className="search-bar__box">
        <span className="search-bar__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id="global-search"
          type="search"
          placeholder="Search for a country... e.g. Argentina, Japan"
          autoComplete="off"
          aria-label="Search country"
          value={searchValue}
          onChange={handleInput}
        />
        {hasQuery && (
          <button type="button" className="search-bar__clear" aria-label="Clear search" onClick={handleClear}>
            ×
          </button>
        )}
      </div>

      {hasQuery && (
        <div className="search-bar__results">
          <CountryList countries={countries} selectedAlpha3={selectedAlpha3} onToggle={onToggle} />
        </div>
      )}
    </div>
  );
}
