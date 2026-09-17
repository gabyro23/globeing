// Two-state "personita" figures for the Unemployment comparison view:
// the project's usual yellow figure when employed, grey when unemployed,
// plus a transitional figure shaded grey from the feet up for whichever
// fraction of a person a country's rate lands on. Six poses for crowd
// variety — same base geometry AND colors as the shared population
// personita in lib/pictogramIcons.js for "employed" (see
// Personitas.dc.html), paired with its own grey "unemployed" variant.
// Layout ported from the Unemployment.dc.html reference design.

import { createElement } from "react";

const PANT = "#1E2A2C";
const PANT_D = "#0F1719";
const HAIR = "#24312F";
const SKIN = "#C8A184";

// The project's canonical yellow personita (see Personitas.dc.html /
// lib/pictogramIcons.js): yellow shirt, dark pants — not a solid-yellow
// recolor — so "employed" here is the exact same figure used everywhere
// else, just standing next to the grey "unemployed" one instead of the
// usual silhouette background.
const EMPLOYED_COLOR = { shirt: "#E8B93C", shirtD: "#C9971F", pant: PANT, pantD: PANT_D, hair: HAIR, skin: SKIN };
const EMPLOYED_HIGHLIGHT = "#F0C75A";

const IDLE_COLOR = {
  shirt: "#5F7376",
  shirtD: "#4A5C5F",
  pant: "#3A4749",
  pantD: "#2E393B",
  hair: "#2C3739",
  skin: "#7C8B8C",
};
const IDLE_HIGHLIGHT = "#76898C";

function buildPoses(c, highlight) {
  return {
    front: [
      ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
      ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: c.shirt }],
      ["rect", { x: 37.6, y: 39, width: 5.4, height: 30, rx: 2.7, fill: c.shirtD }],
      ["rect", { x: 24, y: 68, width: 5.6, height: 45, rx: 2.8, fill: c.pant }],
      ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: c.pantD }],
      ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: c.shirt }],
      ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: c.shirtD }],
      ["rect", { x: 27, y: 30, width: 6, height: 8, fill: c.skin }],
      ["circle", { cx: 30, cy: 25, r: 9, fill: c.hair }],
    ],
    back: [
      ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
      ["rect", { x: 16.6, y: 39, width: 5.4, height: 31, rx: 2.7, fill: c.shirt }],
      ["rect", { x: 38, y: 39, width: 5.4, height: 31, rx: 2.7, fill: c.shirtD }],
      ["rect", { x: 23.4, y: 68, width: 5.8, height: 45, rx: 2.9, fill: c.pant }],
      ["rect", { x: 30.8, y: 68, width: 5.8, height: 45, rx: 2.9, fill: c.pantD }],
      ["rect", { x: 20.6, y: 36, width: 18.8, height: 34, rx: 6, fill: c.shirt }],
      ["rect", { x: 33, y: 36, width: 6.4, height: 34, rx: 5, fill: c.shirtD }],
      ["rect", { x: 27, y: 30, width: 6, height: 8, fill: c.skin }],
      ["circle", { cx: 30, cy: 25, r: 9, fill: c.hair }],
    ],
    right: [
      ["ellipse", { cx: 30, cy: 114, rx: 9, ry: 3.2, fill: PANT, opacity: 0.16 }],
      ["rect", { x: 27.6, y: 68, width: 5.4, height: 45, rx: 2.7, fill: c.pantD }],
      ["rect", { x: 30.4, y: 68, width: 5.4, height: 45, rx: 2.7, fill: c.pant }],
      ["rect", { x: 26, y: 36, width: 11, height: 34, rx: 5, fill: c.shirt }],
      ["rect", { x: 32.6, y: 36, width: 4.4, height: 34, rx: 4, fill: c.shirtD }],
      ["rect", { x: 29.6, y: 39, width: 4.6, height: 29, rx: 2.3, fill: highlight }],
      ["rect", { x: 29.6, y: 30, width: 5, height: 8, fill: c.skin }],
      ["circle", { cx: 31.6, cy: 25, r: 8.2, fill: c.hair }],
      ["rect", { x: 38, y: 23.4, width: 3.4, height: 4.4, rx: 1.7, fill: c.skin }],
    ],
    left: [
      ["ellipse", { cx: 30, cy: 114, rx: 9, ry: 3.2, fill: PANT, opacity: 0.16 }],
      ["rect", { x: 27, y: 68, width: 5.4, height: 45, rx: 2.7, fill: c.pantD }],
      ["rect", { x: 24.2, y: 68, width: 5.4, height: 45, rx: 2.7, fill: c.pant }],
      ["rect", { x: 23, y: 36, width: 11, height: 34, rx: 5, fill: c.shirt }],
      ["rect", { x: 30.6, y: 36, width: 3.4, height: 34, rx: 3, fill: c.shirtD }],
      ["rect", { x: 25.8, y: 39, width: 4.6, height: 29, rx: 2.3, fill: highlight }],
      ["rect", { x: 25.4, y: 30, width: 5, height: 8, fill: c.skin }],
      ["circle", { cx: 28.4, cy: 25, r: 8.2, fill: c.hair }],
      ["rect", { x: 18.6, y: 23.4, width: 3.4, height: 4.4, rx: 1.7, fill: c.skin }],
    ],
    walk: [
      ["ellipse", { cx: 30, cy: 114, rx: 15, ry: 3.6, fill: PANT, opacity: 0.16 }],
      ["rect", { x: 25, y: 68, width: 5.6, height: 45, rx: 2.8, fill: c.pantD, transform: "rotate(13 27.8 70)" }],
      ["rect", { x: 29.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: c.pant, transform: "rotate(-14 32.2 70)" }],
      ["rect", { x: 21.4, y: 36, width: 18, height: 34, rx: 6, fill: c.shirt }],
      ["rect", { x: 32.4, y: 36, width: 7, height: 34, rx: 5, fill: c.shirtD }],
      ["rect", { x: 17.4, y: 39, width: 5.4, height: 29, rx: 2.7, fill: c.shirt, transform: "rotate(-16 20.1 41)" }],
      ["rect", { x: 38, y: 39, width: 5.4, height: 29, rx: 2.7, fill: c.shirtD, transform: "rotate(15 40.7 41)" }],
      ["rect", { x: 27.4, y: 30, width: 6, height: 8, fill: c.skin }],
      ["circle", { cx: 30.4, cy: 25, r: 9, fill: c.hair }],
    ],
    wave: [
      ["ellipse", { cx: 30, cy: 114, rx: 13, ry: 3.6, fill: PANT, opacity: 0.16 }],
      ["rect", { x: 17, y: 39, width: 5.4, height: 30, rx: 2.7, fill: c.shirt }],
      ["rect", { x: 37.6, y: 20, width: 5.4, height: 28, rx: 2.7, fill: c.shirtD, transform: "rotate(18 40.3 46)" }],
      ["rect", { x: 25.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: c.pant, transform: "rotate(-7 28.2 70)" }],
      ["rect", { x: 30.4, y: 68, width: 5.6, height: 45, rx: 2.8, fill: c.pantD, transform: "rotate(6 33.2 70)" }],
      ["rect", { x: 21, y: 36, width: 18, height: 34, rx: 6, fill: c.shirt }],
      ["rect", { x: 32, y: 36, width: 7, height: 34, rx: 5, fill: c.shirtD }],
      ["rect", { x: 27, y: 30, width: 6, height: 8, fill: c.skin }],
      ["circle", { cx: 29.4, cy: 25, r: 9, fill: c.hair }],
    ],
  };
}

export const EMPLOYED_POSES = buildPoses(EMPLOYED_COLOR, EMPLOYED_HIGHLIGHT);
export const IDLE_POSES = buildPoses(IDLE_COLOR, IDLE_HIGHLIGHT);
export const POSE_NAMES = ["front", "back", "right", "left", "walk", "wave"];

export function renderPrimitives(list) {
  return list.map(([tag, props, text], i) => createElement(tag, { key: i, ...props }, text));
}
