"use client";

import { useEffect, useRef, useState } from "react";
import CountryList from "./CountryList";

// Barra de búsqueda única (reemplaza al viejo panel de filtros): la lista de
// resultados es un dropdown que sólo aparece mientras hay texto escrito.
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
          placeholder="Buscar país... ej. Argentina, Japón"
          autoComplete="off"
          aria-label="Buscar país"
          value={searchValue}
          onChange={handleInput}
        />
        {hasQuery && (
          <button type="button" className="search-bar__clear" aria-label="Limpiar búsqueda" onClick={handleClear}>
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
