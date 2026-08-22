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

// Small icon for the "Can you guess?" menu item: a question mark in the
// site's deep-teal accent.
function GuessIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fontFamily="Helvetica, Arial, sans-serif"
        fill="var(--accent-deep)"
      >
        ?
      </text>
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
        <a href="#by-years">By Years</a>
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
              <a href="#guess" className="site-header__dropdown-link" role="menuitem">
                <span className="playmenu-icon playmenu-icon--guess">
                  <GuessIcon />
                </span>
                Can you guess?
              </a>
            </div>
          </div>
        </div>

        <a href="#about">About us</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}
