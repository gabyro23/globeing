"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 1360;
const H = 700;

// Six example countries, one per indicator — a decorative showcase of what
// can be compared in /compare (not live data). Direct port of the Home.html
// design from Claude Design.
const POINTS = [
  { country: "Canada", flag: "🇨🇦", label: "GDP", value: "2.3 Trillion", lon: -106, lat: 58, dx: 0, dy: -14 },
  { country: "Spain", flag: "🇪🇸", label: "Population", value: "48.8 Million", lon: -3.7, lat: 40, dx: -30, dy: -16 },
  { country: "Japan", flag: "🇯🇵", label: "Surface", value: "377,975 km²", lon: 138, lat: 37, dx: 60, dy: -14 },
  { country: "Brazil", flag: "🇧🇷", label: "Population", value: "212.6 Million", lon: -51, lat: -11, dx: 0, dy: -14 },
  { country: "Kenya", flag: "🇰🇪", label: "GDP", value: "108 Billion", lon: 37.9, lat: 0.2, dx: 40, dy: -14 },
  { country: "Australia", flag: "🇦🇺", label: "Surface", value: "7,692,024 km²", lon: 134, lat: -25, dx: 0, dy: -14 },
];

export default function LandingMap() {
  const zoneRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return undefined;

    let cancelled = false;
    const svg = d3.select(zone).select("svg.landing-map__svg");
    const projection = d3.geoNaturalEarth1().rotate([-11, 0]);
    const path = d3.geoPath(projection);

    d3.json(WORLD_ATLAS_URL)
      .then((topology) => {
        if (cancelled) return;

        const all = topojson.feature(topology, topology.objects.countries);
        const countries = {
          type: "FeatureCollection",
          features: all.features.filter((f) => f.properties.name !== "Antarctica"),
        };
        projection.fitExtent(
          [
            [10, 10],
            [W - 10, H - 10],
          ],
          countries
        );

        svg.selectAll("*").remove();
        svg
          .append("g")
          .selectAll("path")
          .data(countries.features)
          .join("path")
          .attr("d", path)
          .attr(
            "class",
            (d) =>
              "landing-map__country" +
              (POINTS.some((p) => p.country === d.properties.name) ? " is-highlighted" : "")
          );

        // clean up pins/dots from a previous effect run (e.g. React Strict Mode)
        zone.querySelectorAll(".landing-pin, .landing-dot").forEach((el) => el.remove());

        POINTS.forEach((p) => {
          const [x, y] = projection([p.lon, p.lat]);
          const px = (v) => (v * 100) / W + "%";
          const py = (v) => (v * 100) / H + "%";

          const dot = document.createElement("div");
          dot.className = "landing-dot";
          dot.style.left = px(x);
          dot.style.top = py(y);
          zone.appendChild(dot);

          const pin = document.createElement("div");
          pin.className = "landing-pin";
          pin.style.left = px(x + p.dx);
          pin.style.top = py(y + p.dy);
          pin.innerHTML =
            '<span class="landing-pin__flag" aria-hidden="true">' +
            p.flag +
            "</span><span>" +
            '<span class="landing-pin__label">' +
            p.label +
            "</span>" +
            '<div class="landing-pin__value">' +
            p.value +
            "</div>" +
            '<div class="landing-pin__country">' +
            p.country +
            "</div></span>";
          zone.appendChild(pin);
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="landing-map-zone" ref={zoneRef}>
      <svg
        className="landing-map__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="World map with example data for six countries"
      />
      {error && <p className="landing-map__error">Couldn&apos;t load the map: {error}</p>}
    </div>
  );
}
