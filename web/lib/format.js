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

// Formats a value that's already in a specific country's own currency (e.g.
// minimum wage figures, which aren't comparable across countries without an
// FX conversion the site doesn't do) — unlike formatCompareValue/
// formatIndicatorValue, this never assumes US$. `symbol` is whatever should
// be shown before the number (a currency symbol like "€", or a currency
// code like "USD" if no symbol is available).
export function formatLocalCurrency(value, symbol) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return symbol ? `${symbol} ${formatNumber(num)}` : formatNumber(num);
}

// Relative time for news headlines ("2h ago", "3d ago") — /noticias only.
// Falls back to a short date once it's more than a week old, since
// "9d ago" reads worse than the actual date at that point.
export function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
