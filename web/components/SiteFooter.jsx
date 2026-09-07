import Link from "next/link";

// Site-wide footer, rendered once in the root layout so every page gets
// it. Only links to pages that actually exist — "About us" and "By Years"
// are left out here too, same as the header, until those are built.
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

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <span className="site-footer__nav-title">Explore</span>
          <Link href="/compare">Compare</Link>
          <Link href="/rankings">Rankings</Link>
          <Link href="/country">Countries</Link>
          <Link href="/random-facts">Random Facts</Link>
          <Link href="/crosswords">Crosswords</Link>
          <Link href="/data-sources">Data Sources</Link>
        </nav>

        <div className="site-footer__contact">
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
