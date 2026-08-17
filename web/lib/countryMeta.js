// Metadata que no vive en Supabase (bandera, región) pero que ya
// teníamos curada en el prototipo original (data/countries.json,
// copiado acá como countryTopoIds.json). La usamos para completar
// lo que trae la base de datos.
import topoIds from "./countryTopoIds.json";

const metaByAlpha3 = new Map(topoIds.map((c) => [c.alpha3, c]));

export function alpha2ToFlagEmoji(alpha2) {
  if (!alpha2 || alpha2.length !== 2) return "";
  const codePoints = [...alpha2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function metaForAlpha3(alpha3) {
  const meta = metaByAlpha3.get(alpha3);
  if (!meta) return { flag: "", region: "Other" };
  return { flag: alpha2ToFlagEmoji(meta.alpha2), region: meta.region || "Other" };
}
