// Los 11 indicadores que descargamos en la Fase 1, listos para mostrar en pantalla.
// `betterWhen` indica si un valor más alto ("high") o más bajo ("low") es
// mejor — lo usa la página de Rankings para decidir qué es "top" y qué es
// "último" en cada indicador (ej. inflación/desempleo: menos es mejor).
export const INDICATORS = [
  { key: "population", label: "Población", unit: "", betterWhen: "high" },
  { key: "population_density", label: "Densidad poblacional", unit: "hab/km²", betterWhen: "high" },
  { key: "area_km2", label: "Superficie", unit: "km²", betterWhen: "high" },
  { key: "urban_pct", label: "Población urbana", unit: "%", betterWhen: "high" },
  { key: "gdp_usd", label: "PIB", unit: "US$", betterWhen: "high" },
  { key: "gdp_per_capita_usd", label: "PIB per cápita", unit: "US$", betterWhen: "high" },
  { key: "gdp_growth_pct", label: "Crecimiento del PIB", unit: "%", betterWhen: "high" },
  { key: "inflation_pct", label: "Inflación", unit: "%", betterWhen: "low" },
  { key: "unemployment_pct", label: "Desempleo", unit: "%", betterWhen: "low" },
  { key: "life_expectancy_years", label: "Esperanza de vida", unit: "años", betterWhen: "high" },
  { key: "internet_users_pct", label: "Uso de internet", unit: "%", betterWhen: "high" },
];
