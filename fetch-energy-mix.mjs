// fetch-energy-mix.mjs
//
// Descarga la matriz de generación eléctrica por fuente (carbón,
// petróleo, gas natural, nuclear, hidráulica, eólica, solar, biomasa y
// otras renovables) para cada país y guarda una "foto" del año más
// reciente disponible en docs/data/energy_mix.csv, lista para importar a
// Supabase.
//
// Fuente de datos: el dataset de energía de Our World in Data
// (https://github.com/owid/energy-data), que combina:
//   - Ember — Yearly Electricity Data (https://ember-energy.org/data/yearly-electricity-data/),
//     la fuente de referencia específicamente para generación eléctrica
//     por fuente, país por país. CC BY 4.0.
//   - Energy Institute — Statistical Review of World Energy
//     (https://www.energyinst.org/statistical-review), la continuación
//     del histórico "BP Statistical Review of World Energy" — el
//     estándar de la industria energética desde 1952 — usada sobre todo
//     para completar años más viejos.
// OWID limpia y junta ambas en un solo CSV con columnas iso_code (ISO3),
// listo para cruzar con nuestra tabla `countries`.
//
// Por qué esta fuente: la IEA (el organismo intergubernamental "más
// oficial" para estadísticas energéticas) no publica su desagregación
// por combustible y país de forma gratuita/sin licencia — el detalle
// está en reportes pagos. Ember es el estándar de facto gratuito y
// específico para generación eléctrica (lo citan la propia IEA,
// Bloomberg, Reuters, etc. como fuente), y el Energy Institute es el
// sucesor directo del BP Statistical Review, la referencia clásica de
// la industria.
//
// Alcance de este script (a propósito, "foto" y no serie histórica):
// para cada país se toma el AÑO MÁS RECIENTE que tenga un total de
// generación eléctrica reportado, y de ESE MISMO año se sacan todos los
// porcentajes por fuente (para no mezclar, por ejemplo, el % de carbón
// de 2022 con el % de nuclear de 2024 del mismo país).
//
// Cómo correrlo (desde la raíz del repo):
//   node fetch-energy-mix.mjs
//
// Requiere Node 18+ (fetch incluido), sin dependencias.
//
// Nota sobre la fuente: OWID mantiene este archivo específico
// (owid/energy-data en GitHub) como su release "legacy" — están
// migrando este dataset a un nuevo home (catalog.ourworldindata.org) y
// avisan que este archivo ya no recibe actualizaciones de FORMATO, pero
// al momento de escribir este script seguía reflejando datos de Ember
// y del Energy Institute de 2026 (ver el año más reciente que reporta
// la consola al correrlo). Si en el futuro este archivo deja de
// actualizarse del todo, DATA_URL es lo primero que hay que revisar.

import fs from "fs";

const DATA_URL = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv";

const REFERENCE_CSV = "countries_data.csv";
const OUTPUT_CSV = "docs/data/energy_mix.csv";

// OWID no trae iso_code para Kosovo (lo identifica solo por nombre) —
// mismo código XKX que ya usa el resto de este proyecto para Kosovo
// (ver country_profiles_README.md).
const NAME_TO_ISO3_OVERRIDE = {
  Kosovo: "XKX",
};

// Columnas de "% de la generación eléctrica" que nos interesan del CSV
// de OWID, y el nombre de columna que les damos en energy_mix.csv.
// "other_renewable" usa la variante "_exc_biofuel" para no duplicar con
// la columna de biofuel (biomasa) que ya se cuenta aparte.
const SOURCE_COLUMNS = {
  energy_coal_pct: "coal_share_elec",
  energy_oil_pct: "oil_share_elec",
  energy_gas_pct: "gas_share_elec",
  energy_nuclear_pct: "nuclear_share_elec",
  energy_hydro_pct: "hydro_share_elec",
  energy_wind_pct: "wind_share_elec",
  energy_solar_pct: "solar_share_elec",
  energy_biofuel_pct: "biofuel_share_elec",
  energy_other_renewable_pct: "other_renewables_share_elec_exc_biofuel",
  energy_fossil_total_pct: "fossil_share_elec",
  energy_renewables_total_pct: "renewables_share_elec",
  energy_low_carbon_pct: "low_carbon_share_elec",
};

const OUTPUT_COLUMNS = ["iso3", ...Object.keys(SOURCE_COLUMNS), "energy_mix_year"];

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

// Parser de CSV chico y sin dependencias — igual al que usan los otros
// fetch-*.mjs de este repo.
function parseCSV(text) {
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/);
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

function escapeCSV(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
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

// 2. Descargar el dataset completo de OWID y, para cada iso3 de interés,
//    quedarnos con TODAS las filas (todos los años) de ese país.
async function fetchOwidRowsByIso3() {
  console.log("Descargando el dataset de energía de Our World in Data...");
  const text = await fetchText(DATA_URL);
  const rows = parseCSV(text);
  console.log(`  ${rows.length} filas país-año leídas (incluye agregados como "World", regiones, etc.).`);

  const rowsByIso3 = {};
  for (const row of rows) {
    let iso3 = row.iso_code || NAME_TO_ISO3_OVERRIDE[row.country] || "";
    if (!iso3) continue; // agregados (World, continentes, grupos de ingreso, etc.) no traen iso_code
    if (!rowsByIso3[iso3]) rowsByIso3[iso3] = [];
    rowsByIso3[iso3].push(row);
  }
  return rowsByIso3;
}

// 3. Para un país, elegir el año más reciente que tenga un total de
//    generación eléctrica reportado, y sacar todos los porcentajes de
//    ESE mismo año (para no mezclar años distintos por fuente).
function pickLatestMixRow(rows) {
  const withTotal = (rows ?? []).filter((r) => r.electricity_generation !== "");
  if (withTotal.length === 0) return null;
  return withTotal.reduce((latest, r) => (Number(r.year) > Number(latest.year) ? r : latest));
}

function toCSV(rows) {
  const lines = [OUTPUT_COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(OUTPUT_COLUMNS.map((h) => escapeCSV(row[h])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const iso3List = readReferenceIso3List();
  const rowsByIso3 = await fetchOwidRowsByIso3();

  let withData = 0;
  let noCoverage = 0;
  const noCoverageList = [];

  const outRows = iso3List.map((iso3) => {
    const mixRow = pickLatestMixRow(rowsByIso3[iso3]);
    if (!mixRow) {
      noCoverage++;
      noCoverageList.push(iso3);
      return { iso3, energy_mix_year: "" };
    }
    withData++;
    const out = { iso3, energy_mix_year: mixRow.year };
    for (const [outCol, srcCol] of Object.entries(SOURCE_COLUMNS)) {
      out[outCol] = mixRow[srcCol] ?? "";
    }
    return out;
  });

  const csv = toCSV(outRows);
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(OUTPUT_CSV, csv);

  console.log(`\nListo. ${outRows.length} países escritos en ${OUTPUT_CSV}`);
  console.log(`  ${withData} con datos de matriz eléctrica, ${noCoverage} sin ninguna cobertura en la fuente.`);
  if (noCoverageList.length) {
    console.log(`  Sin cobertura: ${noCoverageList.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Error general:", err);
  process.exit(1);
});
