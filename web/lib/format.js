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

// Share of a target's area, e.g. for "this country is 2.9% of Russia" in
// the "Fill the country" puzzle. Keeps enough precision for the very
// small shares that come up a lot there (Vatican-sized slivers of a
// huge container) without turning into a wall of decimals for the big
// ones.
export function formatSharePercent(percent) {
  if (!Number.isFinite(percent) || percent <= 0) return "0%";
  if (percent < 0.01) return "<0.01%";
  if (percent < 1) return `${percent.toFixed(2)}%`;
  return `${percent.toFixed(1)}%`;
}

export function formatAreaCompact(km2) {
  return `${formatCompact(km2)} km²`;
}

export function formatPopulationCompact(people) {
  return formatCompact(people);
}

const decimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

// Formats an indicator's value (from lib/indicators.js) based on its unit,
// for display as a label in the comparison pictogram.
export function formatIndicatorValue(value, unit) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";

  if (unit === "%") return `${decimalFormatter.format(num)}%`;
  if (unit === "years") return `${decimalFormatter.format(num)} years`;
  if (unit === "US$") return `US$ ${formatCompact(num)}`;
  if (unit) return `${formatNumber(num)} ${unit}`;
  return formatNumber(num);
}

// Readable large-number scale (Million/Billion/Trillion), so the
// comparison zone doesn't show extremely long numbers.
function scaledWithWord(num) {
  const abs = Math.abs(num);
  if (abs >= 1e12) return `${decimalFormatter.format(num / 1e12)} Trillion`;
  if (abs >= 1e9) return `${decimalFormatter.format(num / 1e9)} Billion`;
  if (abs >= 1e6) return `${decimalFormatter.format(num / 1e6)} Million`;
  return formatNumber(num);
}

export function formatCompareValue(value, unit) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";

  if (unit === "%") return `${decimalFormatter.format(num)}%`;
  if (unit === "years") return `${decimalFormatter.format(num)} years`;
  if (unit === "US$") return `US$ ${scaledWithWord(num)}`;
  if (unit) return `${scaledWithWord(num)} ${unit}`;
  return scaledWithWord(num);
}
