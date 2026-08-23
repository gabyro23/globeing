"use client";

import dynamic from "next/dynamic";

// The game picks its 10-country round order with Math.random() on first
// render, which would differ between the server-rendered HTML and the
// client's first render and trigger a hydration mismatch. Loading it with
// ssr:false sidesteps that entirely: the game only ever renders in the
// browser, so there's no server output to mismatch against.
const GuessCountryGame = dynamic(() => import("./GuessCountryGame"), {
  ssr: false,
  loading: () => <div className="guess-country-loading">Loading…</div>,
});

export default function GuessCountryGameClientOnly() {
  return <GuessCountryGame />;
}
