import type { TFunction } from 'i18next'

/** "30.11.2026, 08:00" in the user's language and time zone. */
export function formatDateTime(iso: string, language = 'ro'): string {
  const date = new Date(iso)
  const locale = language === 'en' ? 'en-GB' : 'ro-RO'
  const day = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
  return `${day}, ${time}`
}

/** The availability window: one day keeps one date ("30.11.2026, 08:00 – 14:00"). */
export function formatWindow(t: TFunction, from: string | null, until: string | null, language = 'ro'): string {
  if (!from && !until) return t('exams.noWindow')
  if (!until) return t('exams.from', { date: formatDateTime(from!, language) })
  if (!from) return t('exams.until', { date: formatDateTime(until, language) })
  const start = formatDateTime(from, language)
  const end = formatDateTime(until, language)
  const [startDay] = start.split(', ')
  const [endDay, endTime] = end.split(', ')
  return startDay === endDay ? `${start} – ${endTime}` : `${start} – ${end}`
}

/** An ISO date as the value of an <input type="datetime-local">, in local time. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** A datetime-local value back to ISO with the local offset, or null when cleared. */
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}
