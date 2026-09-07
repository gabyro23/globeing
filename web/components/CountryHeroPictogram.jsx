"use client";

import { useEffect, useMemo, useState } from "react";
import CountryPictogram from "./CountryPictogram";
import GdpPerCapitaPictogram from "./GdpPerCapitaPictogram";
import { loadWorld, featuresByAlpha3 } from "../lib/worldAtlas";
import { niceIconValue, pictogramViewPad } from "../lib/pictogram";

const BOX_SIZE = 300;
const CANVAS_HEIGHT = BOX_SIZE + pictogramViewPad(BOX_SIZE) * 2;

// How many money bags the GDP-per-capita view should show at most for a
// single country — same target CompareModal uses for that view (one
// personita next to a modest stack of bags reads better than a huge one).
const GDP_PER_CAPITA_TARGET_MAX_ICONS = 20;

// Client-only wrapper so the /country/[slug] server page can stay a
// server component (needed for generateStaticParams + real metadata):
// this is the one piece that needs the browser (d3 + the world atlas
// fetched from a CDN), same pattern as compare/fill-the-country/page.js.
// The surrounding page already renders the same numbers in a plain <dl>,
// so these silhouettes are a progressive-enhancement visual, not
// something search engines need to see.
//
// Shows two pictograms side by side, same as the /compare tool's
// multi-metric layout: the country's real silhouette filled with
// personitas (population) next to one personita and its stack of money
// bags (GDP per capita) — both reusing the exact components CompareModal
// uses, just for a single country instead of a compared group.
export default function CountryHeroPictogram({ country }) {
  // `loading` and `feature` are deliberately separate rather than using
  // "feature is still null" to mean "still loading" — now that /country
  // covers 209 countries (not just the 2 this component was first built
  // for), a handful of them have no shape in the world atlas at all (see
  // lib/countryIndex.js's excluded-territory list), and those need to
  // fall through to the "no shape available" message below instead of
  // being stuck on the loading skeleton forever.
  const [loading, setLoading] = useState(true);
  const [feature, setFeature] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadWorld()
      .then((world) => {
        if (cancelled) return;
        const byAlpha3 = featuresByAlpha3(world);
        setFeature(byAlpha3.get(country.iso3) || null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country.iso3]);

  const iconValue = useMemo(() => niceIconValue(Number(country.population) || 0), [country.population]);
  const gdpPerCapitaIconValue = useMemo(
    () => niceIconValue(Number(country.gdp_per_capita_usd) || 0, GDP_PER_CAPITA_TARGET_MAX_ICONS),
    [country.gdp_per_capita_usd]
  );

  if (error) {
    return <p className="pictogram-missing">Couldn&apos;t load the map: {error}</p>;
  }

  if (loading) {
    return (
      <div className="skeleton country-hero-pictogram__loading" aria-busy="true" style={{ height: BOX_SIZE }} />
    );
  }

  return (
    <div className="pictogram-countries">
      {feature ? (
        <CountryPictogram
          country={country}
          feature={feature}
          boxSize={BOX_SIZE}
          canvasHeight={CANVAS_HEIGHT}
          iconValue={iconValue}
        />
      ) : (
        <p className="pictogram-missing" style={{ minHeight: CANVAS_HEIGHT }}>
          We don&apos;t have a detailed map shape for {country.name} yet.
        </p>
      )}
      <GdpPerCapitaPictogram
        country={country}
        iconValue={gdpPerCapitaIconValue}
        canvasHeight={CANVAS_HEIGHT}
      />
    </div>
  );
}
