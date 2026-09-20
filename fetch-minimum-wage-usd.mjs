// fetch-minimum-wage-usd.mjs
//
// Convierte el salario mínimo mensual local (docs/data/minimum_wage.csv,
// generado por fetch-minimum-wage.mjs) a dólares estadounidenses, usando
// el tipo de cambio oficial del Banco Mundial, y guarda el resultado en
// docs/data/minimum_wage_usd.csv, listo para importar a Supabase.
//
// Fuente del tipo de cambio: World Bank API, indicador PA.NUS.FCRF
// ("Official exchange rate (LCU per US$, period average)") — el mismo
// indicador oficial que ya usa fetch-world-bank-data.mjs para los demás
// datos económicos de este proyecto, así que es la fuente más consistente
// con el resto de la base (misma institución, mismo tipo de cifra oficial).
//
// Método de conversión:
//   minimum_wage_monthly_usd = minimum_wage_monthly_local / exchange_rate
//
// Para cada país usamos el tipo de cambio del MISMO año que
// minimum_wage.csv reporta el salario (year_reported), para no mezclar un
// salario de un año con un tipo de cambio de otro. Si el Banco Mundial no
// tiene ese año exacto para ese país (pasa seguido con el año en curso,
// que todavía no tiene el promedio anual cerrado), probamos con los años
// más cercanos, en este orden: mismo año, un año antes, un año después,
// dos años antes, dos años después — y nos quedamos con el primero que
// exista. Si ninguno de esos 5 años tiene dato, dejamos la fila vacía en
// vez de inventar un número.
//
// Importante — esto es una conversión NOMINAL simple (tipo de cambio de
// mercado), no un ajuste por poder adquisitivo (PPA/PPP). Sirve para
// comparar "a simple vista" cuánto es un salario mínimo en dólares, pero
// NO es una comparación de costo de vida real entre países (para eso
// hace falta un dato de paridad de poder adquisitivo, que es otro
// indicador distinto). Lo mismo aplica si `exchange_rate_year` termina
// siendo distinto al `year_reported` de minimum_wage.csv para una fila:
// eso significa que se usó un año de tipo de cambio distinto al del
// salario (fallback), y vale la pena tenerlo en cuenta al leer esa fila.
//
// Requisitos: Node.js 18 o superior (trae `fetch` incluido).
//
// Cómo correrlo (desde la raíz del repo, con minimum_wage.csv ya
// generado):
//   node fetch-minimum-wage-usd.mjs
//
// Al terminar vas a tener un archivo docs/data/minimum_wage_usd.csv.

import fs from "fs";

const INDICATOR_CODE = "PA.NUS.FCRF";
const BASE_URL = "https://api.worldbank.org/v2";

// Rango de años a pedirle a la API. minimum_wage.csv tiene year_reported
// entre 2011 y 2026 aproximadamente; pedimos un poco más ancho que eso
// para que el fallback de +/-2 años siempre tenga margen en los bordes.
const YEAR_RANGE = "2008:2026";

// Orden de preferencia para el fallback de año, si el tipo de cambio del
// mismo año no está disponible: mismo año, -1, +1, -2, +2.
const YEAR_OFFSETS = [0, -1, 1, -2, 2];

const INPUT_CSV = "docs/data/minimum_wage.csv";
const OUTPUT_CSV = "docs/data/minimum_wage_usd.csv";

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

// Parser de CSV chico y sin dependencias — igual al que usan
// fetch-country-profiles.mjs y fetch-minimum-wage.mjs.
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

// 1. Leer minimum_wage.csv: iso3, minimum_wage_monthly_local,
//    currency_code, year_reported.
function readMinimumWageRows() {
  console.log(`Leyendo ${INPUT_CSV}...`);
  if (!fs.existsSync(INPUT_CSV)) {
    throw new Error(`No existe ${INPUT_CSV} — corré fetch-minimum-wage.mjs primero.`);
  }
  const rows = parseCSV(fs.readFileSync(INPUT_CSV, "utf8"));
  console.log(`  ${rows.length} países leídos.`);
  return rows;
}

// 2. Traer el tipo de cambio oficial (PA.NUS.FCRF) de TODOS los países
//    para todo el rango de años en un solo pedido — mismo enfoque que
//    fetch-world-bank-data.mjs — y armar un mapa iso3 -> { year -> rate }.
async function fetchExchangeRates() {
  console.log(`Descargando tipo de cambio oficial (${INDICATOR_CODE}) del Banco Mundial...`);
  const url = `${BASE_URL}/country/all/indicator/${INDICATOR_CODE}?format=json&date=${YEAR_RANGE}&per_page=20000`;
  const json = await fetchJSON(url);
  const rows = json[1] || [];

  const rateByIso3Year = {};
  for (const row of rows) {
    if (!row.countryiso3code || row.value === null) continue;
    const iso3 = row.countryiso3code;
    if (!rateByIso3Year[iso3]) rateByIso3Year[iso3] = {};
    rateByIso3Year[iso3][row.date] = row.value;
  }
  console.log(`  ${Object.keys(rateByIso3Year).length} países con al menos un año de tipo de cambio.`);
  return rateByIso3Year;
}

// 3. Para un país y un año objetivo, buscar el tipo de cambio del mismo
//    año, y si no está, probar los años vecinos en el orden de
//    YEAR_OFFSETS.
function findRate(rateByYear, targetYear) {
  if (!rateByYear || !targetYear) return null;
  for (const offset of YEAR_OFFSETS) {
    const year = String(targetYear + offset);
    if (rateByYear[year] !== undefined) {
      return { rate: rateByYear[year], year };
    }
  }
  return null;
}

function toCSV(rows) {
  const headers = ["iso3", "minimum_wage_monthly_usd", "exchange_rate_used", "exchange_rate_year"];

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
  const wageRows = readMinimumWageRows();
  const rateByIso3Year = await fetchExchangeRates();

  let converted = 0;
  let noLocalWage = 0;
  let noRateFound = 0;
  let usedFallbackYear = 0;

  const outRows = wageRows.map((row) => {
    const iso3 = row.iso3;
    const local = row.minimum_wage_monthly_local;
    const targetYear = Number(row.year_reported);

    // Sin salario local reportado -> no hay nada que convertir, fila
    // vacía a propósito (no es un dato faltante, es que el país no tiene
    // salario mínimo estatutario, ver minimum_wage_README.md).
    if (!local || local === "") {
      noLocalWage++;
      return { iso3, minimum_wage_monthly_usd: "", exchange_rate_used: "", exchange_rate_year: "" };
    }

    const found = findRate(rateByIso3Year[iso3], targetYear);
    if (!found) {
      noRateFound++;
      return { iso3, minimum_wage_monthly_usd: "", exchange_rate_used: "", exchange_rate_year: "" };
    }

    if (Number(found.year) !== targetYear) usedFallbackYear++;
    converted++;

    const usd = Number(local) / Number(found.rate);
    return {
      iso3,
      minimum_wage_monthly_usd: Math.round(usd * 100) / 100,
      exchange_rate_used: found.rate,
      exchange_rate_year: found.year,
    };
  });

  const csv = toCSV(outRows);
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(OUTPUT_CSV, csv);

  console.log(`\nListo. ${outRows.length} países escritos en ${OUTPUT_CSV}`);
  console.log(`  ${converted} convertidos a USD (${usedFallbackYear} de ellos con un año de tipo de cambio distinto al del salario reportado).`);
  console.log(`  ${noLocalWage} sin salario local (no tienen salario mínimo estatutario — fila vacía a propósito).`);
  console.log(`  ${noRateFound} con salario local pero SIN tipo de cambio disponible en el Banco Mundial (fila vacía).`);
}

main().catch((err) => {
  console.error("Error general:", err);
  process.exit(1);
});
