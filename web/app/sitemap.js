import { SITE_URL } from "../lib/seo";

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
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap() {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
