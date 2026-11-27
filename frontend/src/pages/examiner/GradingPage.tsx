import { ArrowLeft, ArrowRight, Check, Info, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { getItem, getQueue, publishResults, type GradingItem, type GradingQueue, type QueueAnswer } from '../../api/grading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import SelectField from '../../components/SelectField'
import { focusRing, linkClass } from '../../components/styles'
import { formatDateTime } from './exams/format'
import AnswerGrader from './grading/AnswerGrader'
import { formatGrade, formatPoints } from './grading/format'

type Mode = 'item' | 'candidate'
const strong = { strong: <strong className="font-mono" /> }
const shell = 'mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8'
const cardClass = 'grid content-start gap-4 rounded-lg border border-subtle bg-surface p-4 tablet:p-6'

const byItem = (a: QueueAnswer, b: QueueAnswer) => a.position - b.position || a.number - b.number
const byCandidate = (a: QueueAnswer, b: QueueAnswer) => a.number - b.number || a.position - b.position
/** The first answer left to grade, then one to check again, then the first. */
const firstOpen = (answers: QueueAnswer[]) =>
  answers.find((a) => a.status === 'to_grade') ?? answers.find((a) => a.status === 'recheck') ?? answers[0]

// DS-009: Subject II grading of one exam, by item or by Candidate, and publishing its results
// once every answer is graded, none is marked for re-check, no Attempt is running and the
// window has closed (D-019, D-031, Q-076, Q-079, Q-080).
export default function GradingPage() {
  const { t, i18n } = useTranslation()
  const examId = Number(useParams().id)
  const [queue, setQueue] = useState<GradingQueue | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [mode, setMode] = useState<Mode>('item')
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [item, setItem] = useState<GradingItem | null>(null)
  const [itemFailed, setItemFailed] = useState(false)
  const [itemReload, setItemReload] = useState(0)
  const [hideNames, setHideNames] = useState(false)
  const [baremNotice, setBaremNotice] = useState<string | null>(null)

  const refresh = useCallback(() => getQueue(examId).then(setQueue), [examId])

  useEffect(() => {
    let active = true
    getQueue(examId).then(
      (q) => {
        if (!active) return
        setQueue(q)
        setCurrentId((id) => id ?? firstOpen([...q.answers].sort(byItem))?.attempt_item_id ?? null)
      },
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [examId, reload])

  useEffect(() => {
    if (currentId === null) return
    let active = true
    getItem(currentId).then(
      (i) => active && setItem(i),
      () => active && setItemFailed(true),
    )
    return () => {
      active = false
    }
  }, [currentId, itemReload])

  const answers = useMemo(() => [...(queue?.answers ?? [])].sort(mode === 'item' ? byItem : byCandidate), [queue, mode])
  const current = answers.find((a) => a.attempt_item_id === currentId) ?? null
  const nameOf = (a: Pick<QueueAnswer, 'candidate' | 'number'>) => (hideNames ? t('grading.hidden', { number: a.number }) : a.candidate)
  const candidates = useMemo(() => {
    const seen = new Map<number, QueueAnswer[]>()
    for (const a of [...(queue?.answers ?? [])].sort(byCandidate)) seen.set(a.attempt_id, [...(seen.get(a.attempt_id) ?? []), a])
    return [...seen.values()]
  }, [queue])

  const back = (
    <Link to={`/examiner/exams/${examId}`} className={`${linkClass} inline-flex items-center gap-1 justify-self-start text-caption`}>
      <ArrowLeft className="size-icon-sm" aria-hidden="true" />
      {t('grading.back')}
    </Link>
  )

  if (!queue) {
    return (
      <main className={shell}>
        {back}
        {failed ? (
          <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
            {t('grading.loadFailed')}
          </Alert>
        ) : (
          <div aria-busy="true" aria-label={t('grading.loading')} className="grid gap-4">
            {['w-1/2', 'w-4/5', 'w-3/5'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
        )}
      </main>
    )
  }

  const { exam, counts, publish } = queue
  const published = exam.results_published_at !== null
  const allGraded = counts.total > 0 && counts.to_grade === 0 && counts.recheck === 0
  const date = exam.available_until ? formatDateTime(exam.available_until, i18n.resolvedLanguage) : null
  const reasons = publish.missing.map((m) =>
    m === 'ungraded' ? t('grading.missing.ungraded', { count: counts.to_grade })
      : m === 'recheck' ? t('grading.missing.recheck', { count: counts.recheck })
        : m === 'window_open' ? (date ? t('grading.missing.window_open', { date }) : t('grading.missing.window_open_none'))
          : t('grading.missing.open_attempts'),
  )
  const why = reasons.length === 0 ? null
    : t('grading.why', { reasons: reasons.length === 1 ? reasons[0] : `${reasons.slice(0, -1).join(', ')}${t('grading.and')}${reasons[reasons.length - 1]}` })

  const go = (answer: QueueAnswer | undefined) => {
    if (!answer || answer.attempt_item_id === currentId) return
    setItem(null)
    setItemFailed(false)
    setBaremNotice(null)
    setCurrentId(answer.attempt_item_id)
  }

  const onSaved = (saved: GradingItem, next: boolean) => {
    setItem(saved)
    if (next) {
      const index = answers.findIndex((a) => a.attempt_item_id === saved.attempt_item_id)
      const after = answers.slice(index + 1)
      go(after.find((a) => a.status !== 'graded') ?? after[0])
    }
    refresh().catch(() => undefined)
  }

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        {back}
        <h1 className="text-display font-semibold text-wrap">{exam.title}</h1>
        <span className="text-caption text-secondary">{exam.classes.join(', ')}</span>
      </div>
      {published ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 text-caption font-semibold text-success">
          <Check className="size-icon-sm" aria-hidden="true" />
          {t('grading.published')}
        </span>
      ) : counts.total > 0 && (
        <div className="grid justify-items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="font-medium">{t('grading.progress', { graded: counts.graded, count: counts.total })}</span>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-subtle" aria-hidden="true">
              <span className="block h-full bg-primary" style={{ width: `${Math.round((counts.graded / counts.total) * 100)}%` }} />
            </div>
          </div>
          {!allGraded && (
            <>
              <Button variant="primary" disabled aria-describedby="pub-why">{t('grading.publish')}</Button>
              {why && <span id="pub-why" className="max-w-prose text-right text-caption text-secondary">{why}</span>}
            </>
          )}
        </div>
      )}
    </div>
  )

  if (exam.submissions === 0 || counts.total === 0) {
    return (
      <main className={shell}>
        {header}
        <section className={`${cardClass} justify-items-center py-12 text-center`}>
          <h2 className="text-h2 font-semibold">{t('grading.empty')}</h2>
          <p className="text-secondary">{t('grading.emptyHelp')}</p>
        </section>
      </main>
    )
  }

  const itemAnswers = current ? answers.filter((a) => a.position === current.position) : []
  const candidateAnswers = current ? answers.filter((a) => a.attempt_id === current.attempt_id) : []
  const candidateIndex = current ? candidates.findIndex((c) => c[0].attempt_id === current.attempt_id) : -1
  const siblings = mode === 'item' ? itemAnswers : candidateAnswers
  const index = current ? siblings.findIndex((a) => a.attempt_item_id === current.attempt_item_id) : -1
  const step = (delta: number) => {
    if (mode === 'item') return go(siblings[index + delta])
    const other = candidates[candidateIndex + delta]
    if (other) go(firstOpen(other))
  }
  const atStart = mode === 'item' ? index <= 0 : candidateIndex <= 0
  const atEnd = mode === 'item' ? index >= siblings.length - 1 : candidateIndex >= candidates.length - 1
  const competence = (position: number) => queue.items.find((i) => i.position === position)?.competence ?? '–'

  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    if (next === 'candidate') {
      const open = candidates.find((c) => c.some((a) => a.status !== 'graded')) ?? candidates[0]
      if (open) go(firstOpen(open))
    }
  }

  return (
    <main className={shell}>
      {header}

      {(allGraded || published) && (
        <PublishCard queue={queue} why={why} date={date} onPublished={() => refresh().catch(() => setFailed(true))} />
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div role="group" aria-label={t('grading.view')} className="inline-flex overflow-hidden rounded-md border border-input">
          {(['item', 'candidate'] as Mode[]).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)}
              className={`min-h-hit px-3 ${mode === m ? 'bg-success-bg font-semibold text-success' : 'bg-surface'} ${focusRing}`}>
              {t(m === 'item' ? 'grading.byItem' : 'grading.byCandidate')}
            </button>
          ))}
        </div>
        <div className="min-w-64">
          {mode === 'item' ? (
            <SelectField id="grading-item" label={t('grading.item')} value={current?.position ?? ''}
              onChange={(e) => go(firstOpen(answers.filter((a) => a.position === Number(e.target.value))))}>
              {queue.items.map((i) => (
                <option key={i.position} value={i.position}>
                  {t('grading.itemOption', { position: i.position, competence: i.competence ?? '–', points: i.points, graded: i.graded, total: i.total })}
                </option>
              ))}
            </SelectField>
          ) : (
            <SelectField id="grading-candidate" label={t('grading.candidate')} value={current?.attempt_id ?? ''}
              onChange={(e) => { const c = candidates.find((x) => x[0].attempt_id === Number(e.target.value)); if (c) go(firstOpen(c)) }}>
              {candidates.map((c) => (
                <option key={c[0].attempt_id} value={c[0].attempt_id}>
                  {t('grading.candidateOption', { name: nameOf(c[0]), graded: c.filter((a) => a.status === 'graded').length, total: c.length })}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        <label className="ml-auto inline-flex min-h-hit items-center gap-2">
          <input type="checkbox" checked={hideNames} onChange={(e) => setHideNames(e.target.checked)} className={`size-5 accent-primary ${focusRing}`} />
          {t('grading.hideNames')}
        </label>
      </div>

      {current && (
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 !py-3`}>
          <Button aria-label={t('grading.previousAnswer')} disabled={atStart} onClick={() => step(-1)}>
            <ArrowLeft className="size-icon-sm" aria-hidden="true" />
            {t('grading.previous')}
          </Button>
          <div className="grid flex-1 gap-0.5">
            <span className="font-medium">{nameOf(current)}</span>
            <span className="text-caption text-secondary">
              {mode === 'item'
                ? <>{t('grading.answerOf', { index: index + 1, total: siblings.length, left: siblings.filter((a) => a.status === 'to_grade').length })}{siblings.some((a) => a.status === 'recheck') && t('grading.recheckOf', { count: siblings.filter((a) => a.status === 'recheck').length })}</>
                : t('grading.candidateOf', { index: candidateIndex + 1, total: candidates.length, graded: candidateAnswers.filter((a) => a.status === 'graded').length, count: candidateAnswers.length })}
            </span>
          </div>
          <Button aria-label={t('grading.nextAnswer')} disabled={atEnd} onClick={() => step(1)}>
            {t('grading.next')}
            <ArrowRight className="size-icon-sm" aria-hidden="true" />
          </Button>
        </div>
      )}

      {mode === 'candidate' && current && (
        <nav aria-label={t('grading.problems')} className="flex flex-wrap gap-2">
          {candidateAnswers.map((a) => (
            <a key={a.attempt_item_id} href={`#item-${a.position}`} aria-current={a.attempt_item_id === currentId ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); go(a) }}
              className={`inline-flex min-h-hit items-center rounded-md border px-3 ${a.attempt_item_id === currentId ? 'border-primary bg-success-bg font-semibold' : 'border-subtle bg-surface'} ${focusRing}`}>
              {t('grading.problemLink', { position: a.position, competence: competence(a.position) })}
              {' · '}
              {a.status === 'graded' && a.awarded_points !== null ? `${formatPoints(a.awarded_points)} / ${queue.items.find((i) => i.position === a.position)?.points ?? 20}`
                : t(a.status === 'recheck' ? 'grading.recheck' : 'grading.toGrade')}
            </a>
          ))}
        </nav>
      )}

      {baremNotice && <Alert variant="success" icon={Check} role="status">{baremNotice}</Alert>}

      {itemFailed ? (
        <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setItemFailed(false); setItemReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
          {t('grading.loadItemFailed')}
        </Alert>
      ) : item && current && item.attempt_item_id === current.attempt_item_id ? (
        <AnswerGrader
          key={item.attempt_item_id + ':' + itemReload}
          item={item}
          name={nameOf(current)}
          readOnly={published}
          onSaved={onSaved}
          onBaremSaved={(notice) => { setBaremNotice(notice); setItemReload((n) => n + 1); refresh().catch(() => undefined) }}
        />
      ) : (
        <div aria-busy="true" aria-label={t('grading.loading')} className="h-48 animate-pulse rounded-lg bg-surface-subtle motion-reduce:animate-none" />
      )}
    </main>
  )
}

function PublishCard({ queue, why, date, onPublished }: { queue: GradingQueue; why: string | null; date: string | null; onPublished: () => void }) {
  const { t, i18n } = useTranslation()
  const { exam, counts, publish } = queue
  const [note, setNote] = useState(exam.cohort_note ?? '')
  const [state, setState] = useState<'idle' | 'publishing' | 'failed'>('idle')

  if (exam.results_published_at) {
    const [day, time] = formatDateTime(exam.results_published_at, i18n.resolvedLanguage).split(', ')
    return (
      <section className={`${cardClass} max-w-3xl`}>
        <Alert variant="success" icon={Check}>
          <strong>{t('grading.publishedOn', { date: day, time })}</strong> {t('grading.publishedText')}
        </Alert>
        {exam.cohort_note && (
          <div className="grid gap-1">
            <h2 className="font-medium">{t('grading.cohortNote')}</h2>
            <p className="whitespace-pre-line rounded-md bg-surface-subtle p-4">{exam.cohort_note}</p>
          </div>
        )}
      </section>
    )
  }

  const submit = async () => {
    setState('publishing')
    try {
      await publishResults(exam.id, note.trim() === '' ? null : note.trim())
      onPublished()
    } catch {
      setState('failed')
    }
  }
  const publishButton = (
    <Button variant="primary" disabled={!publish.ready || state === 'publishing'} onClick={submit}>
      {t('grading.publishFor', { count: exam.submissions })}
    </Button>
  )

  return (
    <section className={`${cardClass} max-w-3xl`} aria-labelledby="pub-h">
      <Alert variant="success" icon={Check}>
        {t('grading.allGraded', { count: counts.total })}{' '}
        {publish.mean !== null && publish.median !== null && (
          <Trans i18nKey="grading.stats" values={{ mean: formatGrade(publish.mean), median: formatGrade(publish.median) }} components={strong} />
        )}
      </Alert>
      <h2 id="pub-h" className="text-h2 font-semibold">{t('grading.publish')}</h2>
      <div className="grid gap-1">
        <label htmlFor="cohort-note" className="font-medium">{t('grading.cohortNote')}</label>
        <textarea id="cohort-note" aria-describedby="cohort-note-help" value={note} onChange={(e) => setNote(e.target.value)} className={`min-h-24 rounded-md border border-input bg-surface px-3 py-2 ${focusRing}`} />
        <span id="cohort-note-help" className="text-caption text-secondary">{t('grading.cohortNoteHelp')}</span>
      </div>
      <ul className="list-disc pl-6 text-secondary">
        <li>{t('grading.publishSees')}</li>
        <li>{t('grading.publishLocks')}</li>
      </ul>
      {state === 'failed' && <p role="alert" className="text-caption text-error">{t('grading.publishFailed')}</p>}
      {publish.ready ? (
        <div className="flex justify-end">{publishButton}</div>
      ) : (
        <>
          <Alert variant="warning" icon={Info}>
            {publish.missing.includes('window_open') && !date
              ? <span>{t('grading.noEnd')}</span>
              : <><span>{why}</span> <span>{t('grading.noteWaits')}</span></>}
          </Alert>
          <div className="flex flex-wrap justify-end gap-3">
            {publish.missing.includes('window_open') && !date && (
              <Link to={`/examiner/exams/${exam.id}`} className={`inline-flex min-h-hit items-center rounded-md border border-strong bg-surface px-4 py-2 font-medium hover:bg-surface-subtle ${focusRing}`}>
                {t('grading.setEnd')}
              </Link>
            )}
            {publishButton}
          </div>
        </>
      )}
    </section>
  )
}
