"use client";

import { useEffect, useMemo, useState } from "react";
import CountryPictogram from "./CountryPictogram";
import { INDICATORS } from "../lib/indicators";
import { loadWorld, featuresByAlpha3 } from "../lib/worldAtlas";
import { niceIconValue } from "../lib/pictogram";
import { formatNumber } from "../lib/format";

const BOX_SIZE = 260; // px — tamaño del país más grande del set comparado
const BASELINE_KEYS = new Set(["population", "area_km2", "population_density"]);
const EXTRA_INDICATORS = INDICATORS.filter((i) => !BASELINE_KEYS.has(i.key));
const DEFAULT_EXTRA_KEYS = ["gdp_per_capita_usd", "life_expectancy_years"];

// Pantalla de comparación dedicada: silueta real de cada país a escala
// relativa entre sí (el más grande define la escala), con una grilla de
// iconitos representando población, cifras etiquetadas y una leyenda.
// Se abre como overlay a pantalla completa (no cambia la URL).
export default function CompareModal({ open, countries, onClose }) {
  const [featureMap, setFeatureMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [extraKeys, setExtraKeys] = useState(DEFAULT_EXTRA_KEYS);

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || featureMap) return;
    loadWorld()
      .then((world) => setFeatureMap(featuresByAlpha3(world)))
      .catch((err) => setMapError(err.message));
  }, [open, featureMap]);

  const maxArea = useMemo(
    () => Math.max(...countries.map((c) => Number(c.area_km2) || 0), 1),
    [countries]
  );
  const maxPopulation = useMemo(
    () => Math.max(...countries.map((c) => Number(c.population) || 0), 1),
    [countries]
  );
  const iconValue = useMemo(() => niceIconValue(maxPopulation), [maxPopulation]);
  const largestCountry = useMemo(
    () => countries.find((c) => Number(c.area_km2) === maxArea) || countries[0],
    [countries, maxArea]
  );

  function toggleExtra(key) {
    setExtraKeys((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  }

  if (!open) return null;

  return (
    <div className="compare-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="compare-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Comparación visual de países"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="compare-modal__header">
          <div>
            <h2>Comparación visual</h2>
            <p>Siluetas reales a escala relativa según superficie — el país más grande define la escala.</p>
          </div>
          <button type="button" className="compare-modal__close" aria-label="Cerrar comparación" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="compare-modal__indicators">
          <span className="compare-modal__indicators-label">Datos extra a mostrar:</span>
          <div className="compare-modal__indicators-list">
            {EXTRA_INDICATORS.map((ind) => (
              <label className="filter-region-chip" key={ind.key}>
                <input
                  type="checkbox"
                  checked={extraKeys.includes(ind.key)}
                  onChange={() => toggleExtra(ind.key)}
                />
                <span>{ind.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="compare-modal__body">
          {mapError && (
            <div className="status status--error">
              <span>No se pudo cargar el mapa: {mapError}</span>
            </div>
          )}

          {!mapError && !featureMap && (
            <div className="status">
              <span className="status__spinner" aria-hidden="true" />
              <span>Cargando siluetas…</span>
            </div>
          )}

          {featureMap && (
            <div className="pictogram-row">
              {countries.map((country) => (
                <CountryPictogram
                  key={country.iso3}
                  country={country}
                  feature={featureMap.get(country.iso3)}
                  boxSize={BOX_SIZE}
                  maxArea={maxArea}
                  iconValue={iconValue}
                  extraIndicatorKeys={extraKeys}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="compare-modal__legend">
          <span className="compare-modal__legend-icon" aria-hidden="true">
            🧍
          </span>
          <span>
            Cada iconito representa {formatNumber(iconValue)} habitantes. Escala de tamaño en base a la
            superficie real de {largestCountry?.name} (el más grande del grupo).
          </span>
        </footer>
      </div>
    </div>
  );
}
