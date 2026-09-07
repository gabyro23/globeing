// fetch-country-profiles.mjs
//
// Descarga nombre oficial/constitucional, moneda (nombre, código ISO 4217,
// símbolo — más una lista de TODAS las monedas de curso legal, para países
// que tienen más de una) e idioma(s) oficial(es) para cada país y guarda
// el resultado en docs/data/country_profiles.csv, listo para importar a
// Supabase.
//
// Fuente de datos: "world-countries" (repo mledoze/countries en GitHub,
// https://github.com/mledoze/countries), publicado también como paquete
// npm del mismo nombre. Es un dataset de referencia, de código abierto y
// mantenido activamente, que junta y normaliza estos datos a partir de
// fuentes oficiales/autoritativas: los propios registros ISO 4217 (monedas)
// e ISO 639-3 (idiomas), el CIA World Factbook y Wikipedia. Lo usa el
// propio API "REST Countries" como su fuente de datos.
//
// Por qué esta fuente y no otra:
//   - La API del World Bank (la que usa fetch-world-bank-data.mjs) NO tiene
//     nombre oficial, moneda ni idioma — solo indicadores económicos.
//   - "REST Countries" (restcountries.com), que durante años fue la opción
//     obvia y gratuita para este tipo de dato, pasó a requerir cuenta y
//     API key (con límites mensuales) desde que cambió de dueño — dejó de
//     ser una API pública sin autenticación.
//   - "world-countries" es la fuente subyacente que REST Countries usaba,
//     sigue siendo 100% pública y gratuita (sin API key, sin límite de
//     requests) y se sirve como un único archivo JSON está siempre
//     actualizado a través de jsDelivr, un CDN público.
//
// Requisitos: Node.js 18 o superior (trae `fetch` incluido).
//
// Cómo correrlo (desde la raíz del repo):
//   node fetch-country-profiles.mjs
//
// Al terminar vas a tener un archivo docs/data/country_profiles.csv
// listo para importar a Supabase (ver docs/data/country_profiles_README.md).

import fs from "fs";

const DATA_URL = "https://cdn.jsdelivr.net/npm/world-countries/dist/countries.json";

// Alineamos el CSV de salida con los países que ya existen en Supabase:
// tomamos la lista y el orden de iso3 directamente de countries_data.csv
// (el archivo que genera fetch-world-bank-data.mjs), en vez de usar todos
// los países que trae la fuente (que incluye más territorios).
const REFERENCE_CSV = "countries_data.csv";
const OUTPUT_CSV = "docs/data/country_profiles.csv";

// El World Bank usa, para un par de territorios, códigos "iso3" que no son
// códigos ISO 3166-1 alpha-3 reales, así que no existen tal cual en la
// fuente de datos. Acá los mapeamos al código real que sí trae la fuente.
const ISO3_ALIASES = {
  // Kosovo: el World Bank lo codifica como "XKX" (código de uso provisional
  // muy extendido); world-countries lo trae bajo "UNK".
  XKX: "UNK",
};

// Un puñado de países tiene más de una moneda de curso legal en la fuente
// (moneda propia + una moneda extranjera aceptada de facto, por acuerdo de
// cambio fijo, etc.). Para esos casos elegimos a mano cuál es "la" moneda
// oficial del país, en vez de quedarnos con la primera que venga en el
// JSON (que no viene ordenada por relevancia).
const CURRENCY_OVERRIDES = {
  BHS: "BSD", // dólar bahameño (el USD también circula, pero no es la moneda oficial)
  BRN: "BND", // dólar de Brunéi (intercambiable 1:1 con el SGD, pero no es su moneda)
  BTN: "BTN", // ngultrum (la INR también es de curso legal, pero no es la moneda propia)
  CUB: "CUP", // peso cubano — el CUC "convertible" dejó de existir en enero de 2021
  FRO: "DKK", // corona danesa (la "corona feroesa" es un billete local, no una moneda ISO 4217 distinta)
  IMN: "GBP", // libra esterlina (la "libra manesa" no tiene código ISO 4217 propio)
  KHM: "KHR", // riel camboyano (el USD se usa mucho en la práctica, pero el riel es la moneda oficial)
  KIR: "AUD", // dólar australiano (Kiribati no tiene banco central propio)
  LSO: "LSL", // loti (el ZAR también es de curso legal, por la unión monetaria del Rand)
  NAM: "NAD", // dólar namibio (ídem, unión monetaria del Rand)
  PAN: "PAB", // balboa panameño (el USD circula como billete, pero el balboa es la moneda oficial)
  PSE: "ILS", // nuevo shéquel israelí — el más usado en los territorios palestinos, que no emiten moneda propia
  SWZ: "SZL", // lilangeni (ídem, unión monetaria del Rand)
  TUV: "AUD", // dólar australiano (ídem Kiribati, sin banco central propio)
};

// Zimbabue lanzó una moneda nueva (el ZiG / Zimbabwe Gold) en abril de 2024
// para reemplazar el caótico sistema multi-moneda anterior. La fuente
// todavía no la incorporó, así que la fijamos a mano acá. Micronesia, por
// su parte, no trae ninguna moneda en la fuente (el campo viene vacío)
// aunque sí tiene una: usa el dólar estadounidense como moneda oficial.
const MANUAL_CURRENCY = {
  ZWE: { code: "ZWG", name: "Zimbabwe Gold", symbol: "ZiG" },
  FSM: { code: "USD", name: "United States dollar", symbol: "$" },
};

// Lista completa de monedas para la columna "currencies" (a diferencia de
// currency_name/code/symbol, que solo llevan la que elegimos como "la"
// oficial). Por default esto sale directo de country.currencies — pero en
// los dos casos de arriba la fuente no sirve como lista completa:
//   - Zimbabue: la fuente trae una canasta de 9 monedas ya vieja (de la
//     época 2009-2024 sin moneda propia) que ni siquiera incluye el ZiG.
//     En vez de arrastrar esa lista obsoleta, ponemos las dos monedas que
//     hoy son de curso legal de verdad: el ZiG y el dólar estadounidense
//     (que se sigue aceptando en un sistema bimonetario desde la reforma
//     de 2024).
//   - Micronesia: la fuente no trae ninguna, así que usamos la misma
//     moneda única que en MANUAL_CURRENCY.
const ALL_CURRENCIES_OVERRIDES = {
  ZWE: [
    { code: "ZWG", name: "Zimbabwe Gold", symbol: "ZiG" },
    { code: "USD", name: "United States dollar", symbol: "$" },
  ],
  FSM: [{ code: "USD", name: "United States dollar", symbol: "$" }],
};

// A veces el nombre de la moneda que trae la fuente es genérico (le falta
// el gentilicio del país, p. ej. "lari" en vez de "Georgian lari") porque
// el país en cuestión es el único que usa esa moneda y su registro nunca
// necesitó desambiguarla. Lo corregimos acá para que quede consistente con
// el resto del archivo (todas las demás monedas sí llevan el gentilicio).
const CURRENCY_NAME_FIXES = {
  GEO: "Georgian lari",
  GMB: "Gambian dalasi",
  GRL: "Danish krone",
  MKD: "Macedonian denar",
};

// Correcciones puntuales al campo "languages" de la fuente, para casos
// donde el dato es simplemente incorrecto (no una cuestión de matiz o
// interpretación):
//   - Austria: la fuente lo etiqueta como "bar" (alemán austro-bávaro, un
//     dialecto regional), cuando el idioma oficial de Austria es el
//     alemán estándar ("deu").
//   - Groenlandia: a la fuente le falta el danés, que es co-oficial junto
//     con el groenlandés.
//   - Moldova: la fuente usa el código ISO 639-3 "ron" (rumano) pero le
//     pone de nombre "Moldavian" — una denominación antigua. Desde el
//     fallo de 2023 de la Corte Constitucional de Moldova, el idioma
//     oficial se llama, oficialmente, "rumano".
const LANGUAGE_FIXES = {
  AUT: "German",
  GRL: "Greenlandic, Danish",
  MDA: "Romanian",
};

// Territorio que ni siquiera existe como entidad propia en la fuente (ni
// bajo su iso3 del World Bank ni bajo ningún alias): el World Bank agrupa
// Jersey y Guernsey bajo un único código "CHI" (Channel Islands), pero son
// dos jurisdicciones separadas, cada una con su propia moneda. Documentado
// a mano, con la misma fuente autoritativa (ISO 4217 / ISO 639) en la que
// se basa el resto del archivo.
const MANUAL_OVERRIDES = {
  CHI: {
    official_name: "Bailiwicks of Jersey and Guernsey",
    currency_name: "Pound sterling",
    currency_code: "GBP",
    currency_symbol: "£",
    currencies: "Pound sterling (GBP)",
    languages: "English, French",
  },
};

async function fetchJSON(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`  intento ${attempt} falló (${err.message}), reintentando...`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// 1. Traer la lista de iso3 (y su orden) ya presentes en countries_data.csv,
//    para que el CSV de salida tenga exactamente las mismas filas que ya
//    existen en la tabla `countries` de Supabase.
function readReferenceIso3List() {
  console.log(`Leyendo lista de países de ${REFERENCE_CSV}...`);
  const text = fs.readFileSync(REFERENCE_CSV, "utf8");
  const lines = text.trim().split("\n");
  const iso3List = lines.slice(1).map((line) => line.split(",")[0].trim());
  console.log(`  ${iso3List.length} países encontrados.`);
  return iso3List;
}

// 2. Descargar el dataset completo (todos los países/territorios) y
//    armar un mapa iso3 -> registro para buscar rápido.
async function fetchCountryDataset() {
  console.log(`Descargando dataset de países desde ${DATA_URL}...`);
  const rows = await fetchJSON(DATA_URL);
  const byIso3 = new Map();
  for (const row of rows) {
    byIso3.set(row.cca3, row);
  }
  console.log(`  ${byIso3.size} países/territorios recibidos.`);
  return byIso3;
}

// 3. Para un iso3 dado, elegir qué moneda de la fuente contar como "la"
//    moneda oficial (ver CURRENCY_OVERRIDES arriba), y devolver
//    {currency_name, currency_code, currency_symbol}.
function pickCurrency(iso3, country) {
  if (MANUAL_CURRENCY[iso3]) return MANUAL_CURRENCY[iso3];

  const currencies = country.currencies || {};
  const codes = Object.keys(currencies);
  if (codes.length === 0) return { code: "", name: "", symbol: "" };

  const chosenCode = CURRENCY_OVERRIDES[iso3] || codes[0];
  const chosen = currencies[chosenCode] || currencies[codes[0]];
  return {
    code: CURRENCY_OVERRIDES[iso3] ? chosenCode : codes[0],
    name: CURRENCY_NAME_FIXES[iso3] || chosen.name || "",
    symbol: chosen.symbol || "",
  };
}

// 4. Para un iso3 dado, armar la lista de *todas* las monedas de curso
//    legal (no solo la que elegimos como oficial en pickCurrency), como
//    texto "Nombre (CODIGO)" separado por comas — mismo formato que usan
//    currency_name/code por separado, pero uno por cada moneda.
function pickAllCurrencies(iso3, country) {
  if (ALL_CURRENCIES_OVERRIDES[iso3]) {
    return ALL_CURRENCIES_OVERRIDES[iso3].map((c) => `${c.name} (${c.code})`).join(", ");
  }

  const currencies = country.currencies || {};
  const codes = Object.keys(currencies);
  if (codes.length === 0) return "";

  return codes
    .map((code) => {
      // Si esta moneda es la que CURRENCY_NAME_FIXES corrige para este país,
      // usamos el nombre corregido también acá (son países con una sola
      // moneda, así que no hay ambigüedad sobre a cuál corregir).
      const name = CURRENCY_NAME_FIXES[iso3] || currencies[code].name || "";
      return `${name} (${code})`;
    })
    .join(", ");
}

function buildProfile(iso3, byIso3) {
  if (MANUAL_OVERRIDES[iso3]) {
    return { iso3, ...MANUAL_OVERRIDES[iso3] };
  }

  const lookupIso3 = ISO3_ALIASES[iso3] || iso3;
  const country = byIso3.get(lookupIso3);
  if (!country) {
    console.warn(`  ⚠ no se encontró "${iso3}" en la fuente de datos — fila vacía.`);
    return {
      iso3,
      official_name: "",
      currency_name: "",
      currency_code: "",
      currency_symbol: "",
      currencies: "",
      languages: "",
    };
  }

  const currency = pickCurrency(iso3, country);
  const currencies = pickAllCurrencies(iso3, country);
  const languages = LANGUAGE_FIXES[iso3] || Object.values(country.languages || {}).join(", ");

  return {
    iso3,
    official_name: country.name?.official || "",
    currency_name: currency.name,
    currency_code: currency.code,
    currency_symbol: currency.symbol,
    currencies,
    languages,
  };
}

function toCSV(rows) {
  const headers = [
    "iso3",
    "official_name",
    "currency_name",
    "currency_code",
    "currency_symbol",
    "currencies",
    "languages",
  ];

  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const iso3List = readReferenceIso3List();
  const byIso3 = await fetchCountryDataset();

  console.log("Armando perfil de cada país...");
  const rows = iso3List.map((iso3) => buildProfile(iso3, byIso3));

  const csv = toCSV(rows);
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(OUTPUT_CSV, csv);

  const missing = rows.filter((r) => !r.official_name);
  console.log(`\nListo. ${rows.length} países escritos en ${OUTPUT_CSV}`);
  if (missing.length > 0) {
    console.log(`  ⚠ ${missing.length} sin datos: ${missing.map((r) => r.iso3).join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Error general:", err);
  process.exit(1);
});
