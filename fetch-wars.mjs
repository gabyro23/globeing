// fetch-wars.mjs
//
// Descarga el UCDP/PRIO Armed Conflict Dataset (nivel conflicto-año, no
// dyadic ni de eventos) del Uppsala Conflict Data Program (Universidad de
// Uppsala, co-producido con PRIO Oslo) y arma docs/data/wars.csv: qué
// países estuvieron en guerra, con quién, y en qué años.
//
// Fuente: https://ucdp.uu.se/downloads/ -> "UCDP/PRIO Armed Conflict
// Dataset" (CSV). Es de acceso libre, licencia CC BY 4.0 (solo pide
// cita), cubre 1946-presente, se actualiza una vez por año.
//
// IMPORTANTE — recorte de alcance (a propósito, no ampliar):
//   - Solo intensity_level == 2 ("war": 1.000+ muertes en combate en ese
//     año-calendario). Se descartan los intensity_level == 1 (conflictos
//     "minor").
//   - Todo el rango del dataset (1946 en adelante), sin recorte adicional
//     de años.
//
// Cómo correrlo (desde la raíz del repo):
//   node fetch-wars.mjs
//
// Requiere Node 18+ (fetch incluido) y el comando `unzip` en el PATH
// (viene instalado por defecto en macOS y en la mayoría de Linux) — el
// dataset se publica como un .zip, y no quisimos sumar una dependencia de
// npm solo para descomprimir un archivo.
//
// Al terminar vas a tener:
//   - docs/data/wars.csv — el dataset final, un país por fila por guerra.
//   - docs/data/wars_unmapped_gw_codes.csv — un reporte de qué códigos de
//     país de Gleditsch-Ward aparecieron en guerras pero NO se pudieron
//     convertir a iso3 (ver GW_TO_ISO3 más abajo para el porqué de cada
//     caso) — a propósito no se descartan en silencio, se dejan
//     documentados acá para que los revises vos.

import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

const DATASET_VERSION = "26.1"; // ver https://ucdp.uu.se/downloads/ por una versión más nueva
const DATA_URL = `https://ucdp.uu.se/downloads/ucdpprio/ucdp-prio-acd-${DATASET_VERSION.replace(".", "")}-csv.zip`;

const OUTPUT_CSV = "docs/data/wars.csv";
const UNMAPPED_CSV = "docs/data/wars_unmapped_gw_codes.csv";

// ---------------------------------------------------------------------
// Crosswalk Gleditsch-Ward (código numérico de país) -> ISO 3166-1
// alpha-3.
//
// UCDP/PRIO usa los códigos de país de Gleditsch & Ward (el sistema
// estándar en ciencia política para identificar estados, distinto de
// ISO) en gwno_a / gwno_b / gwno_loc. No existe una tabla oficial
// GW -> ISO3 de un solo archivo, así que esta se armó cruzando la lista
// maestra de estados de Gleditsch (la misma fuente que usa el paquete de
// R `countrycode` para su propio diccionario "gw": el archivo
// http://ksgleditsch.com/data/iisystem.dat, publicado por Kristian
// Skrede Gleditsch) con los códigos ISO 3166-1 alpha-3 reales de cada
// país actual.
//
// Ojo con la trampa: la abreviatura de 3 letras que usa Gleditsch-Ward
// (columna "gwc" en su propia lista) NO siempre coincide con el ISO3 real
// del mismo país — por ejemplo, la abreviatura GW de Slovenia es "SLV",
// pero el ISO3 real de Slovenia es "SVN" ("SLV" es en realidad el ISO3
// de El Salvador). Por eso esta tabla se armó a mano, cruzando cada
// nombre de país con su ISO3 real, no copiando la abreviatura de GW.
const GW_TO_ISO3 = {
  2: "USA", 20: "CAN", 31: "BHS", 40: "CUB", 41: "HTI", 42: "DOM", 51: "JAM",
  52: "TTO", 53: "BRB", 70: "MEX", 80: "BLZ", 90: "GTM", 91: "HND", 92: "SLV",
  93: "NIC", 94: "CRI", 95: "PAN", 100: "COL", 101: "VEN", 110: "GUY",
  115: "SUR", 130: "ECU", 135: "PER", 140: "BRA", 145: "BOL", 150: "PRY",
  155: "CHL", 160: "ARG", 165: "URY", 200: "GBR", 205: "IRL", 210: "NLD",
  211: "BEL", 212: "LUX", 220: "FRA", 225: "CHE", 230: "ESP", 235: "PRT",
  260: "DEU", 290: "POL", 305: "AUT", 310: "HUN", 316: "CZE", 317: "SVK",
  325: "ITA", 338: "MLT", 339: "ALB", 340: "SRB", 341: "MNE", 343: "MKD",
  344: "HRV", 346: "BIH", 347: "XKX", 349: "SVN", 350: "GRC", 352: "CYP",
  355: "BGR", 359: "MDA", 360: "ROU", 365: "RUS", 366: "EST", 367: "LVA",
  368: "LTU", 369: "UKR", 370: "BLR", 371: "ARM", 372: "GEO", 373: "AZE",
  375: "FIN", 380: "SWE", 385: "NOR", 390: "DNK", 395: "ISL", 402: "CPV",
  404: "GNB", 411: "GNQ", 420: "GMB", 432: "MLI", 433: "SEN", 434: "BEN",
  435: "MRT", 436: "NER", 437: "CIV", 438: "GIN", 439: "BFA", 450: "LBR",
  451: "SLE", 452: "GHA", 461: "TGO", 471: "CMR", 475: "NGA", 481: "GAB",
  482: "CAF", 483: "TCD", 484: "COG", 490: "COD", 500: "UGA", 501: "KEN",
  510: "TZA", 516: "BDI", 517: "RWA", 520: "SOM", 522: "DJI", 530: "ETH",
  531: "ERI", 540: "AGO", 541: "MOZ", 551: "ZMB", 552: "ZWE", 553: "MWI",
  560: "ZAF", 565: "NAM", 570: "LSO", 571: "BWA", 572: "SWZ", 580: "MDG",
  581: "COM", 590: "MUS", 600: "MAR", 615: "DZA", 616: "TUN", 620: "LBY",
  625: "SDN", 626: "SSD", 630: "IRN", 640: "TUR", 645: "IRQ", 651: "EGY",
  652: "SYR", 660: "LBN", 663: "JOR", 666: "ISR", 670: "SAU", 678: "YEM",
  690: "KWT", 692: "BHR", 694: "QAT", 696: "ARE", 698: "OMN", 700: "AFG",
  701: "TKM", 702: "TJK", 703: "KGZ", 704: "UZB", 705: "KAZ", 710: "CHN",
  712: "MNG", 713: "TWN", 731: "PRK", 732: "KOR", 740: "JPN", 750: "IND",
  760: "BTN", 770: "PAK", 771: "BGD", 775: "MMR", 780: "LKA", 781: "MDV",
  790: "NPL", 800: "THA", 811: "KHM", 812: "LAO", 816: "VNM", 820: "MYS",
  830: "SGP", 835: "BRN", 840: "PHL", 850: "IDN", 860: "TLS", 900: "AUS",
  910: "PNG", 920: "NZL", 940: "SLB", 950: "FJI",
};

// Códigos de Gleditsch-Ward que SÍ conocemos, pero que a propósito no se
// mapean a un iso3 actual: son estados que ya no existen (se disolvieron,
// se dividieron, o se fusionaron con otro país). Si uno de estos aparece
// en una guerra, se reporta en wars_unmapped_gw_codes.csv con el motivo
// de esta lista, en vez de asignarle el país sucesor "adivinando" — por
// ejemplo, una guerra de la era soviética listada bajo la URSS no se
// reasigna en silencio a Rusia moderna.
const KNOWN_UNMAPPED_GW = {
  89: "United Provinces of Central America (se disolvió en 1839)",
  99: "Gran Colombia (se disolvió en 1830)",
  240: "Hannover (absorbido por Alemania en 1871)",
  245: "Baviera (absorbido por Alemania en 1871)",
  255: "Alemania 1816–1945 (el Reich alemán previo a la partición de posguerra; la Alemania moderna está en el código 260)",
  265: "República Democrática Alemana / Alemania del Este (se disolvió en 1990, absorbida por Alemania/260)",
  267: "Baden (absorbido por Alemania en 1871)",
  269: "Sajonia (absorbido por Alemania en 1871)",
  280: "Mecklenburg-Schwerin (absorbido por Alemania en 1871)",
  300: "Austria-Hungría (se disolvió en 1918)",
  315: "Checoslovaquia (se disolvió en 1992; sucesores: República Checa/316 y Eslovaquia/317)",
  327: "Estados Pontificios (se disolvieron en 1870)",
  329: "Dos Sicilias (se disolvió en 1861)",
  332: "Módena (se disolvió en 1861)",
  335: "Parma (se disolvió en 1861)",
  337: "Toscana (se disolvió en 1861)",
  345: "Yugoslavia 1918–2006 (se disolvió; los sucesores tienen su propio código — Serbia/340, Croacia/344, etc.)",
  511: "Zanzíbar (se fusionó con Tanganica para formar Tanzania en 1964)",
  563: "Transvaal (se disolvió en 1910, hoy parte de Sudáfrica)",
  564: "Estado Libre de Orange (se disolvió en 1910, hoy parte de Sudáfrica)",
  680: "Yemen del Sur / República Popular de Yemen (se disolvió en 1990, absorbido por Yemen/678)",
  711: "Tíbet (anexado por China en 1950–51)",
  730: "Corea 1816–1910 (Corea unificada previa a la partición; los estados modernos están en los códigos 731 y 732)",
  815: "Vietnam 1816–1893 (Vietnam unificado precolonial)",
  751: "Hyderabad (estado principesco anexado por India en 1948, nunca fue un estado soberano reconocido internacionalmente)",
  817: "República de Vietnam / Vietnam del Sur (se disolvió en 1975, absorbido por Vietnam/816)",
};

const TYPE_OF_CONFLICT_LABELS = {
  1: "extrastate",
  2: "interstate",
  3: "intrastate",
  4: "internationalized intrastate",
};

async function fetchBuffer(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      console.warn(`  intento ${attempt} falló (${err.message}), reintentando...`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
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

function writeCSV(filePath, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, lines.join("\n"));
}

// Busca recursivamente el primer .csv dentro de un directorio (el zip de
// UCDP a veces trae el CSV directo, a veces adentro de una subcarpeta).
function findCSVFile(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findCSVFile(full);
      if (found) return found;
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
      return full;
    }
  }
  return null;
}

// 1. Descargar el .zip del dataset y descomprimirlo en una carpeta
//    temporal.
async function downloadDataset() {
  console.log(`Descargando UCDP/PRIO Armed Conflict Dataset v${DATASET_VERSION}...`);
  console.log(`  ${DATA_URL}`);
  const zipBuffer = await fetchBuffer(DATA_URL);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ucdp-acd-"));
  const zipPath = path.join(tmpDir, "ucdp-prio-acd.zip");
  fs.writeFileSync(zipPath, zipBuffer);

  console.log("  Descomprimiendo...");
  try {
    execFileSync("unzip", ["-o", "-q", zipPath, "-d", tmpDir]);
  } catch (err) {
    throw new Error(
      `No se pudo descomprimir el .zip con el comando "unzip" (¿está instalado? viene por defecto en macOS/Linux). Detalle: ${err.message}`
    );
  }

  const csvPath = findCSVFile(tmpDir);
  if (!csvPath) throw new Error(`No se encontró ningún .csv adentro del .zip descargado (revisá ${tmpDir}).`);
  console.log(`  Usando ${path.basename(csvPath)}`);
  return fs.readFileSync(csvPath, "utf8");
}

// 2. Convertir un código numérico de Gleditsch-Ward a iso3, o reportarlo
//    como no-mapeable si corresponde a un estado que ya no existe (o que
//    no está en absoluto en nuestra tabla).
function gwToIso3(gwnRaw, context, unmappedLog) {
  const gwn = Number(String(gwnRaw).trim());
  if (!gwn) return null;

  const iso3 = GW_TO_ISO3[gwn];
  if (iso3) return iso3;

  const reason = KNOWN_UNMAPPED_GW[gwn] ?? "código de Gleditsch-Ward desconocido (no está en nuestra tabla GW_TO_ISO3 — revisar si falta agregarlo)";
  unmappedLog.push({ gwno: gwn, reason, ...context });
  return null;
}

// Separa un campo gwno_a / gwno_b (puede traer varios códigos separados
// por coma, p. ej. una guerra interestatal con una coalición del lado B)
// en una lista de números.
function splitGwnoField(value) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 3. Procesar el dataset conflicto-año: filtrar a intensity_level == 2,
//    agrupar por (iso3, conflict_id).
function buildWarRows(csvText) {
  const rows = parseCSV(csvText);
  console.log(`  ${rows.length} filas conflicto-año leídas.`);

  const datasetMaxYear = Math.max(...rows.map((r) => Number(r.year)).filter((y) => !Number.isNaN(y)));
  console.log(`  Último año cubierto por el dataset: ${datasetMaxYear}.`);

  const warYearRows = rows.filter((r) => Number(r.intensity_level) === 2);
  console.log(`  ${warYearRows.length} filas conflicto-año con intensity_level == 2 ("war").`);

  const unmappedLog = [];
  // groups: Map("iso3|conflict_id" -> { iso3, conflict_id, side_a, side_b,
  //   type_of_conflict, years: Set<number>, lastEpEnd, lastYear })
  const groups = new Map();

  function tagCountry(iso3, row) {
    if (!iso3) return;
    const key = `${iso3}|${row.conflict_id}`;
    const year = Number(row.year);
    const typeLabel = TYPE_OF_CONFLICT_LABELS[Number(row.type_of_conflict)] ?? row.type_of_conflict;

    let group = groups.get(key);
    if (!group) {
      group = {
        iso3,
        conflict_id: row.conflict_id,
        side_a: row.side_a,
        side_b: row.side_b,
        type_of_conflict: typeLabel,
        years: new Set(),
        lastYear: -Infinity,
        lastEpEnd: null,
      };
      groups.set(key, group);
    }
    group.years.add(year);
    // nos quedamos con side_a/side_b/type_of_conflict del año más
    // reciente del grupo, por si el nombre de alguna de las partes
    // cambió con el tiempo (poco común, pero pasa).
    if (year >= group.lastYear) {
      group.lastYear = year;
      group.side_a = row.side_a;
      group.side_b = row.side_b;
      group.type_of_conflict = typeLabel;
      group.lastEpEnd = row.ep_end;
    }
  }

  for (const row of warYearRows) {
    const isInterstate = Number(row.type_of_conflict) === 2;

    for (const gwnoRaw of splitGwnoField(row.gwno_a)) {
      const iso3 = gwToIso3(gwnoRaw, { side: "a", conflict_id: row.conflict_id, side_a: row.side_a, side_b: row.side_b, year: row.year }, unmappedLog);
      tagCountry(iso3, row);
    }

    // Para guerras interestatales (type_of_conflict == 2), también
    // etiquetamos al/los país(es) del lado B — así una guerra entre dos
    // países aparece en la página de ambos.
    if (isInterstate) {
      for (const gwnoRaw of splitGwnoField(row.gwno_b)) {
        const iso3 = gwToIso3(gwnoRaw, { side: "b", conflict_id: row.conflict_id, side_a: row.side_a, side_b: row.side_b, year: row.year }, unmappedLog);
        tagCountry(iso3, row);
      }
    }
  }

  const warRows = [];
  for (const group of groups.values()) {
    const years = [...group.years].sort((a, b) => a - b);
    const startYear = years[0];
    const maxYear = years[years.length - 1];

    // "Sigue en curso" según el propio dataset: el último año en que este
    // conflicto llegó a nivel de guerra ES el último año cubierto por
    // todo el dataset, y ese año todavía no está marcado como
    // terminado (ep_end == 0 — que, según el codebook de UCDP, es
    // siempre el valor del último año del dataset, porque no se sabe
    // todavía si el conflicto va a seguir el año que viene). Si el
    // conflicto dejó de llegar a nivel de guerra antes del último año
    // del dataset, NO se considera en curso, aunque su ep_end también
    // haya sido 0 ese año (simplemente significa que el episodio siguió,
    // pero por debajo del umbral de "war").
    const isOngoing = maxYear === datasetMaxYear && String(group.lastEpEnd) === "0";
    const endYear = isOngoing ? "" : maxYear;

    warRows.push({
      iso3: group.iso3,
      conflict_name: `${group.side_a} – ${group.side_b}`,
      side_a: group.side_a,
      side_b: group.side_b,
      type_of_conflict: group.type_of_conflict,
      start_year: startYear,
      end_year: endYear,
      ucdp_conflict_id: group.conflict_id,
    });
  }

  // orden estable: por país, después por año de inicio.
  warRows.sort((a, b) => (a.iso3 < b.iso3 ? -1 : a.iso3 > b.iso3 ? 1 : a.start_year - b.start_year));

  return { warRows, unmappedLog };
}

async function main() {
  const csvText = await downloadDataset();
  const { warRows, unmappedLog } = buildWarRows(csvText);

  writeCSV(OUTPUT_CSV, ["iso3", "conflict_name", "side_a", "side_b", "type_of_conflict", "start_year", "end_year", "ucdp_conflict_id"], warRows);

  const uniqueUnmapped = new Map();
  for (const u of unmappedLog) {
    const key = `${u.gwno}|${u.conflict_id}|${u.side}`;
    if (!uniqueUnmapped.has(key)) uniqueUnmapped.set(key, u);
  }
  writeCSV(UNMAPPED_CSV, ["gwno", "side", "conflict_id", "side_a", "side_b", "year", "reason"], [...uniqueUnmapped.values()]);

  const uniqueCountries = new Set(warRows.map((r) => r.iso3));
  const uniqueConflicts = new Set(warRows.map((r) => r.ucdp_conflict_id));
  const ongoing = warRows.filter((r) => r.end_year === "").length;

  console.log(`\nListo. ${warRows.length} filas país-guerra escritas en ${OUTPUT_CSV}`);
  console.log(`  ${uniqueCountries.size} países, ${uniqueConflicts.size} conflictos distintos, ${ongoing} marcados como en curso.`);
  console.log(`  ${uniqueUnmapped.size} código(s) de país de Gleditsch-Ward no se pudieron mapear a iso3 — ver ${UNMAPPED_CSV}.`);
}

main().catch((err) => {
  console.error("Error general:", err);
  process.exit(1);
});
