/** "24 nov 2026" / "24 Nov 2026" (or without the year) and "14:00", in the user's language and time zone. */
export function dayAndTime(iso: string, language = 'ro', withYear = true): { date: string; time: string } {
  const at = new Date(iso)
  const locale = language === 'en' ? 'en-GB' : 'ro-RO'
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
    .formatToParts(at)
    .map((part) => (part.type === 'month' ? part.value.replace('.', '') : part.value))
    .join('')
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(at)
  return { date, time }
}

/** A countdown: "28:45", or "1:05:00" from an hour; never below "00:00". */
export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  const rest = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
  return hours ? `${hours}:${rest}` : rest
}
