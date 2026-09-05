// Shared "personita" icon set (from the project's Personitas design doc):
// flat vector figures, same outfit (yellow shirt, dark pants), six poses
// for variety across a population grid, plus a money-bag icon used
// wherever a pictogram represents money (GDP, GDP per capita) instead of
// population. Colors are fixed (not theme-aware) — like the logo mark,
// these are meant to read the same regardless of light/dark mode.
//
// Used by CountryPictogram (population/GDP icons scattered inside a
// country's real silhouette) and GdpPerCapitaPictogram (a single figure
// next to a stack of bags, not shaped by geography) so both draw from the
// exact same figures.

import { createElement } from "react";

const SHIRT = "#E8B93C";
const SHIRT_D = "#C9971F";
const SHIRT_L = "#F0C75A";
const PANT = "#1E2A2C";
const PANT_D = "#0F1719";
const HAIR = "#24312F";
const SKIN = "#C8A184";

export const POSES = {
  front: [
    ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: SHIRT }],
    ["rect", { x: 37.6, y: 39, width: 5.4, height: 30, rx: 2.7, fill: SHIRT_D }],
    ["rect", { x: 24, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT }],
    ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D }],
    ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: SHIRT }],
    ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: SHIRT_D }],
    ["rect", { x: 27, y: 30, width: 6, height: 8, fill: SKIN }],
    ["circle", { cx: 30, cy: 25, r: 9, fill: HAIR }],
  ],
  back: [
    ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 16.6, y: 39, width: 5.4, height: 31, rx: 2.7, fill: "#D9A82C" }],
    ["rect", { x: 38, y: 39, width: 5.4, height: 31, rx: 2.7, fill: SHIRT_D }],
    ["rect", { x: 23.4, y: 68, width: 5.8, height: 45, rx: 2.9, fill: "#182223" }],
    ["rect", { x: 30.8, y: 68, width: 5.8, height: 45, rx: 2.9, fill: PANT_D }],
    ["rect", { x: 20.6, y: 36, width: 18.8, height: 34, rx: 6, fill: "#D9A82C" }],
    ["rect", { x: 33, y: 36, width: 6.4, height: 34, rx: 5, fill: "#B98B18" }],
    ["rect", { x: 27, y: 30, width: 6, height: 8, fill: "#B08F72" }],
    ["circle", { cx: 30, cy: 25, r: 9, fill: "#1C2725" }],
  ],
  right: [
    ["ellipse", { cx: 30, cy: 114, rx: 9, ry: 3.2, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 27.6, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT_D }],
    ["rect", { x: 30.4, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT }],
    ["rect", { x: 26, y: 36, width: 11, height: 34, rx: 5, fill: SHIRT }],
    ["rect", { x: 32.6, y: 36, width: 4.4, height: 34, rx: 4, fill: SHIRT_D }],
    ["rect", { x: 29.6, y: 39, width: 4.6, height: 29, rx: 2.3, fill: SHIRT_L }],
    ["rect", { x: 29.6, y: 30, width: 5, height: 8, fill: SKIN }],
    ["circle", { cx: 31.6, cy: 25, r: 8.2, fill: HAIR }],
    ["rect", { x: 38, y: 23.4, width: 3.4, height: 4.4, rx: 1.7, fill: SKIN }],
  ],
  left: [
    ["ellipse", { cx: 30, cy: 114, rx: 9, ry: 3.2, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 27, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT_D }],
    ["rect", { x: 24.2, y: 68, width: 5.4, height: 45, rx: 2.7, fill: PANT }],
    ["rect", { x: 23, y: 36, width: 11, height: 34, rx: 5, fill: SHIRT }],
    ["rect", { x: 30.6, y: 36, width: 3.4, height: 34, rx: 3, fill: SHIRT_D }],
    ["rect", { x: 25.8, y: 39, width: 4.6, height: 29, rx: 2.3, fill: SHIRT_L }],
    ["rect", { x: 25.4, y: 30, width: 5, height: 8, fill: SKIN }],
    ["circle", { cx: 28.4, cy: 25, r: 8.2, fill: HAIR }],
    ["rect", { x: 18.6, y: 23.4, width: 3.4, height: 4.4, rx: 1.7, fill: SKIN }],
  ],
  walk: [
    ["ellipse", { cx: 30, cy: 114, rx: 15, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 25, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D, transform: "rotate(13 27.8 70)" }],
    ["rect", { x: 29.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT, transform: "rotate(-14 32.2 70)" }],
    ["rect", { x: 21.4, y: 36, width: 18, height: 34, rx: 6, fill: SHIRT }],
    ["rect", { x: 32.4, y: 36, width: 7, height: 34, rx: 5, fill: SHIRT_D }],
    ["rect", { x: 17.4, y: 39, width: 5.4, height: 29, rx: 2.7, fill: SHIRT, transform: "rotate(-16 20.1 41)" }],
    ["rect", { x: 38, y: 39, width: 5.4, height: 29, rx: 2.7, fill: SHIRT_D, transform: "rotate(15 40.7 41)" }],
    ["rect", { x: 27.4, y: 30, width: 6, height: 8, fill: SKIN }],
    ["circle", { cx: 30.4, cy: 25, r: 9, fill: HAIR }],
  ],
  wave: [
    ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
    ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: SHIRT }],
    ["rect", { x: 37.6, y: 20, width: 5.4, height: 28, rx: 2.7, fill: SHIRT_D, transform: "rotate(18 40.3 46)" }],
    ["rect", { x: 25.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT, transform: "rotate(-7 28.2 70)" }],
    ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: PANT_D, transform: "rotate(6 33.2 70)" }],
    ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: SHIRT }],
    ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: SHIRT_D }],
    ["rect", { x: 27, y: 30, width: 6, height: 8, fill: SKIN }],
    ["circle", { cx: 29.4, cy: 25, r: 9, fill: HAIR }],
  ],
};
export const POSE_NAMES = ["front", "back", "right", "left", "walk", "wave"];

// Money bag — same visual language as the personitas (flat shapes, side
// shading, ground shadow) — used as the icon for any pictogram showing an
// amount of money (total GDP or GDP per capita) instead of population.
export const BAG = [
  ["ellipse", { cx: 30, cy: 114, rx: 16, ry: 4, fill: PANT, opacity: 0.16 }],
  ["ellipse", { cx: 30, cy: 84, rx: 23, ry: 29, fill: SHIRT }],
  ["ellipse", { cx: 39, cy: 86, rx: 14, ry: 27, fill: SHIRT_D, opacity: 0.55 }],
  ["rect", { x: 21, y: 40, width: 18, height: 18, rx: 4, fill: SHIRT }],
  ["rect", { x: 31, y: 40, width: 8, height: 18, rx: 4, fill: SHIRT_D }],
  ["rect", { x: 18.5, y: 49, width: 23, height: 8, rx: 4, fill: PANT }],
  ["rect", { x: 23, y: 31, width: 14, height: 11, rx: 5.5, fill: SHIRT_L }],
  [
    "text",
    { x: 26, y: 96, fontSize: 30, fontWeight: 800, fill: PANT_D, fontFamily: "Helvetica,Arial,sans-serif", opacity: 0.85 },
    "$",
  ],
];

export function renderPrimitives(list) {
  return list.map(([tag, props, text], i) => createElement(tag, { key: i, ...props }, text));
}
