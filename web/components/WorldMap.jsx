"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import topoIds from "../lib/countryTopoIds.json";
import { readDraggedAlpha3 } from "../lib/dnd";

const WORLD_ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Port of js/components/mapView.js
export default function WorldMap({ selectedAlpha3, filteredAlpha3, onToggleCountry, onDropAlpha3 }) {
  const containerRef = useRef(null);
  const mapApiRef = useRef(null);
  const [world, setWorld] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Couldn't load the map (${res.status})`);
        return res.json();
      })
      .then(setWorld)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!world || !containerRef.current) return;

    const normalizeId = (id) => String(Number(id));
    const byId = new Map(topoIds.map((c) => [normalizeId(c.id), c]));
    const land = topojson
      .feature(world, world.objects.countries)
      .features.filter((f) => byId.has(normalizeId(f.id)));
    const countryOf = (feature) => byId.get(normalizeId(feature.id));
    const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.userAgent);

    const width = 960;
    const height = 480;
    const projection = d3
      .geoNaturalEarth1()
      .fitSize([width - 16, height - 16], { type: "FeatureCollection", features: land });
    const path = d3.geoPath(projection);

    const container = containerRef.current;
    container.innerHTML = "";

    const wrapper = d3.select(container).append("div").attr("class", "map-view");
    const tooltip = wrapper.append("div").attr("class", "map-tooltip").attr("hidden", true);
    const zoomHint = wrapper
      .append("div")
      .attr("class", "map-view__zoom-hint")
      .attr("hidden", true)
      .text(isMac ? "Hold ⌘ and scroll to zoom" : "Hold Ctrl and scroll to zoom");

    const svg = wrapper
      .append("svg")
      .attr("class", "map-view__svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Interactive world map");

    const zoomLayer = svg.append("g");

    zoomLayer
      .append("rect")
      .attr("class", "map-view__ocean")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height);

    const countryPaths = zoomLayer
      .selectAll("path.country")
      .data(land, (d) => d.id)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => countryOf(d)?.name ?? "")
      .on("click", (event, d) => {
        const c = countryOf(d);
        if (c) onToggleCountry(c.alpha3);
      })
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const c = countryOf(d);
          if (c) onToggleCountry(c.alpha3);
        }
      })
      .on("mousemove", (event, d) => {
        const c = countryOf(d);
        if (!c) return;
        const [x, y] = d3.pointer(event, container);
        tooltip
          .attr("hidden", null)
          .style("left", `${x + 14}px`)
          .style("top", `${y + 10}px`)
          .html(`<strong>${c.name}</strong>`);
      })
      .on("mouseleave", () => tooltip.attr("hidden", true));

    // Wheel-scroll only zooms the map while Cmd (Mac) or Ctrl (Windows/Linux)
    // is held, so a plain scroll over the map keeps scrolling the page
    // instead of getting trapped zooming in and out.
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .filter((event) => {
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        return !event.ctrlKey && !event.button;
      })
      .on("zoom", (event) => zoomLayer.attr("transform", event.transform));
    svg.call(zoom);

    // Nudge the user with a brief hint (like Google Maps) when they scroll
    // over the map without the modifier key held.
    let hintTimer = null;
    svg.on("wheel.zoomHint", (event) => {
      if (event.ctrlKey || event.metaKey) {
        zoomHint.attr("hidden", true);
        return;
      }
      zoomHint.attr("hidden", null).classed("is-visible", true);
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(() => {
        zoomHint.classed("is-visible", false);
      }, 1200);
    });

    // The map is also a drop zone (for dragging a card from the list).
    container.addEventListener("dragover", (event) => event.preventDefault());
    container.addEventListener("drop", (event) => {
      event.preventDefault();
      const alpha3 = readDraggedAlpha3(event);
      if (alpha3) onDropAlpha3?.(alpha3);
    });

    mapApiRef.current = { countryPaths, countryOf, wrapper };

    return () => {
      if (hintTimer) clearTimeout(hintTimer);
      mapApiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  // Highlight the selection without redrawing the whole map
  useEffect(() => {
    const api = mapApiRef.current;
    if (!api) return;
    api.wrapper.classed("has-selection", selectedAlpha3.size > 0);
    api.countryPaths.classed("is-selected", (d) => selectedAlpha3.has(api.countryOf(d)?.alpha3));
  }, [selectedAlpha3, world]);

  // Dim the countries that don't pass the active filter
  useEffect(() => {
    const api = mapApiRef.current;
    if (!api) return;
    api.countryPaths.classed(
      "is-dimmed",
      (d) => filteredAlpha3 && !filteredAlpha3.has(api.countryOf(d)?.alpha3)
    );
  }, [filteredAlpha3, world]);

  if (error) {
    return (
      <div className="p-4 text-sm" style={{ color: "var(--danger)" }}>
        Couldn&apos;t load the map: {error}
      </div>
    );
  }

  return <div ref={containerRef} className="map-view-container" />;
}
