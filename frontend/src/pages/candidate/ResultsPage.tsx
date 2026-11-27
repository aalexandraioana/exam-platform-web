import { ArrowLeft, CircleCheck, Clock, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { fetchImage, type AnswerValue, type AttemptImage } from '../../api/attempts'
import { ApiError } from '../../api/client'
import { getResults, type AttemptResult, type ExamResults, type SubjectOneResult, type SubjectTwoResult } from '../../api/results'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { focusRing, linkClass } from '../../components/styles'
import { formatDateTime } from '../examiner/exams/format'
import { formatGrade, formatPoints } from '../examiner/grading/format'
import MathText from './exam/MathText'

const shell = 'mx-auto grid w-full max-w-[880px] content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8'
const card = 'grid content-start gap-3 rounded-lg border border-subtle bg-surface p-4 shadow-subtle tablet:p-6'
const strong = { strong: <strong /> }

/** "01.12.2026" and "18:20" in the user's language and time zone. */
const dayTime = (iso: string, language?: string) => {
  const [date, time] = formatDateTime(iso, language).split(', ')
  return { date, time }
}

// DS-005: the Candidate's results of one Exam, only after publication (D-019): the grade and the
// scores, the cohort note, each Subject I item with the correct answer and the explanation (Q-082),
// each Subject II problem with the barem steps earned, the photos and the comment (Q-083); several
// Attempts with the counted one marked (D-012, Q-084); no class statistics (Q-085).
export default function ResultsPage() {
  const { t, i18n } = useTranslation()
  const examId = Number(useParams().id)
  const [results, setResults] = useState<ExamResults | null>(null)
  const [state, setState] = useState<'loading' | 'failed' | 'not_published' | 'ready'>('loading')
  const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getResults(examId).then(
      (r) => {
        if (!active) return
        setResults(r)
        setSelected(r.attempts.find((a) => a.counted)?.id ?? r.attempts[0]?.id ?? null)
        setState('ready')
      },
      (error) => active && setState(error instanceof ApiError && error.code === 'results_not_published' ? 'not_published' : 'failed'),
    )
    return () => {
      active = false
    }
  }, [examId, reload])

  const back = (
    <Link to="/candidate" className={`${linkClass} inline-flex items-center gap-1 justify-self-start text-caption`}>
      <ArrowLeft className="size-icon-sm" aria-hidden="true" />
      {t('results.back')}
    </Link>
  )

  if (state === 'not_published') {
    return (
      <main className={shell}>
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <Clock className="size-icon-lg text-muted" aria-hidden="true" />
          <h1 className="text-h2">{t('results.notYet')}</h1>
          <p className="max-w-prose text-secondary">{t('results.notYetText')}</p>
          <Link to="/candidate" className={`inline-flex min-h-hit items-center rounded-md border border-strong bg-surface px-4 py-2 font-medium text-primary hover:bg-surface-subtle ${focusRing}`}>
            {t('results.backToDashboard')}
          </Link>
        </div>
      </main>
    )
  }

  if (state !== 'ready' || !results) {
    return (
      <main className={shell}>
        {back}
        {state === 'failed' ? (
          <Alert variant="error" icon={X} role="alert" action={<Button onClick={() => { setState('loading'); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
            <Trans i18nKey="results.loadFailed" components={strong} />
          </Alert>
        ) : (
          <div aria-busy="true" aria-label={t('results.loading')} className="grid gap-4">
            {['w-3/5 h-12', 'w-1/4 h-16', 'w-4/5 h-4'].map((w) => <div key={w} className={`animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
        )}
      </main>
    )
  }

  const { exam, attempts } = results
  const attempt = attempts.find((a) => a.id === selected) ?? attempts[0]
  const published = dayTime(exam.results_published_at, i18n.resolvedLanguage)

  return (
    <main className={shell}>
      {back}
      <div className="grid gap-2">
        <h1 className="text-display [overflow-wrap:anywhere]">{exam.title}</h1>
        <span className="text-caption text-secondary">{t('results.publishedOn', published)}</span>
      </div>

      {attempts.length > 1 && (
        <nav aria-label={t('results.attempts')} className="flex flex-wrap gap-2">
          {attempts.map((a) => (
            <button key={a.id} type="button" aria-pressed={a.id === attempt.id} onClick={() => setSelected(a.id)}
              className={`inline-flex min-h-hit items-center rounded-md border px-4 py-2 font-medium ${a.id === attempt.id ? 'border-focus bg-primary-subtle' : 'border-strong bg-surface hover:bg-surface-subtle'} ${focusRing}`}>
              {t('results.attempt', { number: a.attempt_number, grade: formatGrade(a.grade) })}
              {a.counted && t('results.counts')}
            </button>
          ))}
        </nav>
      )}

      {attempt && <GradeCard attempt={attempt} several={attempts.length > 1} policy={exam.score_policy} />}

      {exam.cohort_note && (
        <section className={card} aria-labelledby="note-h">
          <h2 id="note-h" className="text-h3">{t('results.cohortNote')}</h2>
          <p className="whitespace-pre-line [overflow-wrap:anywhere]">{exam.cohort_note}</p>
        </section>
      )}

      {attempt && (['subject_1', 'subject_2'] as const).map((section) => {
        const items = attempt.items.filter((i) => i.section === section)
        if (items.length === 0) return null
        return (
          <section key={section} className="grid gap-4" aria-labelledby={`${section}-h`}>
            <h2 id={`${section}-h`} className="text-h2">{t(`results.${section}`)}</h2>
            {items.map((item) => item.section === 'subject_1'
              ? <SubjectOneItem key={item.position} item={item} />
              : <SubjectTwoItem key={item.position} item={item} attemptId={attempt.id} />)}
          </section>
        )
      })}
    </main>
  )
}

function GradeCard({ attempt, several, policy }: { attempt: AttemptResult; several: boolean; policy: 'highest' | 'latest' }) {
  const { t, i18n } = useTranslation()
  const rows: [string, string][] = [
    [t('results.subject_1'), `${formatPoints(attempt.subject_1_score)} / 30`],
    [t('results.subject_2'), `${formatPoints(attempt.subject_2_score)} / 60`],
    [t('results.baseline'), '10'],
  ]
  return (
    <section className={`${card} flex flex-wrap items-center justify-between gap-6`} aria-labelledby="grade-h">
      <div className="grid gap-2">
        <h2 id="grade-h" className="text-h3 text-secondary">{t('results.yourGrade')}</h2>
        <span data-testid="grade" className="font-mono text-[48px] font-bold leading-[56px] text-accent">{formatGrade(attempt.grade)}</span>
        <span className="text-caption text-secondary">
          {several ? t(`results.policy.${policy}`) : attempt.submitted_at && t('results.submittedOn', dayTime(attempt.submitted_at, i18n.resolvedLanguage))}
        </span>
      </div>
      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt>{label}</dt>
            <dd aria-label={label} className="text-right font-mono">{value}</dd>
          </div>
        ))}
        <dt className="border-t border-subtle pt-1 font-semibold">{t('results.total')}</dt>
        <dd aria-label={t('results.total')} className="border-t border-subtle pt-1 text-right font-mono font-semibold">{formatPoints(attempt.total_score)} / 100</dd>
      </dl>
    </section>
  )
}

function Points({ awarded, points }: { awarded: number; points: number }) {
  const tone = awarded >= points ? 'text-success' : awarded === 0 ? 'text-error' : ''
  return <span className={`whitespace-nowrap font-mono font-bold ${tone}`}>{formatPoints(awarded)} / {formatPoints(points)}</span>
}

function ItemCard({ id, title, awarded, points, children }: { id: string; title: string; awarded: number; points: number; children: ReactNode }) {
  return (
    <article className={card} aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={id} className="text-h3">{title}</h3>
        <Points awarded={awarded} points={points} />
      </div>
      {children}
    </article>
  )
}

function SubjectOneItem({ item }: { item: SubjectOneResult }) {
  const { t } = useTranslation()
  const choice = item.type === 'single_choice' || item.type === 'multiple_choice'
  const show = (value: AnswerValue) =>
    value === null || value === '' ? <span className="text-secondary">{t('results.noAnswer')}</span>
      : typeof value === 'boolean' ? t(value ? 'room.true' : 'room.false')
        : <MathText text={String(value)} />
  const listed = (value: AnswerValue) => (Array.isArray(value) ? value : typeof value === 'number' ? [value] : [])
  const mine = listed(item.answer)
  const right = listed(item.correct)

  return (
    <ItemCard id={`item-${item.position}`} title={t('results.item', { position: item.position })} awarded={item.awarded_points} points={item.points}>
      <p className="[overflow-wrap:anywhere]"><MathText text={item.statement} /></p>
      {choice ? (
        <ul className="grid gap-2">
          {item.options.map((option, index) => {
            const shown = index + 1
            const isMine = mine.includes(shown)
            const isRight = right.includes(shown)
            const tone = isRight ? 'border-success bg-success-bg' : isMine ? 'border-error bg-error-bg' : 'border-subtle'
            return (
              <li key={shown} aria-label={option} className={`flex items-center gap-3 rounded-md border px-3 py-2 ${tone}`}>
                {isRight && <CircleCheck className="size-icon-sm text-success" aria-hidden="true" />}
                {isMine && !isRight && <X className="size-icon-sm text-error" aria-hidden="true" />}
                <span className="font-mono">{option}</span>
                {(isMine || isRight) && (
                  <span className="ml-auto text-caption text-secondary">
                    {isMine && isRight ? t('results.yoursCorrect') : isMine ? t('results.yoursWrong') : t('results.correctOption')}
                  </span>
                )}
              </li>
            )
          })}
          {mine.length === 0 && <li className="text-caption text-secondary">{t('results.yours')}: {t('results.noAnswer')}</li>}
        </ul>
      ) : (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
          <dt className="text-secondary">{t('results.yours')}</dt>
          <dd aria-label={t('results.yours')} className="flex items-center gap-2">
            {item.answer !== null && item.awarded_points === 0 && <X className="size-icon-sm text-error" aria-hidden="true" />}
            {show(item.answer)}
          </dd>
          <dt className="text-secondary">{t('results.correct')}</dt>
          <dd aria-label={t('results.correct')}>{show(item.correct)}</dd>
        </dl>
      )}
      {item.explanation && (
        <p className="rounded-r-md border-l-[3px] border-focus bg-surface-subtle px-4 py-2 [overflow-wrap:anywhere]">
          <strong>{t('results.explanation')}</strong> <MathText text={item.explanation} />
        </p>
      )}
    </ItemCard>
  )
}

function SubjectTwoItem({ item, attemptId }: { item: SubjectTwoResult; attemptId: number }) {
  const { t } = useTranslation()
  const text = typeof item.answer === 'string' && item.answer.trim() !== '' ? item.answer : null
  const empty = !text && item.images.length === 0

  return (
    <ItemCard id={`problem-${item.position}`} title={t('results.problem', { position: item.position })} awarded={item.awarded_points} points={item.points}>
      <p className="[overflow-wrap:anywhere]"><MathText text={item.statement} /></p>
      {empty ? (
        <p className="text-secondary">{t('results.nothing')}</p>
      ) : (
        <>
          {text && (
            <>
              <h4 className="font-medium">{t('results.written')}</h4>
              <p className="whitespace-pre-line rounded-md bg-surface-subtle px-4 py-3 [overflow-wrap:anywhere]">{text}</p>
            </>
          )}
          {item.images.length > 0 && <Photos attemptId={attemptId} images={item.images} />}
          {item.uses_barem ? (
            <>
              <h4 className="font-medium">{t('results.barem')}</h4>
              <ul className="grid">
                {item.barem.map((step, index) => (
                  <li key={index} aria-label={step.description} className="flex justify-between gap-3 border-b border-subtle py-2">
                    <span>{index + 1} · {step.description}</span>
                    <span className="whitespace-nowrap font-mono">{formatPoints(step.earned)} / {formatPoints(step.points)}</span>
                  </li>
                ))}
                {item.adjustment !== null && item.adjustment !== 0 && (
                  <li aria-label={t('results.adjustment')} className="flex justify-between gap-3 border-b border-subtle py-2">
                    <span className="text-secondary">{t('results.adjustment')}</span>
                    <span className="font-mono">{item.adjustment > 0 ? '+' : ''}{formatPoints(item.adjustment)}</span>
                  </li>
                )}
              </ul>
            </>
          ) : (
            <p className="text-caption text-secondary">{t('results.holistic')}</p>
          )}
        </>
      )}
      {item.comment && (
        <p className="rounded-md border border-focus px-4 py-3 [overflow-wrap:anywhere]">
          <strong>{t('results.comment')}</strong> {item.comment}
        </p>
      )}
    </ItemCard>
  )
}

function Photos({ attemptId, images }: { attemptId: number; images: AttemptImage[] }) {
  const { t } = useTranslation()
  const [urls, setUrls] = useState<Record<number, string>>({})
  useEffect(() => {
    let active = true
    const made: string[] = []
    images.forEach((image) => {
      fetchImage(attemptId, image.id).then(
        (blob) => {
          if (!active) return
          const url = URL.createObjectURL(blob)
          made.push(url)
          setUrls((all) => ({ ...all, [image.id]: url }))
        },
        () => undefined,
      )
    })
    return () => {
      active = false
      made.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [attemptId, images])

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3" aria-label={t('results.photos', { count: images.length })}>
      {images.map((image, index) => (
        <a key={image.id} href={urls[image.id]} target="_blank" rel="noreferrer" className={`overflow-hidden rounded-md border border-subtle bg-surface-subtle ${focusRing}`}>
          {urls[image.id]
            ? <img src={urls[image.id]} alt={t('results.photo', { index: index + 1, total: images.length })} className="aspect-[3/4] w-full object-contain" />
            : <div className="aspect-[3/4] w-full animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
        </a>
      ))}
    </div>
  )
}
