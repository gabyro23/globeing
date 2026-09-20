// One-off script: looks up the correct "domain" identifiers NewsData.io
// expects for our whitelisted outlets (see web/lib/newsCountries.js).
// The `domain` filter on /api/1/latest rejected plain hostnames like
// "elpais.com" ("The domain you provided does not exist in our
// database") — it needs whatever identifier NewsData.io's own source
// directory (/api/1/sources) uses instead. This prints the full source
// object for anything matching our target outlets' names, so we can see
// every field and pick the right one.
//
// Run from the repo root: node check-news-sources.mjs
import { readFileSync } from "fs";

const envText = readFileSync(new URL("./web/.env.local", import.meta.url), "utf8");
const apiKey = envText.match(/^NEWSDATA_API_KEY=(.+)$/m)?.[1]?.trim();

if (!apiKey) {
  console.error("Couldn't find NEWSDATA_API_KEY in web/.env.local");
  process.exit(1);
}

const targets = {
  es: ["efe", "rtve", "pais", "mundo"],
  pa: ["prensa", "tvn", "telemetro", "estrella"],
  mx: ["efe", "universal", "reforma", "milenio"],
  ar: ["clarin", "clarín", "nacion", "nación", "infobae"],
  uy: ["aun", "uypress", "pais", "observador"],
  us: ["associated press", " ap ", "reuters", "npr"],
  gb: ["bbc", "reuters", "guardian"],
  fr: ["afp", "france 24", "france24", "monde"],
  de: ["deutsche welle", "tagesschau", "spiegel", " dw "],
  br: ["agencia brasil", "agência brasil", "globo", "folha"],
};

for (const [country, keywords] of Object.entries(targets)) {
  const res = await fetch(`https://newsdata.io/api/1/sources?apikey=${apiKey}&country=${country}`);
  const data = await res.json();
  console.log(`\n== ${country.toUpperCase()} ==`);

  if (data.status !== "success") {
    console.log("  ERROR:", JSON.stringify(data));
    continue;
  }

  const results = data.results || [];
  const nameHas = (s, k) => (s.name || "").toLowerCase().includes(k.toLowerCase());
  const matches = results.filter((s) => keywords.some((k) => nameHas(s, k)));

  if (matches.length === 0) {
    console.log(`  (no keyword match among ${results.length} sources — showing first 8)`);
    results.slice(0, 8).forEach((s) => console.log(" ", JSON.stringify(s)));
  } else {
    matches.forEach((s) => console.log(" ", JSON.stringify(s)));
  }

  // Be polite with the free-tier rate limit.
  await new Promise((r) => setTimeout(r, 400));
}
