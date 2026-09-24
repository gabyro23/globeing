import { Calistoga } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "../lib/seo";

const calistoga = Calistoga({ subsets: ["latin"], weight: "400", variable: "--font-calistoga" });

const HOME_TITLE = "Globeing — Compare Countries Side by Side";

// Site-wide defaults. Every other route overrides title/description (and,
// since Next.js does not merge these objects across segments, its own full
// openGraph/twitter) via `pageMetadata()` in lib/seo.js — see app/page.js
// and the other app/**/page.js|layout.js files.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "compare countries",
    "country comparison",
    "country statistics",
    "world data",
    "GDP by country",
    "population by country",
    "country rankings",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  openGraph: {
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full ${calistoga.variable}`}>
      <body className="min-h-full flex flex-col">
        {/* Google Consent Mode v2 defaults: everything denied until the
            visitor accepts in the CookieYes banner (CookieYes then sends the
            "consent update"). Must run BEFORE CookieYes and GA. */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'denied',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 2000
            });
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
          `}
        </Script>
        {/* CookieYes CMP banner — loaded in <head> before anything else. */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/0c40cd6c4e8942e90f7bf5950d6e4c22/script.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8S0DXNK24W"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8S0DXNK24W');
          `}
        </Script>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
