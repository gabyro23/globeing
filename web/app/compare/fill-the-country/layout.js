import { pageMetadata } from "../../../lib/seo";

// fill-the-country/page.js is a Client Component ("use client"), so this
// sibling layout carries the route's metadata instead.
export const metadata = pageMetadata({
  title: "Fill the Country — Area Comparison",
  description:
    "See how many times one country fits inside another with an interactive area-fill visualization — how many Spains fit in Russia?",
  path: "/compare/fill-the-country",
});

export default function FillTheCountryLayout({ children }) {
  return children;
}
