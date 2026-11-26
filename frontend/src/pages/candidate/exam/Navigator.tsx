import { Check, Flag } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AttemptItem } from '../../../api/attempts'
import { focusRing } from '../../../components/styles'
import type { LocalAnswer } from './useAnswers'

type Filter = 'all' | 'unanswered' | 'marked'

const cell = `relative grid min-h-hit place-items-center rounded-md border font-semibold ${focusRing}`

// DS-004 navigator: items by Subject, answered (ticked) / unanswered / current (underlined) /
// marked (flag), the count, and the filters. In the phones' bottom sheet (`inSheet`) the sheet
// gives the title and the close button.
export default function Navigator({ items, answers, current, onJump, inSheet = false, isDone }: {
  items: AttemptItem[]
  answers: Record<number, LocalAnswer>
  current: number
  onJump: (position: number) => void
  inSheet?: boolean
  /** Answered: a value, or Subject II photos (P6d). */
  isDone: (position: number) => boolean
}) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const answered = items.filter((item) => isDone(item.position)).length
  const marked = items.filter((item) => answers[item.position]?.marked).length
  const shown = (item: AttemptItem) =>
    filter === 'all' || (filter === 'unanswered' ? !isDone(item.position) : answers[item.position]?.marked)

  const grid = (section: AttemptItem['section'], label: string) => {
    const list = items.filter((item) => item.section === section)
    if (list.length === 0) return null
    return (
      <div className="grid gap-2">
        <span className="text-caption text-secondary">{label}</span>
        <div className="grid grid-cols-6 gap-1">
          {list.filter(shown).map((item) => {
            const answer = answers[item.position]
            const done = isDone(item.position)
            const isCurrent = item.position === current
            const name = [
              t('room.navigator.item', { number: item.position }),
              t(done ? 'room.navigator.answered' : 'room.navigator.unanswered'),
              answer?.marked && t('room.navigator.markedItem'),
              isCurrent && t('room.navigator.current'),
            ].filter(Boolean).join(', ')
            return (
              <button
                key={item.position}
                type="button"
                aria-label={name}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => onJump(item.position)}
                className={`${cell} ${done ? 'border-focus bg-primary-subtle text-accent' : 'border-input bg-surface'} ${isCurrent ? 'border-b-4 font-bold' : ''}`}
              >
                {item.position}
                {done && <Check className="absolute bottom-1 right-1 size-3" aria-hidden="true" />}
                {answer?.marked && (
                  <span className="absolute -right-1 -top-1 grid size-icon-md place-items-center rounded-full border border-warning bg-warning-bg text-warning" aria-hidden="true">
                    <Flag className="size-3" fill="currentColor" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const chip = (value: Filter, label: string) => (
    <button
      type="button"
      aria-pressed={filter === value}
      onClick={() => setFilter(value)}
      className={`min-h-hit rounded-full border px-3 text-caption font-medium ${filter === value ? 'border-focus bg-primary-subtle text-accent' : 'border-strong bg-surface'} ${focusRing}`}
    >
      {label}
    </button>
  )

  return (
    <nav aria-label={t('room.navigator.label')} className={`grid content-start gap-4 ${inSheet ? '' : 'rounded-lg border border-subtle bg-surface p-4 shadow-subtle'}`}>
      <div className="flex items-center justify-between gap-3">
        {!inSheet && <span className="text-h3">{t('room.navigator.title')}</span>}
        <span className="text-caption text-secondary">{t('room.navigator.answeredCount', { answered, total: items.length })}</span>
      </div>
      {grid('subject_1', t('room.navigator.subjectOne'))}
      {grid('subject_2', t('room.navigator.subjectTwo'))}
      <hr className="border-subtle" />
      <ul className="grid gap-1 text-caption text-secondary">
        <li className="flex items-center gap-2"><span className="size-icon-lg rounded-md border border-focus bg-primary-subtle" aria-hidden="true" />{t('room.navigator.legendAnswered')}</li>
        <li className="flex items-center gap-2"><span className="size-icon-lg rounded-md border border-input bg-surface" aria-hidden="true" />{t('room.navigator.legendUnanswered')}</li>
        <li className="flex items-center gap-2"><span className="size-icon-lg rounded-md border border-b-4 border-input bg-surface" aria-hidden="true" />{t('room.navigator.legendCurrent')}</li>
        <li className="flex items-center gap-2"><Flag className="size-icon-sm text-warning" fill="currentColor" aria-hidden="true" />{t('room.navigator.legendMarked')}</li>
      </ul>
      <div role="group" aria-label={t('room.navigator.filters')} className="flex flex-wrap gap-2">
        {chip('all', t('room.navigator.all'))}
        {chip('unanswered', t('room.navigator.unansweredFilter', { count: items.length - answered }))}
        {chip('marked', t('room.navigator.markedFilter', { count: marked }))}
      </div>
    </nav>
  )
}
