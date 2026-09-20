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
    title: "Minimum wage",
    where: "Used on each country page's quick facts and FAQ.",
    body: (
      <>
        <p>
          Statutory minimum wage figures (in each country&apos;s own currency) come from{" "}
          <a href="https://ilostat.ilo.org/" target="_blank" rel="noreferrer">
            ILOSTAT
          </a>
          , the International Labour Organization&apos;s statistics database. Coverage years vary by
          country, so we always show the year a figure was last reported alongside it. A blank figure
          usually means the country has no statutory minimum wage — pay is set some other way, like
          collective bargaining (this is the case for Sweden, Denmark, Norway, Finland, Iceland,
          Switzerland, and Austria, among others) — not that the data is missing, though for a handful
          of small territories ILOSTAT genuinely has no figure on file either way.
        </p>
        <p>
          The USD figure shown alongside it is a plain currency conversion — the local-currency amount
          converted using the{" "}
          <a href="https://data.worldbank.org/indicator/PA.NUS.FCRF" target="_blank" rel="noreferrer">
            World Bank&apos;s official market exchange rate
          </a>{" "}
          for that same reporting year. It is not adjusted for purchasing power or cost of living, so
          it&apos;s meant for a quick, literal dollar comparison only — not a claim that two countries&apos;
          minimum wages buy the same amount of goods.
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
    title: "War history",
    where: "Used on each indexed country page's war history section.",
    body: (
      <>
        <p>
          Which countries have been at war, against/with whom, and in what years comes from the{" "}
          <a href="https://ucdp.uu.se/downloads/" target="_blank" rel="noreferrer">
            UCDP/PRIO Armed Conflict Dataset
          </a>
          , produced by the Uppsala Conflict Data Program (Uppsala University) with PRIO Oslo — the
          standard academic and UN-referenced source for this. It&apos;s free and{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>{" "}
          licensed: Gleditsch, Wallensteen, Eriksson, Sollenberg &amp; Strand (2002) &quot;Armed
          Conflict 1946-2001: A New Dataset&quot;, <em>Journal of Peace Research</em> 39(5), plus UCDP&apos;s
          annual &quot;Organized violence&quot; article (see the dataset&apos;s own codebook for that year&apos;s
          exact citation).
        </p>
        <p>
          This is a narrow, deliberate slice of the dataset: only conflicts that reached at least 1,000
          battle-related deaths in a calendar year (UCDP&apos;s own &quot;war&quot; threshold) are included, and
          only from 1946 onward — UCDP&apos;s own coverage starts at the end of WWII. A country not showing
          any wars doesn&apos;t mean it&apos;s never had an armed conflict, only that none crossed this specific
          threshold. Interstate wars are shown on both countries&apos; pages.
        </p>
      </>
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
