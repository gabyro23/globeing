import Link from "next/link";
import LandingMap from "../components/LandingMap";

// Landing pública de Globeing (puerto de Home.html, diseño de Claude Design).
// La app funcional (buscador + mapa interactivo + comparación) vive en /compare.
export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-hero">
        <h1 className="landing-hero__title">Choose, Compare, and Learn</h1>
        <p className="landing-hero__lede">
          Data can also be fun, play with our interactive tool and discover what makes each country
          unique.
        </p>
        <Link href="/compare" className="btn-primary landing-hero__cta">
          Start comparing →
        </Link>
      </header>

      <LandingMap />

      <p className="landing-legend">Hover a card to lift it · six countries, three indicators</p>

      <footer className="app-footer">
        <p>Datos de población, superficie y economía de fuentes públicas (World Bank).</p>
      </footer>
    </div>
  );
}
