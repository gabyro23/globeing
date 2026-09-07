import { SITE_URL } from "../lib/seo";
import { INDEXED_COUNTRY_ISO3, slugForIso3 } from "../lib/countryIndex";

// Keep in sync with the routes under app/ — each one now has its own
// unique metadata (see lib/seo.js and the page/layout files).
const ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.9 },
  { path: "/compare/fill-the-country", changeFrequency: "monthly", priority: 0.6 },
  { path: "/rankings", changeFrequency: "weekly", priority: 0.8 },
  { path: "/random-facts", changeFrequency: "daily", priority: 0.7 },
  { path: "/crosswords", changeFrequency: "monthly", priority: 0.6 },
  { path: "/guess-the-country", changeFrequency: "monthly", priority: 0.6 },
  { path: "/country", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/data-sources", changeFrequency: "monthly", priority: 0.3 },
];

// One entry per published /country/[slug] page (see lib/countryIndex.js
// for the allowlist that controls which countries actually have a page).
const COUNTRY_ROUTES = INDEXED_COUNTRY_ISO3.map((iso3) => ({
  path: `/country/${slugForIso3(iso3)}`,
  changeFrequency: "monthly",
  priority: 0.7,
})).filter((route) => route.path !== "/country/null");

export default function sitemap() {
  const now = new Date();
  return [...ROUTES, ...COUNTRY_ROUTES].map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
