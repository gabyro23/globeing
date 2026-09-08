"use client";

// A few illustrative pairs/trios so people can see a comparison in one
// click instead of having to pick countries themselves first. Easy to
// swap for a different set later — this is just a starting lineup, not
// data-driven.
const QUICK_PICKS = [
  { label: "Spain vs Morocco", codes: ["ESP", "MAR"] },
  { label: "Japan vs South Korea", codes: ["JPN", "KOR"] },
  { label: "Brazil vs Uruguay vs Argentina", codes: ["BRA", "URY", "ARG"] },
];

export default function CompareQuickPicks({ onPick }) {
  return (
    <div className="compare-quick-picks">
      <span className="compare-quick-picks__label">Try</span>
      <div className="compare-quick-picks__list">
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick.label}
            type="button"
            className="quick-pick-pill"
            onClick={() => onPick(pick.codes)}
          >
            {pick.label}
          </button>
        ))}
      </div>
    </div>
  );
}
