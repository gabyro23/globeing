// Consistent per-country color across the Compare flow — slot cards, the
// chosen-country chips, and the individual-stats bars all use the same
// color for the same country (by selection order), instead of every bar
// being a single uniform accent color. Picked from the existing design
// system's own tokens (app/globals.css) rather than new hardcoded colors,
// so this stays correct in both light and dark mode.
export const COMPARE_PALETTE = ["var(--accent)", "var(--sage)", "var(--sand)"];

export function paletteColor(index) {
  return COMPARE_PALETTE[index] ?? COMPARE_PALETTE[COMPARE_PALETTE.length - 1];
}
