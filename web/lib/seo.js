// Shared SEO building blocks. Every route composes its `metadata` export
// with `pageMetadata()` below so titles/descriptions stay unique per page
// while Open Graph and Twitter cards stay consistent — Next.js does NOT
// merge `openGraph`/`twitter` objects across segments, so once a page sets
// its own it must include everything it needs (see root app/layout.js for
// the site-wide defaults these override).

export const SITE_NAME = "Globeing";
export const SITE_URL = "https://globeing.co";

export const DEFAULT_DESCRIPTION =
  "Compare any two countries by population, GDP, area, and more — every number drawn at real, human scale so it actually makes sense.";

// globeing.png is a wide wordmark banner (1395x441), not a purpose-built
// 1200x630 social card — it works as a placeholder OG image, but a
// dedicated share image would render better on Facebook/Twitter/Slack.
export const DEFAULT_OG_IMAGE = {
  url: "/globeing.png",
  width: 1395,
  height: 441,
  alt: "Globeing — compare countries side by side",
};

/**
 * Builds a route's `metadata` export.
 *
 * - `title` is a short page title; the root layout's title template turns
 *   it into "<title> | Globeing" everywhere except the homepage.
 * - `absoluteTitle` bypasses the template (used only by the homepage,
 *   which shares its route segment with the root layout).
 * - `path` is the route's pathname (e.g. "/compare"), resolved against
 *   `metadataBase` for the canonical URL and Open Graph/Twitter URLs.
 */
export function pageMetadata({ title, description, path, absoluteTitle, image = DEFAULT_OG_IMAGE }) {
  const resolvedTitle = absoluteTitle ?? title;
  const socialTitle = absoluteTitle ?? `${title} | ${SITE_NAME}`;

  return {
    title: resolvedTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url],
    },
  };
}
