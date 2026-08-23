// Small hand-authored decorative icons for the homepage, in the same flat
// "personita" visual language as CountryPictogram.jsx (same fixed, non-
// theme-aware palette). These are static single-purpose SVGs — not the
// data-driven pictogram system — ported from the Homepage.dc.html design.

// Hero note icon: a walking figure, next to "Every number drawn at human
// scale".
export function HumanScaleIcon() {
  return (
    <svg className="landing-hero__note-icon" viewBox="0 0 60 120" aria-hidden="true">
      <rect x="17" y="39" width="5.4" height="30" rx="2.7" fill="#E8B93C" />
      <rect x="37.6" y="39" width="5.4" height="30" rx="2.7" fill="#C9971F" />
      <rect x="24" y="68" width="5.6" height="45" rx="2.8" fill="#1E2A2C" />
      <rect x="30.4" y="68" width="5.6" height="45" rx="2.8" fill="#0F1719" />
      <rect x="21" y="36" width="18" height="34" rx="6" fill="#E8B93C" />
      <rect x="32" y="36" width="7" height="34" rx="5" fill="#C9971F" />
      <rect x="27" y="30" width="6" height="8" fill="#C8A184" />
      <circle cx="30" cy="25" r="9" fill="#24312F" />
    </svg>
  );
}

// "Choose" feature card icon: a walking figure viewed from the side.
export function ChooseIcon() {
  return (
    <svg className="home-feature-card__icon" viewBox="0 0 60 120" aria-hidden="true">
      <ellipse cx="30" cy="114" rx="23" ry="3.6" fill="#1E2A2C" opacity="0.16" />
      <polygon points="8,72 24,78 24,108 8,102" fill="#E8B93C" />
      <polygon points="24,78 40,72 40,102 24,108" fill="#C9971F" />
      <polygon points="40,72 52,78 52,108 40,102" fill="#F0C75A" />
      <polygon points="34,98 31,88.5 37,88.5" fill="#1E2A2C" />
      <circle cx="34" cy="86" r="5" fill="#1E2A2C" />
      <circle cx="34" cy="86" r="1.9" fill="#F0C75A" />
    </svg>
  );
}

// "Compare" feature card icon: three ascending bars.
export function CompareIcon() {
  return (
    <svg className="home-feature-card__icon" viewBox="0 0 60 120" aria-hidden="true">
      <ellipse cx="30" cy="114" rx="21" ry="3.6" fill="#1E2A2C" opacity="0.16" />
      <rect x="11" y="88" width="11" height="20" rx="1" fill="#E8B93C" />
      <rect x="18.5" y="88" width="3.5" height="20" fill="#C9971F" />
      <rect x="24.5" y="74" width="11" height="34" rx="1" fill="#E8B93C" />
      <rect x="32" y="74" width="3.5" height="34" fill="#C9971F" />
      <rect x="38" y="60" width="11" height="48" rx="1" fill="#E8B93C" />
      <rect x="45.5" y="60" width="3.5" height="48" fill="#C9971F" />
      <rect x="8" y="108" width="44" height="3.2" rx="1.6" fill="#1E2A2C" />
    </svg>
  );
}

// "Learn" feature card icon: an open book.
export function LearnIcon() {
  return (
    <svg className="home-feature-card__icon" viewBox="0 0 60 120" aria-hidden="true">
      <ellipse cx="30" cy="114" rx="23" ry="3.6" fill="#1E2A2C" opacity="0.16" />
      <rect x="14" y="60" width="32" height="42" rx="3" fill="#E8B93C" />
      <rect x="36" y="60" width="10" height="42" rx="3" fill="#C9971F" />
      <rect x="17.5" y="63.5" width="25" height="35" rx="1.5" fill="#1E2A2C" />
      <polygon points="6,112 54,112 46,101 14,101" fill="#F0C75A" />
      <polygon points="30,112 54,112 46,101 30,101" fill="#C9971F" opacity="0.45" />
    </svg>
  );
}
