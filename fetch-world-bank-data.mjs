// fetch-world-bank-data.mjs
//
// Descarga datos de ~190 países desde la API pública del World Bank
// y los guarda en un archivo countries_data.csv, listo para revisar
// e importar a Supabase.
//
// Requisitos: Node.js 18 o superior (trae `fetch` incluido, no hace
// falta instalar ninguna librería).
//
// Cómo correrlo:
//   node fetch-world-bank-data.mjs
//
// Al terminar vas a tener un archivo countries_data.csv en esta misma carpeta.

import fs from "fs";

// Rango de años en el que buscamos datos. Pedimos varios años porque
// no todos los países publican el dato más reciente al mismo tiempo;
// nos quedamos con el valor no-nulo más reciente de cada país.
const YEAR_RANGE = "2018:2024";

// Indicadores a descargar: código oficial del World Bank -> nombre de columna en el CSV
const INDICATORS = {
  "SP.POP.TOTL": "population",
  "EN.POP.DNST": "population_density",
  "AG.SRF.TOTL.K2": "area_km2",
  "SP.URB.TOTL.IN.ZS": "urban_pct",
  "NY.GDP.MKTP.CD": "gdp_usd",
  "NY.GDP.PCAP.CD": "gdp_per_capita_usd",
  "NY.GDP.MKTP.KD.ZG": "gdp_growth_pct",
  "FP.CPI.TOTL.ZG": "inflation_pct",
  "SL.UEM.TOTL.ZS": "unemployment_pct",
  "SP.DYN.LE00.IN": "life_expectancy_years",
  "IT.NET.USER.ZS": "internet_users_pct",
};

const BASE_URL = "https://api.worldbank.org/v2";

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

// 1. Traer la lista real de países (excluyendo agregados como
//    "World", "European Union", "High income", etc.)
async function fetchCountryList() {
  console.log("Descargando lista de países...");
  const url = `${BASE_URL}/country?format=json&per_page=400`;
  const [, rows] = await fetchJSON(url);

  const countries = {};
  for (const row of rows) {
    // Los agregados (regiones, grupos de ingreso) tienen region.id === "NA"
    if (row.region.id === "NA") continue;

    countries[row.id] = {
      iso3: row.id,
      name: row.name,
      capital: row.capitalCity || "",
      region: row.region.value || "",
      income_level: row.incomeLevel.value || "",
      latitude: row.latitude || "",
      longitude: row.longitude || "",
    };
  }
  console.log(`  ${Object.keys(countries).length} países encontrados.`);
  return countries;
}

// 2. Para un indicador dado, traer todos los países y quedarnos con
//    el valor no-nulo más reciente de cada uno.
async function fetchIndicator(code, field) {
  console.log(`Descargando indicador ${code} (${field})...`);
  const url = `${BASE_URL}/country/all/indicator/${code}?format=json&date=${YEAR_RANGE}&per_page=20000`;
  const json = await fetchJSON(url);
  const rows = json[1] || [];

  // Los datos vienen en desorden de años; nos quedamos con el más
  // reciente que tenga un valor real (no null) por país.
  const latestByCountry = {};
  for (const row of rows) {
    if (!row.countryiso3code || row.value === null) continue;
    const iso3 = row.countryiso3code;
    const existing = latestByCountry[iso3];
    if (!existing || Number(row.date) > Number(existing.date)) {
      latestByCountry[iso3] = { date: row.date, value: row.value };
    }
  }

  console.log(`  ${Object.keys(latestByCountry).length} países con dato disponible.`);
  return latestByCountry;
}

function toCSV(countries) {
  const metaFields = ["iso3", "name", "capital", "region", "income_level", "latitude", "longitude"];
  const indicatorFields = Object.values(INDICATORS);
  const headers = [...metaFields, ...indicatorFields];

  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const c of Object.values(countries)) {
    lines.push(headers.map((h) => escape(c[h])).join(","));
  }
  return lines.join("\n");
}

async function main() {
  const countries = await fetchCountryList();

  for (const [code, field] of Object.entries(INDICATORS)) {
    const values = await fetchIndicator(code, field);
    for (const iso3 of Object.keys(countries)) {
      countries[iso3][field] = values[iso3]?.value ?? "";
    }
    // pequeña pausa entre pedidos para no saturar la API
    await new Promise((r) => setTimeout(r, 300));
  }

  const csv = toCSV(countries);
  fs.writeFileSync("countries_data.csv", csv);

  const total = Object.keys(countries).length;
  console.log(`\nListo. ${total} países escritos en countries_data.csv`);
}

main().catch((err) => {
  console.error("Error general:", err);
  process.exit(1);
});
