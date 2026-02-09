/**
 * Format a Date into Czech date string: "D. M. YYYY"
 */
export function formatCzechDate(date: Date): string {
  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}
