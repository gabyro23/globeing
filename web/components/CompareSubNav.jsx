"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/compare", label: "Compare countries" },
  { href: "/compare/fill-the-country", label: "Fill a country" },
];

// Small tab strip shared by every screen under "Compare" — lets people
// switch between the side-by-side comparison and the area-fill puzzle
// without leaving the section.
export default function CompareSubNav() {
  const pathname = usePathname();

  return (
    <nav className="compare-subnav" aria-label="Compare section">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={"compare-subnav__tab" + (pathname === tab.href ? " is-active" : "")}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
