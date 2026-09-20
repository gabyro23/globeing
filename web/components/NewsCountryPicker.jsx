"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// Search + region filter + horizontal country rail for /noticias — ports
// Gaby's "Breaking News.dc.html" mockup's rail/chip picker. Each pill is
// a real <Link> to /noticias/[country] (not a client-side state switch)
// so every country keeps its own indexable URL — see the project spec's
// "Cambio de alcance" note on why that matters here.
export default function NewsCountryPicker({ countries }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");

  const regions = useMemo(() => {
    const seen = new Set(countries.map((c) => c.region).filter(Boolean));
    return ["All", ...seen];
  }, [countries]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return countries.filter((c) => {
      const matchesRegion = region === "All" || c.region === region;
      const matchesSearch = !term || c.name.toLowerCase().includes(term);
      return matchesRegion && matchesSearch;
    });
  }, [countries, search, region]);

  return (
    <div className="news-toolbar">
      <div className="news-toolbar__row">
        <input
          type="search"
          className="news-search-input"
          placeholder="Search a country... e.g. Panama, Uruguay"
          aria-label="Search country"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="news-chips">
          {regions.map((r) => (
            <button
              type="button"
              key={r}
              className={`news-chip${r === region ? " news-chip--active" : ""}`}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="news-rail">
        {filtered.length === 0 ? (
          <p className="news-rail__empty">No country matches your search.</p>
        ) : (
          filtered.map((c) => (
            <Link key={c.iso3} href={`/noticias/${c.slug}`} className="news-rail__pill">
              <span aria-hidden="true">{c.flag}</span>
              <span>{c.name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
