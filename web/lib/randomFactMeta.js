// Extra metadata for a Random Facts entry — continent, capital, population,
// area, and a link to the full /country/[slug] page — derived from
// lib/countryTopoIds.json via the same country-name -> alpha-2 lookup
// lib/randomFactFlags.js uses for flags. Facts only store a country *name*
// (lib/randomFacts.js), so this is the bridge to the richer dataset rather
// than matching names directly — the two datasets don't always spell a
// country the same way (e.g. "Czech Republic" vs. "Czechia").
import { alpha2ForCountryName } from "./randomFactFlags";
import { isCountryIndexed, slugForIso3 } from "./countryIndex";
import { formatAreaCompact, formatPopulationCompact } from "./format";
import topoIds from "./countryTopoIds.json";

const topoByAlpha2 = new Map(topoIds.map((c) => [c.alpha2, c]));

export function factCountryMeta(countryName) {
  const alpha2 = alpha2ForCountryName(countryName);
  const topo = alpha2 ? topoByAlpha2.get(alpha2) : null;
  if (!topo) {
    return {
      region: null,
      capital: null,
      population: null,
      area: null,
      iso3: null,
      href: null,
      compareHref: null,
    };
  }
  const indexed = isCountryIndexed(topo.alpha3);
  return {
    region: topo.region || null,
    capital: topo.capital || null,
    population: topo.population ? formatPopulationCompact(topo.population) : null,
    area: topo.area ? formatAreaCompact(topo.area) : null,
    iso3: topo.alpha3,
    href: indexed ? `/country/${slugForIso3(topo.alpha3)}` : null,
    compareHref: indexed ? `/compare?countries=${topo.alpha3}` : null,
  };
}
