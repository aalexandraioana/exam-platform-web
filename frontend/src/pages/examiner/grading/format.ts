/** Points with a decimal comma and no trailing zeros: 9.5 → "9,5", 6 → "6". */
export function formatPoints(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',')
}

/** "2,5" or "2.5" → 2.5; empty or not a number → null. */
export function parsePoints(text: string): number | null {
  const trimmed = text.trim().replace(',', '.')
  if (trimmed === '' || !/^-?\d+(\.\d+)?$/.test(trimmed)) return null
  return Number(trimmed)
}

/** A grade (1–10) with two decimals and a comma: 7.9 → "7,90". */
export function formatGrade(value: number): string {
  return value.toFixed(2).replace('.', ',')
}
