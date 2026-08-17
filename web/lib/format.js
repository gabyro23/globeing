const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  return numberFormatter.format(value);
}

export function formatCompact(value) {
  if (value === null || value === undefined || value === "") return "—";
  return compactFormatter.format(value);
}

export function formatArea(km2) {
  return `${formatNumber(km2)} km²`;
}

export function formatPopulation(people) {
  return formatNumber(people);
}

export function formatAreaCompact(km2) {
  return `${formatCompact(km2)} km²`;
}

export function formatPopulationCompact(people) {
  return formatCompact(people);
}

const decimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

// Formatea el valor de un indicador (de lib/indicators.js) según su unidad,
// para mostrarlo como etiqueta en el pictograma de comparación.
export function formatIndicatorValue(value, unit) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";

  if (unit === "%") return `${decimalFormatter.format(num)}%`;
  if (unit === "años") return `${decimalFormatter.format(num)} años`;
  if (unit === "US$") return `US$ ${formatCompact(num)}`;
  if (unit) return `${formatNumber(num)} ${unit}`;
  return formatNumber(num);
}
