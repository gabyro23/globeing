"use client";

import { useEffect, useState } from "react";

// Sticky "on this page" index for /country/[slug] with scrollspy: the
// link for whichever section is currently under the top of the viewport
// gets highlighted as you scroll. Defaults to the first item (Quick
// facts) so the page loads with that one already active, matching where
// the reader actually starts.
export default function CountryPageIndex({ items, ariaLabel }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);

  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (headings.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        // Several sections can be "in view" at once (a short one plus
        // the start of the next) — the one closest to the top of the
        // activation band is the one the reader is actually at.
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(topMost.target.id);
      },
      // A band near the top of the viewport: a heading "activates" its
      // link once it crosses into the top 20%, and stays the active one
      // until the next heading reaches that same line.
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="country-index" aria-label={ariaLabel}>
      <div className="country-index__eyebrow">On this page</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`country-index__link${item.id === activeId ? " is-active" : ""}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
