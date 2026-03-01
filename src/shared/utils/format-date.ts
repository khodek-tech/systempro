/**
 * Format a Date into Czech date string: "D. M. YYYY"
 */
export function formatCzechDate(date: Date): string {
  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}

/**
 * Parse a Czech date string "D. M. YYYY" back into a Date object.
 * Returns null if the string cannot be parsed.
 */
export function parseCzechDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.').map((p) => p.trim());
  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return new Date(year, month - 1, day);
}
