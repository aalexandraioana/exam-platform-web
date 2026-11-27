import { Check, Minus, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPhoto, saveBarem, saveGrade, type Grade, type GradingItem } from '../../../api/grading'
import Button from '../../../components/Button'
import TextField from '../../../components/TextField'
import { focusRing } from '../../../components/styles'
import { formatPoints, parsePoints } from './format'

type Choice = 'no' | 'partial' | 'yes'
interface StepState {
  choice: Choice | null
  partial: string
}

interface Props {
  item: GradingItem
  /** The heading's name: the Candidate's, or "Candidat #n" when names are hidden. */
  name: string
  readOnly: boolean
  onSaved: (item: GradingItem, next: boolean) => void
  /** After an inline barem save, with the notice to show: the answer and the queue reload. */
  onBaremSaved: (notice: string) => void
}

const cardClass = 'grid content-start gap-4 rounded-lg border border-subtle bg-surface p-4 tablet:p-6'

function initialSteps(item: GradingItem): Record<number, StepState> {
  return Object.fromEntries(
    item.barem.map((step) => {
      const given = item.scores[String(step.id)]
      if (given === undefined || item.graded_at === null) return [step.id, { choice: null, partial: '' }]
      const choice: Choice = given === 0 ? 'no' : given === step.points ? 'yes' : 'partial'
      return [step.id, { choice, partial: choice === 'partial' ? formatPoints(given) : '' }]
    }),
  )
}

// DS-009: one Subject II answer (statement, written steps, photos) and its grade: the barem
// ticked Nu / Parțial / Da per step, or one score without a barem; an adjustment and a comment
// (D-031). The total stays between 0 and the problem's points.
export default function AnswerGrader({ item, name, readOnly, onSaved, onBaremSaved }: Props) {
  const { t } = useTranslation()
  const [steps, setSteps] = useState(() => initialSteps(item))
  const [points, setPoints] = useState(item.uses_barem || item.awarded_points === null ? '' : formatPoints(item.awarded_points - (item.adjustment ?? 0)))
  const [adjustment, setAdjustment] = useState(item.adjustment === null ? '' : formatPoints(item.adjustment))
  const [comment, setComment] = useState(item.comment ?? '')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [editing, setEditing] = useState(false)

  const stepPoints = (id: number, max: number): number | null => {
    const s = steps[id]
    if (!s?.choice) return null
    if (s.choice === 'no') return 0
    if (s.choice === 'yes') return max
    const value = parsePoints(s.partial)
    return value === null || value < 0 || value > max ? null : value
  }
  const adjustmentValue = adjustment.trim() === '' ? 0 : parsePoints(adjustment)
  const base = item.uses_barem
    ? item.barem.reduce<number | null>((sum, step) => {
        const value = stepPoints(step.id, step.points)
        return sum === null || value === null ? null : sum + value
      }, 0)
    : parsePoints(points)
  const total = base === null || adjustmentValue === null ? null : base + adjustmentValue
  const outOfRange = total !== null && (total < 0 || total > item.points)
  const canSave = !readOnly && total !== null && !outOfRange && state !== 'saving'

  const save = async (next: boolean) => {
    if (!canSave || base === null) return
    const extra = { adjustment: adjustment.trim() === '' ? null : adjustmentValue, comment: comment.trim() === '' ? null : comment.trim() }
    const grade: Grade = item.uses_barem
      ? { steps: item.barem.map((step) => ({ id: step.id, points: stepPoints(step.id, step.points)! })), ...extra }
      : { points: base, ...extra }
    setState('saving')
    try {
      const saved = await saveGrade(item.attempt_item_id, grade)
      setState('saved')
      onSaved(saved, next)
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_380px] desktop:items-start">
      <section className={cardClass} aria-labelledby="answer-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="answer-h" className="text-h3 font-semibold">{t('grading.heading', { name, position: item.position })}</h2>
          <span className="rounded-sm bg-surface-subtle px-2 text-caption text-secondary">{t('grading.variant', { code: item.question_code })}</span>
        </div>
        <p className="whitespace-pre-line text-secondary">{item.statement}</p>
        {item.photos.length > 0 && <Photos photos={item.photos} />}
        {item.text ? (
          <div className="grid gap-2">
            <h3 className="font-medium">{t('grading.written')}</h3>
            <p className="whitespace-pre-line rounded-md bg-surface-subtle p-4">{item.text}</p>
          </div>
        ) : (
          item.photos.length === 0 && <p className="text-secondary">{t('grading.nothing')}</p>
        )}
      </section>

      <section className={cardClass} aria-labelledby="grade-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="grade-h" className="text-h3 font-semibold">{t('grading.barem')}</h2>
          {item.uses_barem && !readOnly && !editing && (
            <button type="button" className={`rounded-sm text-caption font-medium text-accent underline ${focusRing}`} onClick={() => setEditing(true)}>
              {t('grading.editBarem')}
            </button>
          )}
        </div>

        {editing ? (
          <BaremEditor item={item} onCancel={() => setEditing(false)} onSaved={(notice) => { setEditing(false); onBaremSaved(notice) }} />
        ) : item.uses_barem ? (
          <ol className="grid gap-4">
            {item.barem.map((step, index) => {
              const n = index + 1
              const s = steps[step.id] ?? { choice: null, partial: '' }
              const pick = (choice: Choice) => setSteps((all) => ({ ...all, [step.id]: { ...s, choice } }))
              return (
                <li key={step.id} className={`grid gap-2 border-b border-subtle pb-4 ${step.modified ? 'rounded-md bg-warning-bg p-2' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      {n} · {step.description}
                      {step.modified && <span className="ml-2 rounded-full bg-success-bg px-2 text-caption font-semibold text-success">{t('grading.modified')}</span>}
                    </span>
                    <span className="shrink-0 text-caption text-secondary">{formatPoints(step.points)} p</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div role="group" aria-label={t('grading.step', { n })} className="inline-flex overflow-hidden rounded-md border border-input">
                      {(['no', 'partial', 'yes'] as Choice[]).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          aria-pressed={s.choice === choice}
                          disabled={readOnly}
                          onClick={() => pick(choice)}
                          className={`inline-flex min-h-hit items-center gap-1 px-3 ${s.choice === choice ? 'bg-success-bg font-semibold text-success' : 'bg-surface'} ${focusRing}`}
                        >
                          {s.choice === choice && (choice === 'yes' ? <Check className="size-icon-sm" aria-hidden="true" /> : choice === 'no' ? <X className="size-icon-sm" aria-hidden="true" /> : <Minus className="size-icon-sm" aria-hidden="true" />)}
                          {t(`grading.${choice}`)}
                        </button>
                      ))}
                    </div>
                    {s.choice === 'partial' ? (
                      <input
                        aria-label={t('grading.stepPoints', { n })}
                        inputMode="decimal"
                        value={s.partial}
                        disabled={readOnly}
                        onChange={(e) => setSteps((all) => ({ ...all, [step.id]: { ...s, partial: e.target.value } }))}
                        className={`min-h-hit w-[4rem] rounded-md border border-input bg-surface px-2 text-right font-mono ${focusRing}`}
                      />
                    ) : (
                      <span className="font-mono">{s.choice ? formatPoints(stepPoints(step.id, step.points) ?? 0) : '–'}</span>
                    )}
                    <span className="font-mono">/ {formatPoints(step.points)}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <>
            <p className="text-secondary">{t('grading.noBarem', { points: item.points })}</p>
            <TextField id="grade-points" label={t('grading.points')} inputMode="decimal" value={points} disabled={readOnly} onChange={(e) => setPoints(e.target.value)} className="w-[6rem] font-mono" />
          </>
        )}

        {!editing && (
          <>
            <TextField
              id="grade-adjustment"
              label={t('grading.adjustment')}
              help={t('grading.adjustmentHelp', { points: item.points })}
              inputMode="decimal"
              value={adjustment}
              disabled={readOnly}
              onChange={(e) => setAdjustment(e.target.value)}
              className="w-[6rem] font-mono"
            />
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{t('grading.total')}</span>
              <span data-testid="grade-total" className="font-mono text-h3 font-semibold">{total === null ? '–' : formatPoints(total)} / {item.points}</span>
            </div>
            {outOfRange && <p className="text-caption text-error">{t('grading.outOfRange', { points: item.points })}</p>}
            <div className="grid gap-1">
              <label htmlFor="grade-comment" className="font-medium">{t('grading.comment')}</label>
              <textarea id="grade-comment" aria-describedby="grade-comment-help" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} className={`min-h-[6rem] rounded-md border border-input bg-surface px-3 py-2 ${focusRing}`} />
              <span id="grade-comment-help" className="text-caption text-secondary">{t('grading.commentHelp')}</span>
            </div>
            {state === 'failed' && <p role="alert" className="text-caption text-error">{t('grading.saveFailed')}</p>}
            {state === 'saved' && <p role="status" className="text-caption text-success">{t('grading.saved')}</p>}
            {!readOnly && (
              <div className="grid grid-cols-2 gap-3">
                <Button disabled={!canSave} onClick={() => save(false)}>{t('grading.save')}</Button>
                <Button variant="primary" disabled={!canSave} onClick={() => save(true)}>{t('grading.saveNext')}</Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Photos({ photos }: { photos: GradingItem['photos'] }) {
  const { t } = useTranslation()
  const [urls, setUrls] = useState<Record<number, string>>({})
  useEffect(() => {
    let active = true
    const made: string[] = []
    photos.forEach((photo) => {
      fetchPhoto(photo.id).then(
        (blob) => {
          if (!active) return
          const url = URL.createObjectURL(blob)
          made.push(url)
          setUrls((all) => ({ ...all, [photo.id]: url }))
        },
        () => undefined,
      )
    })
    return () => {
      active = false
      made.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])
  return (
    <div className="grid gap-2">
      <h3 className="font-medium">{t('grading.photos', { count: photos.length })}</h3>
      <div className="grid gap-3 tablet:grid-cols-2">
        {photos.map((photo, index) => (
          <figure key={photo.id} className="overflow-hidden rounded-md border border-subtle bg-surface-subtle">
            {urls[photo.id] ? (
              <a href={urls[photo.id]} target="_blank" rel="noreferrer" className={focusRing}>
                <img src={urls[photo.id]} alt={t('grading.photo', { index: index + 1, total: photos.length })} className="h-[20rem] w-full object-contain" />
              </a>
            ) : (
              <div className="h-[20rem] w-full animate-pulse motion-reduce:animate-none" aria-hidden="true" />
            )}
            <figcaption className="px-2 py-1 text-caption text-secondary">{index + 1} / {photos.length}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

interface Row {
  id?: number
  key: number
  description: string
  points: string
}

/** Q-078: the question's barem edited here; saved through PATCH /questions/{id} (C-004). */
function BaremEditor({ item, onCancel, onSaved }: { item: GradingItem; onCancel: () => void; onSaved: (notice: string) => void }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Row[]>(() => item.barem.map((s) => ({ id: s.id, key: s.id, description: s.description, points: formatPoints(s.points) })))
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const values = rows.map((r) => parsePoints(r.points))
  const sum = values.reduce<number>((a, v) => a + (v ?? 0), 0)
  const valid = rows.length > 0 && values.every((v) => v !== null && v > 0) && rows.every((r) => r.description.trim() !== '') && sum === item.points
  const set = (key: number, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const save = async () => {
    setSaving(true)
    setFailed(false)
    try {
      const regraded = await saveBarem(item.question_id, rows.map((r, i) => ({ ...(r.id ? { id: r.id } : {}), description: r.description.trim(), points: values[i]! }) as { id: number; description: string; points: number }))
      onSaved(t('grading.baremEditor.saved', { code: item.question_code, ...regraded }))
    } catch {
      setFailed(true)
      setSaving(false)
    }
  }

  return (
    <section aria-label={t('grading.editBarem')} className="grid gap-3">
      <p className="text-caption text-secondary">{t('grading.baremEditor.help')}</p>
      <ol className="grid gap-3">
        {rows.map((row, index) => {
          const n = index + 1
          return (
            <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_4rem_auto] items-center gap-2">
              <input aria-label={t('grading.baremEditor.description', { n })} value={row.description} onChange={(e) => set(row.key, { description: e.target.value })} className={`min-h-hit rounded-md border border-input bg-surface px-2 ${focusRing}`} />
              <input aria-label={t('grading.baremEditor.points', { n })} inputMode="decimal" value={row.points} onChange={(e) => set(row.key, { points: e.target.value })} className={`min-h-hit rounded-md border border-input bg-surface px-2 text-right font-mono ${focusRing}`} />
              <Button iconOnly aria-label={t('grading.baremEditor.remove', { n })} disabled={rows.length === 1} onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}>
                <Trash2 className="size-icon-sm" aria-hidden="true" />
              </Button>
            </li>
          )
        })}
      </ol>
      <Button className="justify-self-start" onClick={() => setRows((all) => [...all, { key: -Date.now(), description: '', points: '' }])}>
        <Plus className="size-icon-sm" aria-hidden="true" />
        {t('grading.baremEditor.add')}
      </Button>
      <p className={`text-caption ${sum === item.points ? 'text-secondary' : 'text-error'}`}>{t('grading.baremEditor.sum', { sum: formatPoints(sum), count: item.points })}</p>
      {failed && <p role="alert" className="text-caption text-error">{t('grading.baremEditor.failed')}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onCancel}>{t('grading.baremEditor.cancel')}</Button>
        <Button variant="primary" disabled={!valid || saving} onClick={save}>{t('grading.baremEditor.save')}</Button>
      </div>
    </section>
  )
}
