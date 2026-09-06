import { ImageResponse } from "next/og";
import { getCountryPageData } from "../../../lib/countryPageData";
import { formatPopulationCompact, formatCompareValue } from "../../../lib/format";
import { INDEXED_COUNTRY_ISO3, slugForIso3 } from "../../../lib/countryIndex";

// Runs in the Node.js runtime (not edge) because it goes through the same
// Supabase client as the page itself — keep both on the same runtime so
// this never breaks in an environment where the edge runtime can't run
// @supabase/supabase-js.
export const runtime = "nodejs";
export const alt = "Globeing country facts card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return INDEXED_COUNTRY_ISO3.map((iso3) => ({ slug: slugForIso3(iso3) })).filter((p) => p.slug);
}

function slugToIso3(slug) {
  for (const iso3 of INDEXED_COUNTRY_ISO3) {
    if (slugForIso3(iso3) === slug) return iso3;
  }
  return null;
}

// A flag emoji would be the obvious thing to put here, but Satori (what
// next/og renders with) doesn't draw color emoji without a custom font
// loader — so this card leans on brand color + big type instead of a
// flag, same information, no missing-glyph risk. A pictogram-style
// silhouette version is a nice future upgrade, not attempted here.
export default async function Image({ params }) {
  const { slug } = await params;
  const iso3 = slugToIso3(slug);
  const data = iso3 ? await getCountryPageData(iso3) : null;

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #074F57 0%, #077187 100%)",
            color: "#FBF5EF",
            fontSize: 72,
            fontWeight: 800,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Globeing
        </div>
      ),
      size
    );
  }

  const { country } = data;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #074F57 0%, #077187 100%)",
          color: "#FBF5EF",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", opacity: 0.75 }}>
            Globeing · Country facts
          </span>
          <span style={{ fontSize: 92, fontWeight: 800, marginTop: 24, letterSpacing: -2 }}>
            {country.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: 64 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, opacity: 0.75 }}>Population</span>
            <span style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>
              {formatPopulationCompact(country.population)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, opacity: 0.75 }}>GDP per capita</span>
            <span style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>
              {formatCompareValue(country.gdp_per_capita_usd, "US$")}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, opacity: 0.75 }}>Capital</span>
            <span style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>{country.capital || "—"}</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
