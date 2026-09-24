import Link from "next/link";

// Site-wide footer (design "2a"), rendered once in the root layout so every
// page gets it. Brand + tagline, Explore links split in two columns (the
// second one has no title of its own), and a Contact column. Only links to
// pages that actually exist.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <Link className="site-header__brand" href="/" aria-label="Globeing — home">
            <span className="logo-mark" aria-hidden="true" />
            <span className="logo-wordmark">
              <span className="logo-wordmark__globe">globe</span>
              <span className="logo-wordmark__ing">ing</span>
            </span>
          </Link>
          <p className="site-footer__tagline">Made to explore the world, one fact at a time.</p>
        </div>

        <nav className="site-footer__explore" aria-label="Footer navigation">
          <span className="site-footer__nav-title">Explore</span>
          <div className="site-footer__explore-cols">
            <div className="site-footer__col">
              <Link href="/compare">Compare</Link>
              <Link href="/compare/fill-the-country">Fill a country</Link>
              <Link href="/rankings">Rankings</Link>
              <Link href="/country">Countries</Link>
              <Link href="/noticias">News</Link>
            </div>
            <div className="site-footer__col">
              <Link href="/random-facts">Random Facts</Link>
              <Link href="/crosswords">Crosswords</Link>
              <Link href="/guess-the-country">Guess the country</Link>
              <Link href="/data-sources">Data Sources</Link>
            </div>
          </div>
        </nav>

        <div className="site-footer__col">
          <span className="site-footer__nav-title">Contact</span>
          <a href="mailto:gabyro23@gmail.com">gabyro23@gmail.com</a>
          <Link href="/contact">Contact page →</Link>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Globeing.</span>
        <span>
          Population, area, and economic data from public sources (World Bank) ·{" "}
          <Link href="/data-sources">See all data sources</Link>
        </span>
      </div>
    </footer>
  );
}
