"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { factDateLabel } from "../lib/dailyFact";
import { flagForCountryName } from "../lib/randomFactFlags";
import { factCountryMeta } from "../lib/randomFactMeta";

// Continents in a fixed, sensible order — only the ones actually present
// in the archive get a chip (same "only show what's in the data" approach
// as Rankings' REGION_ORDER).
const REGION_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania", "Other"];

const PAGE_SIZE = 12;

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Archive grid for the Random Facts page: search plus category/continent
// filter chips plus pagination, all client-side — the whole year's
// accumulated facts are already on the page, so there's no round trip for
// any of it.
export default function FactArchive({ archive }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(null);
  const [continent, setContinent] = useState(null);
  const [page, setPage] = useState(1);

  const decorated = useMemo(
    () => archive.map((f) => ({ ...f, meta: factCountryMeta(f.country) })),
    [archive]
  );

  const categories = useMemo(() => {
    const present = new Set(decorated.map((f) => f.category));
    return [...present].sort();
  }, [decorated]);

  const continents = useMemo(() => {
    const present = new Set(decorated.map((f) => f.meta.region).filter(Boolean));
    return REGION_ORDER.filter((r) => present.has(r));
  }, [decorated]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return decorated.filter((f) => {
      if (category && f.category !== category) return false;
      if (continent && f.meta.region !== continent) return false;
      if (!query) return true;
      const haystack = [f.fact, f.country, f.category, f.meta.region, f.meta.capital]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [decorated, search, category, continent]);

  const hasFilters = Boolean(category || continent || search.trim());
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Jump back to page 1 whenever the result set changes shape (a new
  // search term or filter) — adjusting state during render, per React's
  // guidance, rather than in a useEffect (which would cause an extra
  // cascading render for something render can settle in one pass).
  const filterKey = `${search}::${category}::${continent}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function clearFilters() {
    setSearch("");
    setCategory(null);
    setContinent(null);
  }

  return (
    <section className="fact-archive">
      <div className="fact-archive__header">
        <div>
          <h2 className="fact-archive__title">Archive</h2>
          <p className="fact-archive__result-label">
            {filtered.length} of {decorated.length} facts{hasFilters ? " · filtered" : ""}
          </p>
        </div>
        <div className="fact-archive__header-controls">
          <div className="fact-archive__search">
            <span className="fact-archive__search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search facts or countries..."
              autoComplete="off"
              aria-label="Search the fact archive"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {hasFilters && (
            <button type="button" className="btn-text" onClick={clearFilters}>
              ↺ Clear filters
            </button>
          )}
        </div>
      </div>

      {(categories.length > 1 || continents.length > 1) && (
        <div className="fact-archive__filters">
          {categories.length > 1 && (
            <div className="fact-archive__filter-row">
              <span className="fact-archive__filter-label">Category</span>
              <div className="fact-archive__filter-tabs">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={"fact-archive__filter-tab" + (category === c ? " is-active" : "")}
                    onClick={() => setCategory(category === c ? null : c)}
                  >
                    {titleCase(c)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {continents.length > 1 && (
            <div className="fact-archive__filter-row">
              <span className="fact-archive__filter-label">Continent</span>
              <div className="fact-archive__filter-tabs">
                {continents.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={"fact-archive__filter-tab" + (continent === r ? " is-active" : "")}
                    onClick={() => setContinent(continent === r ? null : r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="fact-archive__empty">No facts match your search or filters.</p>
      ) : (
        <>
          <div className="fact-archive__grid">
            {pageItems.map((f) => (
              <article className="fact-card" key={f.day}>
                <div className="fact-card__header">
                  <span className="fact-card__date">{factDateLabel(f.day)}</span>
                  <span className="fact-card__category">{f.category}</span>
                </div>
                <p className="fact-card__text">{f.fact}</p>
                <div className="fact-card__footer">
                  <span className="fact-card__country">
                    {flagForCountryName(f.country)} {f.country}
                  </span>
                  <div className="fact-card__spacer" />
                  {f.meta.href ? (
                    <Link href={f.meta.href} className="fact-card__link">
                      View →
                    </Link>
                  ) : (
                    <a className="fact-card__source" href={f.source.url} target="_blank" rel="noreferrer">
                      {f.source.name}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="fact-archive__pagination">
              <button
                type="button"
                className="fact-archive__page-arrow"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                aria-label="Previous page"
              >
                ←
              </button>
              <span className="fact-archive__page-label">
                Page {pageSafe} of {totalPages}
              </span>
              <button
                type="button"
                className="fact-archive__page-arrow"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                aria-label="Next page"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
