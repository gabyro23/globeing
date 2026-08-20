import Link from "next/link";

// Site header: shows the Globeing wordmark (see the "Logo Globeing" spec in
// the project) and the main navigation.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-header__brand" href="/" aria-label="Globeing — home">
        <span className="logo-mark" aria-hidden="true" />
        <span className="logo-wordmark">
          <span className="logo-wordmark__glob">glob</span>
          <span className="logo-wordmark__eing">eing</span>
        </span>
      </Link>
      <nav className="site-header__nav" aria-label="Main navigation">
        <Link href="/rankings">Rankings</Link>
        <Link href="/compare">Compare</Link>
        <a href="#by-years">By Years</a>
        <Link href="/random-facts">Random Facts</Link>
        <a href="#about">About us</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}
