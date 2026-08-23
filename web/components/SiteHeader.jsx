import Link from "next/link";

// Small line-icon for the "Crosswords" menu item: a plus-shaped grid of
// rounded cells (evokes a crossword) with a pencil crossing the bottom-right
// corner, in the site's teal/deep-teal/sand palette.
function CrosswordIcon() {
  return (
    <svg viewBox="0 0 36 36" width="20" height="20" aria-hidden="true">
      <rect x="10" y="10" width="6" height="6" rx="2" fill="var(--accent-deep)" />
      <rect x="10" y="3" width="6" height="6" rx="2" fill="var(--accent-deep)" opacity="0.85" />
      <rect x="3" y="10" width="6" height="6" rx="2" fill="var(--accent-deep)" opacity="0.85" />
      <rect x="17" y="10" width="6" height="6" rx="2" fill="var(--accent)" opacity="0.85" />
      <rect x="10" y="17" width="6" height="6" rx="2" fill="var(--accent)" opacity="0.85" />
      <g transform="rotate(-40 24 21)">
        <rect x="14" y="19" width="20" height="4.2" rx="1.6" fill="var(--accent-deep)" />
        <rect x="14" y="19" width="5" height="4.2" rx="1.6" fill="var(--sand)" />
        <path d="M34 19 L38.5 21.1 L34 23.2 Z" fill="var(--accent)" />
      </g>
    </svg>
  );
}

// Small icon for the "Can you guess?" menu item: a country-shaped
// silhouette (a jagged coastline blob), in the site's deep-teal accent.
function GuessIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4.5 13.6 L5.6 9.4 L8.4 7.6 L7.3 4.6 L11 3.4 L13 6.2 L16.8 5 L19.6 7.8 L17.6 10.6 L19.8 13.4 L15.8 17.6 L12.2 15.6 L9.2 18.6 L6.2 17.4 Z"
        fill="var(--accent-deep)"
      />
    </svg>
  );
}

// Site header: shows the Globeing wordmark (see the "Logo Globeing" spec in
// the project) and the main navigation. "Let's play" is a hover/focus
// dropdown (pure CSS, no JS needed) revealing the game modes.
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
        {/* "By Years" hidden for now — not built yet, re-enable when it is. */}
        <Link href="/random-facts">Random Facts</Link>

        <div className="site-header__nav-item">
          <button type="button" className="site-header__nav-trigger" aria-haspopup="menu">
            Let&apos;s play
            <svg className="site-header__nav-trigger-chevron" viewBox="0 0 12 8" width="10" height="7" aria-hidden="true">
              <path d="M1 1.5 L6 6.5 L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="site-header__dropdown">
            <div className="site-header__dropdown-panel" role="menu">
              <Link href="/crosswords" className="site-header__dropdown-link" role="menuitem">
                <span className="playmenu-icon playmenu-icon--crossword">
                  <CrosswordIcon />
                </span>
                Crosswords
              </Link>
              <Link href="/guess-the-country" className="site-header__dropdown-link" role="menuitem">
                <span className="playmenu-icon playmenu-icon--guess">
                  <GuessIcon />
                </span>
                Can you guess?
              </Link>
            </div>
          </div>
        </div>

        {/* "About us" hidden for now — not built yet, re-enable when it is. */}
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
