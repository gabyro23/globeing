import { pageMetadata } from "../../lib/seo";

// compare/page.js is a Client Component ("use client"), and Next.js only
// supports the `metadata` export from Server Components — so this sibling
// layout carries the route's metadata instead.
export const metadata = pageMetadata({
  title: "Compare Countries",
  description:
    "Pick any two countries on an interactive map and compare population, GDP, land area, and other key indicators side by side.",
  path: "/compare",
});

export default function CompareLayout({ children }) {
  return children;
}
