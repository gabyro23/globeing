import Link from "next/link";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Data Sources",
  description:
    "Where Globeing's numbers, country facts, and shapes come from — World Bank Open Data, official country facts, world-atlas map data, and individually cited daily facts.",
  path: "/data-sources",
});

// Every category of data used across the site, and exactly where it comes
// from — linked from the footer so it's never more than one click away
// from any page. Keep this in sync with lib/countryPageData.js and
// lib/worldAtlas.js/randomFacts.js whenever a new data source is added.
const SOURCES = [
  {
    title: "Population, GDP & economic indicators",
    where: "Used on every country page's quick facts, rankings, and the Compare and Rankings tools.",
    body: (
      <>
        <p>
          Population, area, population density, urban population, GDP, GDP per capita, GDP growth,
          inflation, unemployment, life expectancy, and internet usage all come from the{" "}
          <a href="https://data.worldbank.org/" target="_blank" rel="noreferrer">
            World Bank Open Data
          </a>{" "}
          API. For each country and indicator, we keep the most recent non-null value reported between
          2018 and 2024 — not every country reports every indicator every year, so a figure might be a
          year or two older for some countries than others.
        </p>
        <p>
          Not every country reports every indicator — small island nations, micro-states, and a few
          others are missing figures like inflation or unemployment because the World Bank itself
          doesn&apos;t have them on file.
        </p>
      </>
    ),
  },
  {
    title: "Official name, currency & language",
    where: "Used on indexed country pages' quick facts, currency, and FAQ sections.",
    body: (
      <>
        <p>
          Each country&apos;s official/constitutional name, currency (name, ISO 4217 code, and symbol),
          and official language(s) come from{" "}
          <a href="https://github.com/mledoze/countries" target="_blank" rel="noreferrer">
            world-countries
          </a>
          , an open, freely-licensed dataset that compiles ISO 4217 currency codes, ISO 639 language
          codes, the CIA World Factbook, and Wikipedia into one place. We fetch it live and refresh our
          copy from it directly, rather than keeping our own hand-typed list.
        </p>
        <p>
          A few of these are inherently unsettled — official names can be politically contested, and
          currencies occasionally change faster than any dataset can track (Zimbabwe&apos;s 2024
          currency reform, for one — we patch in a small number of known gaps like this by hand until
          the upstream dataset catches up). We do our best to keep these current and welcome a
          correction if you spot one out of date.
        </p>
      </>
    ),
  },
  {
    title: "Country shapes & outlines",
    where: "Used for the world map, the silhouette pictograms, Guess the Country, and Fill the Country.",
    body: (
      <p>
        Country borders and outlines come from{" "}
        <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noreferrer">
          world-atlas
        </a>{" "}
        (110m resolution), a TopoJSON build of{" "}
        <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
          Natural Earth
        </a>
        &apos;s public domain map data. At this resolution, shapes are simplified for smooth rendering
        rather than surveyed precision — good for a recognizable silhouette, not for cartographic or
        legal boundary claims.
      </p>
    ),
  },
  {
    title: "Random & daily facts",
    where: "Used on the homepage and the Random Facts page.",
    body: (
      <p>
        Each of our 365 daily facts is individually researched and cited — every fact card links to its
        own source (mostly Wikipedia) so you can read further or double-check it yourself.
      </p>
    ),
  },
];

export default function DataSourcesPage() {
  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Data sources</h1>
        <p className="app-hero__subtitle">
          Where every number, fact, and shape on Globeing comes from — and how fresh it is.
        </p>
      </div>

      <div className="data-sources">
        {SOURCES.map((s) => (
          <section className="data-sources__item" key={s.title}>
            <h2 className="data-sources__title">{s.title}</h2>
            <p className="data-sources__where">{s.where}</p>
            <div className="data-sources__body">{s.body}</div>
          </section>
        ))}

        <p className="data-sources__footnote">
          Spotted something that looks wrong or out of date?{" "}
          <Link href="/contact">Let us know</Link> — we&apos;d rather fix it than leave it.
        </p>
      </div>
    </>
  );
}
