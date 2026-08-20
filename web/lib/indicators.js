// The 11 indicators we pulled in Phase 1, ready to show on screen.
// `betterWhen` says whether a higher ("high") or lower ("low") value is
// better — used by the Rankings page to decide what counts as "top" and
// what counts as "bottom" for each indicator (e.g. inflation/unemployment:
// less is better).
export const INDICATORS = [
  { key: "population", label: "Population", unit: "", betterWhen: "high" },
  { key: "population_density", label: "Population density", unit: "people/km²", betterWhen: "high" },
  { key: "area_km2", label: "Area", unit: "km²", betterWhen: "high" },
  { key: "urban_pct", label: "Urban population", unit: "%", betterWhen: "high" },
  { key: "gdp_usd", label: "GDP", unit: "US$", betterWhen: "high" },
  { key: "gdp_per_capita_usd", label: "GDP per capita", unit: "US$", betterWhen: "high" },
  { key: "gdp_growth_pct", label: "GDP growth", unit: "%", betterWhen: "high" },
  { key: "inflation_pct", label: "Inflation", unit: "%", betterWhen: "low" },
  { key: "unemployment_pct", label: "Unemployment", unit: "%", betterWhen: "low" },
  { key: "life_expectancy_years", label: "Life expectancy", unit: "years", betterWhen: "high" },
  { key: "internet_users_pct", label: "Internet usage", unit: "%", betterWhen: "high" },
];
