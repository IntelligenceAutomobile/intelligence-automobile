// Formats numbers with a visible non-breaking space between thousands groups:
// 150000 -> "150 000". toLocaleString("fr-FR") alone emits a narrow no-break
// space (U+202F) that is barely visible with the site's fonts.
export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
}
