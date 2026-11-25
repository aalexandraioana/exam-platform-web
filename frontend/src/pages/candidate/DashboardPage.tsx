import { ArrowRight, CircleCheck, Clock, FolderOpen, Info, Plus, UserPlus, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { listCandidateExams, startAttempt, type CandidateExam, type CandidateExams } from '../../api/attempts'
import type { Membership } from '../../api/classes'
import { ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { focusRing } from '../../components/styles'
import ExamCard from './ExamCard'
import JoinClassDialog from './JoinClassDialog'
import { clock, dayAndTime } from './format'

const strong = { strong: <strong /> }
const primaryLink = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-on-primary no-underline hover:bg-primary-hover ${focusRing}`

type Notice = { kind: 'sent' | 'already'; name: string } | { kind: 'refused'; code: string }

// DS-003 · the Candidate's dashboard (P7a): the Attempt in progress, the exam cards by state, the
// empty states and joining a class (D-028). Times come from the server's clock, not the device's.
export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [data, setData] = useState<CandidateExams | null>(null)
  const [offset, setOffset] = useState(0)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [joining, setJoining] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [starting, setStarting] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    listCandidateExams().then(
      (list) => {
        if (!active) return
        setOffset(Date.parse(list.server_time) - Date.now())
        setData(list)
      },
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [reload])

  const ongoing = data?.exams.filter((exam) => exam.open_attempt) ?? []
  useEffect(() => {
    if (ongoing.length === 0) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [ongoing.length])

  // A closed exam never started is left out; the one in progress has its own banner.
  const cards = data?.exams.filter((exam) => !exam.open_attempt && (exam.state !== 'closed' || exam.submitted)) ?? []
  const empty = data !== null && ongoing.length === 0 && cards.length === 0

  async function start(exam: CandidateExam) {
    setStarting(true)
    setNotice(null)
    try {
      const attempt = await startAttempt(exam.id)
      navigate(`/candidate/attempts/${attempt.id}`)
    } catch (failure) {
      const code = failure instanceof ApiError ? failure.code ?? '' : ''
      if (code === 'attempt_open' && failure instanceof ApiError && typeof failure.body.attempt_id === 'number') {
        navigate(`/candidate/attempts/${failure.body.attempt_id}`)
        return
      }
      setNotice({ kind: 'refused', code })
      setStarting(false)
      setReload((n) => n + 1)
    }
  }

  function joined(membership: Membership) {
    setJoining(false)
    setNotice({ kind: membership.status === 'accepted' ? 'already' : 'sent', name: membership.class.name })
    setReload((n) => n + 1)
  }

  const joinButton = (label = t('candidate.join'), primary = true) => (
    <Button variant={primary ? 'primary' : 'secondary'} onClick={() => setJoining(true)}>
      <Plus className="size-icon-sm" aria-hidden="true" />
      {label}
    </Button>
  )

  let emptyState = null
  if (empty) {
    const { accepted, pending } = data.classes
    const [Icon, key, action] = accepted === 0 && pending === 0 ? [UserPlus, 'noClass', joinButton()]
      : accepted === 0 ? [Clock, 'waiting', joinButton(t('candidate.joinOther'), false)]
        : [FolderOpen, 'noExams', null]
    emptyState = (
      <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
        <Icon className="size-icon-lg text-muted" aria-hidden="true" />
        <h2 className="text-h2">{t(`candidate.empty.${key}Title`)}</h2>
        <p className="text-secondary">{t(`candidate.empty.${key}Text`)}</p>
        {action}
      </div>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-display">{t('candidate.title')}</h1>
          {(data || failed) && <p className="text-secondary">{t(empty ? 'candidate.subtitleEmpty' : 'candidate.subtitle')}</p>}
        </div>
        {(failed || (data && !empty)) && joinButton()}
      </div>

      {notice?.kind === 'sent' && (
        <Alert variant="success" icon={CircleCheck} role="status">
          <Trans i18nKey="candidate.joinDialog.sent" values={{ name: notice.name }} components={strong} />
        </Alert>
      )}
      {notice?.kind === 'already' && (
        <Alert variant="info" icon={Info} role="status">
          <Trans i18nKey="candidate.joinDialog.already" values={{ name: notice.name }} components={strong} />
        </Alert>
      )}
      {notice?.kind === 'refused' && (
        <Alert variant="error" icon={Info} role="alert">
          {t(`candidate.startRefused.${['no_attempts_left', 'not_available'].includes(notice.code) ? notice.code : 'other'}`)}
        </Alert>
      )}

      {failed && (
        <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
          <Trans i18nKey="candidate.loadFailed" components={strong} />
        </Alert>
      )}

      {data === null && !failed && (
        <div aria-busy="true" aria-label={t('candidate.loading')} className="grid gap-4">
          <div className="grid gap-3 rounded-lg border border-subtle bg-surface p-6">
            {['w-1/4', 'w-3/5'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {[1, 2].map((n) => (
              <div key={n} className="grid gap-3 rounded-lg border border-subtle bg-surface p-6">
                {['w-1/3', 'w-full', 'w-4/5'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
              </div>
            ))}
          </div>
        </div>
      )}

      {ongoing.map((exam) => {
        const attempt = exam.open_attempt!
        const left = clock(Date.parse(attempt.expires_at) - (now + offset))
        return (
          <section key={exam.id} aria-labelledby={`ongoing-${exam.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-l-4 border-focus bg-surface p-6 shadow-subtle">
            <div className="grid min-w-0 flex-1 gap-2">
              <span className="inline-flex items-center gap-1 justify-self-start rounded-full bg-warning-bg px-2 text-caption font-semibold text-warning">
                <Clock className="size-icon-sm" aria-hidden="true" />
                {t('candidate.inProgress')}
              </span>
              <h2 id={`ongoing-${exam.id}`} className="text-h1 [overflow-wrap:anywhere]">{exam.title}</h2>
              <span className="text-secondary">
                {t('candidate.counts', {
                  subjectOne: t('candidate.items', { count: exam.item_counts.subject_1 }),
                  subjectTwo: t('candidate.problems', { count: exam.item_counts.subject_2 }),
                })}
                {' · '}
                {t('candidate.startedAt', { time: dayAndTime(attempt.started_at, i18n.resolvedLanguage).time })}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex min-h-hit items-center gap-2 rounded-full border border-strong px-4" role="timer" aria-label={t('candidate.timeLeft', { time: left })}>
                <Clock className="size-icon-md" aria-hidden="true" />
                <span className="font-mono text-timer">{left}</span>
              </span>
              <Link to={`/candidate/attempts/${attempt.id}`} className={primaryLink}>
                {t('candidate.resume')}
                <ArrowRight className="size-icon-sm" aria-hidden="true" />
              </Link>
            </div>
          </section>
        )
      })}

      {cards.length > 0 && (
        <section aria-labelledby="your-exams" className="grid gap-4">
          <h2 id="your-exams" className="text-h2">{t('candidate.yourExams', { count: cards.length })}</h2>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {cards.map((exam) => <ExamCard key={exam.id} exam={exam} busy={starting} onStart={start} />)}
          </div>
        </section>
      )}

      {emptyState}

      {joining && <JoinClassDialog onClose={() => setJoining(false)} onJoined={joined} />}
    </main>
  )
}
