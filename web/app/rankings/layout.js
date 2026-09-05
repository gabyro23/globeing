import { pageMetadata } from "../../lib/seo";

// rankings/page.js is a Client Component ("use client"), so this sibling
// layout carries the route's metadata instead.
export const metadata = pageMetadata({
  title: "Country Rankings",
  description:
    "Top 10 and bottom 10 country rankings by population, GDP, area, and other indicators, filterable by continent.",
  path: "/rankings",
});

export default function RankingsLayout({ children }) {
  return children;
}
