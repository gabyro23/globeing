// The "energy mix" section on /country/[slug]: a 100%-stacked bar
// showing the fossil fuels / nuclear / renewables split of a country's
// own electricity generation, plus the individual-source breakdown
// underneath it (country_energy_mix — see
// docs/data/energy_mix_README.md for exactly what's in there and its
// coverage gaps). Pure presentational, same reasoning as
// CountryWarTimeline: no client state needed, stays a plain server
// component.

// The three headline segments, straight from the source's own
// precomputed totals (energy_fossil_total_pct = coal+oil+gas,
// energy_renewables_total_pct = hydro+wind+solar+biofuel+other). Capped
// at 3 series on purpose — a 9-way rainbow of every individual fuel
// wouldn't be readable as a single glance, so the fine-grained sources
// live in the breakdown list below instead, shaded within these same
// three colors rather than given their own hues.
const SUMMARY_SEGMENTS = [
  { key: "energy_fossil_total_pct", label: "Fossil fuels", color: "var(--energy-fossil)" },
  { key: "energy_nuclear_pct", label: "Nuclear", color: "var(--energy-nuclear)" },
  { key: "energy_renewables_total_pct", label: "Renewables", color: "var(--energy-renewable)" },
];

// Individual sources behind the three segments above. `shade` is an
// opacity applied to the family color (1 = the family's own color, each
// step down = lighter) so a 9-row breakdown still reads as "part of the
// fossil/renewable group" at a glance instead of nine unrelated hues.
// Every row also has its own text label, so identity never rests on
// color/shade alone.
const SOURCE_BREAKDOWN = [
  { key: "energy_coal_pct", label: "Coal", color: "var(--energy-fossil)", shade: 1 },
  { key: "energy_oil_pct", label: "Oil", color: "var(--energy-fossil)", shade: 0.78 },
  { key: "energy_gas_pct", label: "Natural gas", color: "var(--energy-fossil)", shade: 0.56 },
  { key: "energy_nuclear_pct", label: "Nuclear", color: "var(--energy-nuclear)", shade: 1 },
  { key: "energy_hydro_pct", label: "Hydropower", color: "var(--energy-renewable)", shade: 1 },
  { key: "energy_wind_pct", label: "Wind", color: "var(--energy-renewable)", shade: 0.84 },
  { key: "energy_solar_pct", label: "Solar", color: "var(--energy-renewable)", shade: 0.68 },
  { key: "energy_biofuel_pct", label: "Bioenergy", color: "var(--energy-renewable)", shade: 0.52 },
  { key: "energy_other_renewable_pct", label: "Other renewables", color: "var(--energy-renewable)", shade: 0.38 },
];

// Below this share, a segment is too narrow for its own inline "NN%"
// label to fit — it still gets its color and a row in the legend below,
// just no text crammed into a sliver.
const MIN_INLINE_LABEL_PCT = 12;

function pctLabel(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return `${Math.round(value)}%`;
}

export default function CountryEnergyMix({ energyMix }) {
  if (!energyMix) return null;

  const segments = SUMMARY_SEGMENTS.map((s) => ({ ...s, value: Number(energyMix[s.key]) || 0 })).filter(
    (s) => s.value > 0
  );
  if (segments.length === 0) return null;

  const rows = SOURCE_BREAKDOWN.map((s) => {
    const raw = energyMix[s.key];
    return { ...s, value: raw === null || raw === undefined ? null : Number(raw) };
  })
    .filter((s) => s.value !== null && s.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="country-energy-mix">
      <div
        className="country-energy-mix__bar"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${Math.round(s.value)}%`).join(", ")}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className="country-energy-mix__segment"
            style={{ width: `${s.value}%`, background: s.color }}
            aria-hidden="true"
          >
            {s.value >= MIN_INLINE_LABEL_PCT && (
              <span className="country-energy-mix__segment-label">{Math.round(s.value)}%</span>
            )}
          </div>
        ))}
      </div>
      <div className="country-energy-mix__legend">
        {segments.map((s) => (
          <span className="country-energy-mix__legend-item" key={s.key}>
            <span
              className="country-energy-mix__legend-swatch"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            {s.label} · {pctLabel(s.value)}
          </span>
        ))}
      </div>
      {rows.length > 0 && (
        <ul className="country-energy-mix__breakdown">
          {rows.map((s) => (
            <li className="country-energy-mix__breakdown-row" key={s.key}>
              <span
                className="country-energy-mix__breakdown-swatch"
                style={{ background: s.color, opacity: s.shade }}
                aria-hidden="true"
              />
              <span className="country-energy-mix__breakdown-label">{s.label}</span>
              <span className="country-energy-mix__breakdown-value">{pctLabel(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
