// Genera las frases de "diferencia entre los datos" (ej. "Argentina tiene
// 3.2× más población que España") para la pantalla de comparación visual.
// Para cada estadística, el país con el valor más alto es la referencia y
// se compara contra cada uno de los demás.

const SIMILAR_THRESHOLD = 1.05; // si el ratio es menor a esto, se consideran "similares"

function formatMultiplier(ratio) {
  if (!Number.isFinite(ratio) || ratio < SIMILAR_THRESHOLD) return null;
  const decimals = ratio < 10 ? 1 : 0;
  return `${ratio.toFixed(decimals)}×`;
}

// Frase por tipo de estadística: "área" se lee como tamaño ("más grande/chico"),
// el resto se lee como cantidad ("tiene N× más <indicador>").
function sentenceFor(statKey, label, referenceName, subjectName, mult) {
  if (!mult) return `${referenceName} y ${subjectName} tienen ${label.toLowerCase()} similar.`;
  if (statKey === "area_km2") {
    return `${referenceName} es ${mult} más grande que ${subjectName} en superficie.`;
  }
  return `${referenceName} tiene ${mult} más ${label.toLowerCase()} que ${subjectName}.`;
}

// Devuelve [{ key, text }] comparando cada país contra el que tiene el valor
// más alto de `statKey` (la referencia). Se omite si hay menos de 2 países
// con datos válidos para esa estadística.
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

// Etiqueta corta tipo badge para un país frente al más grande del grupo por
// superficie (ej. "5.5× más chico" o "Escala base" si es el más grande).
export function scaleBadgeLabel(area, maxArea) {
  if (!area || !maxArea) return null;
  if (area >= maxArea) return "Escala base";
  const mult = formatMultiplier(maxArea / area);
  return mult ? `${mult} más chico` : "Tamaño similar";
}
