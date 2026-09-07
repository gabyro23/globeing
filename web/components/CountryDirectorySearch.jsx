"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// Client-side search + the actual continent-grouped grid for the
// /country hub's directory. The server page (app/country/page.js) still
// fetches and renders every country up front for SEO/no-JS — this just
// narrows what's visible as the visitor types, reusing the same
// .search-bar look as the Compare tool's search (see components/
// SearchBar.jsx) even though the filtering logic here is simpler (no
// selection state, just show/hide).
export default function CountryDirectorySearch({ continents }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return continents;
    return continents
      .map((group) => ({
        ...group,
        countries: group.countries.filter(
          (c) => c.name.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.countries.length > 0);
  }, [continents, query]);

  const totalMatches = filtered.reduce((sum, g) => sum + g.countries.length, 0);
  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="search-bar country-directory__search">
        <div className="search-bar__box">
          <span className="search-bar__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a country... e.g. Argentina, Japan"
            aria-label="Search countries"
            autoComplete="off"
          />
          {hasQuery && (
            <button
              type="button"
              className="search-bar__clear"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              ×
            </button>
          )}
        </div>
        {hasQuery && (
          <p className="country-directory__search-count">
            {totalMatches} {totalMatches === 1 ? "match" : "matches"} for &quot;{query}&quot;
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="country-directory__empty">No country matches &quot;{query}&quot;.</p>
      ) : (
        filtered.map((group) => (
          <div key={group.name} className="country-directory__continent">
            <h3 className="country-directory__continent-title">
              {group.name}
              <span className="country-directory__continent-count">{group.countries.length}</span>
            </h3>
            <div className="country-directory__grid">
              {group.countries.map((c) =>
                c.indexed ? (
                  <Link key={c.iso3} href={`/country/${c.slug}`} className="country-directory__item">
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.name}</span>
                  </Link>
                ) : (
                  <Link
                    key={c.iso3}
                    href={`/compare?countries=${c.iso3}`}
                    className="country-directory__item country-directory__item--pending"
                    title={`${c.name} doesn't have its own page yet — compare it with any other country`}
                  >
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.name}</span>
                  </Link>
                )
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}
