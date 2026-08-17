"use client";

import { useState } from "react";

// Port de js/components/siteHeader.js: si el logo no carga, cae a un
// wordmark de texto en vez de mostrar un ícono roto.
export default function SiteHeader() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className="site-header">
      <a className="site-header__brand" href="/" aria-label="Globeing — home">
        {logoFailed ? (
          <span className="site-header__wordmark">globeing</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="site-header__logo"
            src="/logo.png"
            alt="Globeing"
            onError={() => setLogoFailed(true)}
          />
        )}
      </a>
      <nav className="site-header__nav" aria-label="Main navigation">
        <a href="#about">About us</a>
        <a href="#contact">Contact</a>
        <a href="#" className="site-header__cta">
          Download app
        </a>
      </nav>
    </header>
  );
}
