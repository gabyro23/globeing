// Builds the "difference between the data" sentences (e.g. "Argentina has
// 3.2× more population than Spain") for the visual comparison screen.
// For each statistic, the country with the highest value is the reference
// and gets compared against each of the others.

const SIMILAR_THRESHOLD = 1.05; // below this ratio, countries are considered "similar"

function formatMultiplier(ratio) {
  if (!Number.isFinite(ratio) || ratio < SIMILAR_THRESHOLD) return null;
  const decimals = ratio < 10 ? 1 : 0;
  return `${ratio.toFixed(decimals)}×`;
}

// Sentence per statistic type: "area" reads as size ("bigger/smaller"),
// everything else reads as a quantity ("has N× more <indicator>").
function sentenceFor(statKey, label, referenceName, subjectName, mult) {
  if (!mult) return `${referenceName} and ${subjectName} have a similar ${label.toLowerCase()}.`;
  if (statKey === "area_km2") {
    return `${referenceName} is ${mult} bigger than ${subjectName} in area.`;
  }
  return `${referenceName} has ${mult} more ${label.toLowerCase()} than ${subjectName}.`;
}

// Returns [{ key, text }] comparing each country against the one with the
// highest value of `statKey` (the reference). Skipped if fewer than 2
// countries have valid data for that statistic.
export function buildStatComparisons(countries, statKey, label) {
  const values = countries
    .map((country) => ({ country, value: Number(country[statKey]) }))
    .filter((v) => Number.isFinite(v.value) && v.value > 0);

  if (values.length < 2) return [];

  const reference = values.reduce((max, v) => (v.value > max.value ? v : max), values[0]);

  return values
    .filter((v) => v.country.iso3 !== reference.country.iso3)
    .map((v) => {
      const ratio = reference.value / v.value;
      const mult = formatMultiplier(ratio);
      return {
        key: `${statKey}-${v.country.iso3}`,
        text: sentenceFor(statKey, label, reference.country.name, v.country.name, mult),
      };
    });
}

// Short badge-style label for a country versus the largest in the group by
// area (e.g. "5.5× smaller", or "Base scale" if it is the largest).
export function scaleBadgeLabel(area, maxArea) {
  if (!area || !maxArea) return null;
  if (area >= maxArea) return "Base scale";
  const mult = formatMultiplier(maxArea / area);
  return mult ? `${mult} smaller` : "Similar size";
}
