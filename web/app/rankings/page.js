"use client";

import { useEffect, useMemo, useState } from "react";
import { INDICATORS } from "../../lib/indicators";
import { metaForAlpha3 } from "../../lib/countryMeta";
import { formatCompareValue } from "../../lib/format";

// Página de Rankings: elegís un indicador (PIB, superficie, etc.) con los
// botones de arriba y se arman 3 tablas — el top 10, el último 10, y el
// listado completo — todas ordenadas por ese indicador.
export default function RankingsPage() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(INDICATORS[0].key);

  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((rows) => {
        if (rows.error) throw new Error(rows.error);
        setCountries(rows.map((c) => ({ ...c, ...metaForAlpha3(c.iso3) })));
      })
      .catch((err) => setError(err.message));
  }, []);

  const indicator = useMemo(
    () => INDICATORS.find((i) => i.key === selectedKey) ?? INDICATORS[0],
    [selectedKey]
  );

  const ranked = useMemo(() => {
    const dir = indicator.betterWhen === "low" ? 1 : -1;
    return countries
      .map((c) => ({ ...c, __value: Number(c[indicator.key]) }))
      .filter((c) => c[indicator.key] !== null && c[indicator.key] !== undefined && c[indicator.key] !== "" && !Number.isNaN(c.__value))
      .sort((a, b) => (a.__value - b.__value) * dir);
  }, [countries, indicator]);

  const best10 = useMemo(() => ranked.slice(0, 10).map((c, i) => ({ ...c, rank: i + 1 })), [ranked]);
  const worst10 = useMemo(
    () =>
      ranked
        .slice(-10)
        .reverse()
        .map((c, i) => ({ ...c, rank: ranked.length - i })),
    [ranked]
  );
  const allRanked = useMemo(() => ranked.map((c, i) => ({ ...c, rank: i + 1 })), [ranked]);

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Rankings</h1>
        <p className="app-hero__subtitle">
          Elegí un indicador y mirá qué países lideran la tabla — y cuáles quedan últimos.
        </p>
      </div>

      {countries.length === 0 && !error && (
        <div className="status">
          <span className="status__spinner" aria-hidden="true" />
          <span>Cargando datos…</span>
        </div>
      )}

      {error && (
        <div className="status status--error">
          <span>No se pudo cargar la app: {error}</span>
        </div>
      )}

      {countries.length > 0 && (
        <div className="rankings-page">
          <div className="ranking-tabs" role="tablist" aria-label="Elegir indicador">
            {INDICATORS.map((ind) => (
              <button
                key={ind.key}
                type="button"
                role="tab"
                aria-selected={ind.key === selectedKey}
                className={"ranking-tab" + (ind.key === selectedKey ? " is-active" : "")}
                onClick={() => setSelectedKey(ind.key)}
              >
                {ind.label}
              </button>
            ))}
          </div>

          <div className="ranking-tables">
            <RankingTable
              title={`Top 10 — ${indicator.label}`}
              rows={best10}
              indicator={indicator}
              tone="best"
            />
            <RankingTable
              title={`Últimos 10 — ${indicator.label}`}
              rows={worst10}
              indicator={indicator}
              tone="worst"
            />
          </div>

          <RankingTable
            title={`Todos los países — ${indicator.label}`}
            rows={allRanked}
            indicator={indicator}
            tone="all"
            tall
          />
        </div>
      )}
    </>
  );
}

function RankingTable({ title, rows, indicator, tone, tall }) {
  return (
    <section className={"ranking-table-card ranking-table-card--" + tone}>
      <h2 className="ranking-table-card__title">{title}</h2>
      <div className={"ranking-table-scroll" + (tall ? " ranking-table-scroll--tall" : "")}>
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="ranking-table__rank-col">#</th>
              <th>País</th>
              <th className="ranking-table__value-col">
                {indicator.label}
                {indicator.unit && ` (${indicator.unit})`}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="ranking-table__empty">
                  Sin datos disponibles para este indicador.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.iso3}>
                  <td className="ranking-table__rank-col">{c.rank}</td>
                  <td>
                    <span className="ranking-table__flag" aria-hidden="true">
                      {c.flag}
                    </span>{" "}
                    {c.name}
                  </td>
                  <td className="ranking-table__value-col">
                    {formatCompareValue(c.__value, indicator.unit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
