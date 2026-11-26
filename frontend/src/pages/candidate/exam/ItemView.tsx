import { Flag } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnswerValue, AttemptItem } from '../../../api/attempts'
import TextField from '../../../components/TextField'
import { focusRing } from '../../../components/styles'
import MathText from './MathText'
import PhotoTray from './PhotoTray'
import type { LocalAnswer } from './useAnswers'

const LETTERS = 'abcdefghij'
const option = (selected: boolean, disabled: boolean) =>
  `flex min-h-hit items-center gap-3 rounded-md border px-4 py-2 ${selected ? 'border-focus bg-primary-subtle' : 'border-input bg-surface'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`

// DS-004 · one item (Q-072): number, points, the review mark, the statement (D-061) and the
// input for its type. Choices are the shown positions (D-045). `typed` answers wait for a pause.
export default function ItemView({ item, answer, disabled, onChange, onLeave, photos }: {
  item: AttemptItem
  answer: LocalAnswer
  disabled: boolean
  onChange: (next: Partial<LocalAnswer>, typed?: boolean) => void
  onLeave: () => void
  /** Subject II photos (P6d), when the storage is set up. */
  photos?: { attemptId: number; onCount: (position: number, count: number) => void; onClosed: () => void }
}) {
  const { t } = useTranslation()
  const id = useId()
  const statementId = `${id}-statement`
  const value = answer.value
  const set = (next: AnswerValue, typed = false) => onChange({ value: next }, typed)

  let input = null
  if (item.type === 'single_choice' || item.type === 'multiple_choice') {
    const multiple = item.type === 'multiple_choice'
    const chosen = multiple ? (Array.isArray(value) ? value : []) : typeof value === 'number' ? [value] : []
    const toggle = (position: number) => {
      if (!multiple) return set(position)
      const next = chosen.includes(position) ? chosen.filter((p) => p !== position) : [...chosen, position].sort((a, b) => a - b)
      set(next.length ? next : null)
    }
    input = (
      <>
        {multiple && <p className="text-caption text-secondary">{t('room.multipleHint')}</p>}
        <div role={multiple ? 'group' : 'radiogroup'} aria-labelledby={statementId} className="grid gap-2">
          {item.options.map((text, index) => {
            const position = index + 1
            const selected = chosen.includes(position)
            return (
              <label key={position} className={option(selected, disabled)}>
                <input type={multiple ? 'checkbox' : 'radio'} name={id} className={`size-icon-md ${focusRing}`} checked={selected} disabled={disabled} onChange={() => toggle(position)} />
                <span className="font-medium">{LETTERS[index]})</span> <span className="[overflow-wrap:anywhere]"><MathText text={text} /></span>
              </label>
            )
          })}
        </div>
      </>
    )
  } else if (item.type === 'dual_choice') {
    input = (
      <div role="radiogroup" aria-labelledby={statementId} className="grid gap-2">
        {[true, false].map((choice) => (
          <label key={String(choice)} className={option(value === choice, disabled)}>
            <input type="radio" name={id} className={`size-icon-md ${focusRing}`} checked={value === choice} disabled={disabled} onChange={() => set(choice)} />
            <span className="font-medium">{t(choice ? 'room.true' : 'room.false')}</span>
          </label>
        ))}
      </div>
    )
  } else if (item.type === 'short_answer') {
    input = (
      <div className="tablet:max-w-auth">
        <TextField
          id={`${id}-short`}
          label={t('room.shortLabel')}
          help={t('room.shortHint')}
          className="font-mono"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => set(event.target.value === '' ? null : event.target.value, true)}
          onBlur={onLeave}
        />
      </div>
    )
  } else {
    input = (
      <div className="grid gap-1">
        <label htmlFor={`${id}-steps`} className="font-medium">{t('room.stepsLabel')}</label>
        <textarea
          id={`${id}-steps`}
          rows={8}
          aria-describedby={`${id}-steps-help`}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => set(event.target.value === '' ? null : event.target.value, true)}
          onBlur={onLeave}
          className={`w-full rounded-md border border-input bg-surface px-3 py-2 text-primary disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        />
        <span id={`${id}-steps-help`} className="text-caption text-secondary">{t(photos ? 'room.stepsHintPhotos' : 'room.stepsHint')}</span>
        {photos && (
          <div className="mt-3">
            <PhotoTray attemptId={photos.attemptId} item={item} disabled={disabled} onCount={(count) => photos.onCount(item.position, count)} onClosed={photos.onClosed} />
          </div>
        )}
      </div>
    )
  }

  return (
    <article aria-labelledby={statementId} className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-grid size-8 place-items-center rounded-full bg-surface-subtle font-bold">{item.position}</span>
          <span className="rounded-full bg-surface-subtle px-2 text-caption font-semibold">{t('room.points', { count: item.points })}</span>
        </div>
        <button
          type="button"
          aria-pressed={answer.marked}
          disabled={disabled}
          onClick={() => onChange({ marked: !answer.marked })}
          className={`inline-flex min-h-hit items-center gap-2 rounded-md px-2 font-medium disabled:opacity-50 ${answer.marked ? 'text-warning' : 'text-accent'} ${focusRing}`}
        >
          <Flag className="size-icon-sm" fill={answer.marked ? 'currentColor' : 'none'} aria-hidden="true" />
          {t(answer.marked ? 'room.marked' : 'room.mark')}
        </button>
      </div>
      <p id={statementId} className="whitespace-pre-wrap [overflow-wrap:anywhere]"><MathText text={item.statement} /></p>
      {input}
    </article>
  )
}
