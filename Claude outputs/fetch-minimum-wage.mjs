// fetch-minimum-wage.mjs
//
// Descarga el salario mínimo mensual estatutario (nominal, en moneda
// local) para cada país y guarda el resultado en
// docs/data/minimum_wage.csv, listo para importar a Supabase.
//
// Fuente de datos: ILOSTAT (la base de datos de estadísticas laborales de
// la OIT / ILO, la agencia de Naciones Unidas especializada en trabajo),
// indicador "Statutory nominal gross monthly minimum wage (local
// currency)" — id EAR_INEE_NOC_NB_A — vía su API pública
// https://rplumber.ilo.org (la misma API que usa el paquete oficial de R
// "Rilostat" publicado por la propia OIT: https://github.com/ilostat/Rilostat).
// No hace falta API key.
//
// Por qué esta fuente y no otra:
//   - El salario mínimo NO es un dato que tenga el World Bank en su API
//     de indicadores (la que usa fetch-world-bank-data.mjs) — ahí solo
//     hay indicadores macroeconómicos (PBI, población, etc.), no
//     legislación laboral.
//   - La OIT es, literalmente, el organismo de Naciones Unidas a cargo de
//     estandarizar y recopilar estadísticas laborales de todo el mundo —
//     es la fuente "oficial" por excelencia para este dato específico,
//     de la misma manera que el World Bank lo es para indicadores
//     económicos.
//   - Su API es pública y gratuita, sin necesidad de registrarse ni de
//     API key (a diferencia de REST Countries — ver
//     fetch-country-profiles.mjs para esa historia).
//
// El valor que trae este indicador está en la MONEDA LOCAL de cada país
// (así lo define ILOSTAT), no en una moneda común — por eso el CSV de
// salida cruza cada fila con docs/data/country_profiles.csv (generado por
// fetch-country-profiles.mjs) para anotar en qué moneda está expresado
// cada valor, usando su columna currency_code.
//
// Importante — esto NO es una falla del script ni de la fuente: muchos
// países simplemente no tienen salario mínimo estatutario (fijado por
// ley) porque los salarios se negocian colectivamente (por ejemplo,
// Suecia, Dinamarca, Noruega, Finlandia, Austria, Suiza, Islandia). Para
// esos países la fila queda vacía a propósito — no hay ningún valor que
// buscar, es la realidad del país.
//
// Requisitos: Node.js 18 o superior (trae `fetch` incluido).
//
// Cómo correrlo (desde la raíz del repo, con country_profiles.csv ya
// generado):
//   node fetch-minimum-wage.mjs
//
// Al terminar vas a tener un archivo docs/data/minimum_wage.csv.

import fs from "fs";

const INDICATOR_ID = "EAR_INEE_NOC_NB_A";
const DATA_URL = `https://rplumber.ilo.org/data/indicator/?id=${INDICATOR_ID}&lang=en&type=code&format=.csv&channel=ilostat`;

const REFERENCE_CSV = "countries_data.csv";
const CURRENCY_CSV = "docs/data/country_profiles.csv";
const OUTPUT_CSV = "docs/data/minimum_wage.csv";

async function fetchText(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.warn(`  intento ${attempt} falló (${err.message}), reintentando...`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// Parser de CSV chico y sin dependencias — suficiente para lo que
// devuelve esta API (no hay saltos de línea dentro de un campo, pero sí
// puede haber comas dentro de campos entre comillas).
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    return row;
  });
}

function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

// 1. Traer la lista de iso3 ya presentes en countries_data.csv, para que
//    el CSV de salida tenga exactamente las mismas filas que ya existen
//    en la tabla `countries` de Supabase.
function readReferenceIso3List() {
  console.log(`Leyendo lista de países de ${REFERENCE_CSV}...`);
  const text = fs.readFileSync(REFERENCE_CSV, "utf8");
  const lines = text.trim().split("\n");
  const iso3List = lines.slice(1).map((line) => line.split(",")[0].trim());
  console.log(`  ${iso3List.length} países encontrados.`);
  return iso3List;
}

// 2. Traer el currency_code de cada país desde country_profiles.csv (lo
//    genera fetch-country-profiles.mjs), para poder anotar en qué moneda
//    está expresado cada salario mínimo.
function readCurrencyByIso3() {
  console.log(`Leyendo monedas de ${CURRENCY_CSV}...`);
  if (!fs.existsSync(CURRENCY_CSV)) {
    console.warn(`  ⚠ no existe ${CURRENCY_CSV} — corré fetch-country-profiles.mjs primero. Sigo sin monedas.`);
    return new Map();
  }
  const rows = parseCSV(fs.readFileSync(CURRENCY_CSV, "utf8"));
  return new Map(rows.map((r) => [r.iso3, r.currency_code]));
}

// 3. Descargar el indicador completo (todos los países, todos los años
//    disponibles) y quedarnos, por país, con el valor no-nulo más
//    reciente — mismo criterio que usa fetch-world-bank-data.mjs.
async function fetchMinimumWage() {
  console.log(`Descargando salario mínimo desde ILOSTAT (indicador ${INDICATOR_ID})...`);
  const text = await fetchText(DATA_URL);
  const rows = parseCSV(text);
  console.log(`  ${rows.length} filas recibidas (países x años).`);

  const latestByIso3 = {};
  for (const row of rows) {
    const iso3 = row.ref_area;
    const value = row.obs_value;
    const year = row.time;
    if (!iso3 || value === "" || value === undefined) continue;

    const existing = latestByIso3[iso3];
    if (!existing || Number(year) > Number(existing.year)) {
      latestByIso3[iso3] = { year, value };
    }
  }
  console.log(`  ${Object.keys(latestByIso3).length} países con dato disponible.`);
  return latestByIso3;
}

function toCSV(rows) {
  const headers = ["iso3", "minimum_wage_monthly_local", "currency_code", "year_reported"];

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
  const currencyByIso3 = readCurrencyByIso3();
  const latestByIso3 = await fetchMinimumWage();

  const rows = iso3List.map((iso3) => {
    const data = latestByIso3[iso3];
    return {
      iso3,
      minimum_wage_monthly_local: data?.value ?? "",
      currency_code: data ? currencyByIso3.get(iso3) ?? "" : "",
      year_reported: data?.year ?? "",
    };
  });

  const csv = toCSV(rows);
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(OUTPUT_CSV, csv);

  const withData = rows.filter((r) => r.minimum_wage_monthly_local !== "");
  console.log(`\nListo. ${rows.length} países escritos en ${OUTPUT_CSV}`);
  console.log(
    `  ${withData.length} con salario mínimo estatutario reportado, ${rows.length - withData.length} sin dato ` +
      `(países sin salario mínimo por ley, o que ILOSTAT no cubre para este indicador).`
  );
}

main().catch((err) => {
  console.error("Error general:", err);
  process.exit(1);
});
