// The 11 indicators we pulled in Phase 1, ready to show on screen.
// `betterWhen` says whether a higher ("high") or lower ("low") value is
// better — used by the Rankings page to decide what counts as "top" and
// what counts as "bottom" for each indicator (e.g. inflation/unemployment:
// less is better). `category` groups them for the Compare page's category
// filter (shared by the "Compare by" visual tabs and the individual-stats
// grid) — CATEGORIES below is the filter's chip order, "All" first.
export const INDICATORS = [
  { key: "population", label: "Population", unit: "", betterWhen: "high", category: "Demographics" },
  { key: "population_density", label: "Population density", unit: "people/km²", betterWhen: "high", category: "Geography" },
  { key: "area_km2", label: "Area", unit: "km²", betterWhen: "high", category: "Geography" },
  { key: "urban_pct", label: "Urban population", unit: "%", betterWhen: "high", category: "Demographics" },
  { key: "gdp_usd", label: "GDP", unit: "US$", betterWhen: "high", category: "Economy" },
  { key: "gdp_per_capita_usd", label: "GDP per capita", unit: "US$", betterWhen: "high", category: "Economy" },
  { key: "gdp_growth_pct", label: "GDP growth", unit: "%", betterWhen: "high", category: "Economy" },
  { key: "inflation_pct", label: "Inflation", unit: "%", betterWhen: "low", category: "Economy" },
  { key: "unemployment_pct", label: "Unemployment", unit: "%", betterWhen: "low", category: "Economy" },
  { key: "life_expectancy_years", label: "Life expectancy", unit: "years", betterWhen: "high", category: "Society" },
  { key: "internet_users_pct", label: "Internet usage", unit: "%", betterWhen: "high", category: "Society" },
];

export const CATEGORIES = ["All", "Economy", "Geography", "Demographics", "Society"];
