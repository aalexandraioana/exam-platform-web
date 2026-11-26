import { ArrowLeft, ArrowRight, Check, CircleAlert, Clock, EyeOff, Info, List, TriangleAlert, WifiOff, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { getAttempt, submitAttempt, type Attempt } from '../../api/attempts'
import { ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { focusRing } from '../../components/styles'
import EndScreen from './exam/EndScreen'
import ItemView from './exam/ItemView'
import Navigator from './exam/Navigator'
import SubmitDialog from './exam/SubmitDialog'
import { isAnswered, useAnswers } from './exam/useAnswers'
import { useCountdown } from './exam/useCountdown'
import { clock } from './format'

const strong = { strong: <strong /> }
const FIVE_MINUTES = 5 * 60_000
const ONE_MINUTE = 60_000
const hiddenKey = (id: number) => `exam-timer-hidden-${id}`

function storedHidden(id: number): boolean {
  try {
    return localStorage.getItem(hiddenKey(id)) === '1'
  } catch {
    return false
  }
}

// DS-004 · the exam room, reading and answering (P7b): one item per screen (Q-072), kept in the
// address (?item=3) so a refresh stays on it. P7c: the countdown on the server's clock (D-004),
// the notices, submitting, and at 0 the waiting answers are sent and the Attempt submitted; the
// server seals it anyway (D-044). Keeping unsent answers on the device comes in P7d.
export default function ExamRoomPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const attemptId = Number(useParams().id)
  const [params, setParams] = useSearchParams()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [offset, setOffset] = useState(0)
  const [end, setEnd] = useState<{ attempt: Attempt; sealed: boolean } | null>(null)
  const [ending, setEnding] = useState(false)
  const [hidden, setHidden] = useState(() => storedHidden(attemptId))
  const [dialog, setDialog] = useState<{ unsaved: number[]; busy: boolean; failed: boolean } | null>(null)
  const endingStarted = useRef(false)
  const [photoCounts, setPhotoCounts] = useState<Record<number, number>>({})
  const [photoClosed, setPhotoClosed] = useState(false)
  const saving = useAnswers(attemptId, attempt?.items ?? null)
  const left = useCountdown(attempt && !end ? attempt.expires_at : null, offset)

  useEffect(() => {
    let active = true
    getAttempt(attemptId).then(
      (loaded) => {
        if (!active) return
        setOffset(Date.parse(loaded.server_time) - Date.now())
        setPhotoCounts(Object.fromEntries(loaded.items.map((i) => [i.position, i.images?.length ?? 0])))
        setAttempt(loaded)
        if (loaded.status === 'submitted' || loaded.status === 'graded') setEnd({ attempt: loaded, sealed: loaded.auto_submitted })
      },
      (error) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 404) navigate('/candidate', { replace: true })
        else setFailed(true)
      },
    )
    return () => {
      active = false
    }
  }, [attemptId, reload, navigate])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [])

  // At 0: the inputs lock, the waiting answers are sent, then the Attempt is submitted. Offline,
  // the server seals it at its deadline with what it has (D-044).
  useEffect(() => {
    if (!attempt || end || left > 0 || endingStarted.current) return
    endingStarted.current = true
    setEnding(true)
    void (async () => {
      // Within the Grace Period (D-004) the waiting answers keep being sent (P7d).
      const until = Date.parse(attempt.accepts_answers_until ?? attempt.expires_at)
      let unsaved = await saving.flushAll()
      while (unsaved.length > 0 && Date.now() + offset < until) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        unsaved = await saving.retryAll()
      }
      const submitted = await submitAttempt(attemptId).catch(() => null)
      setEnd({ attempt: submitted ?? { ...attempt, submitted_at: attempt.expires_at }, sealed: true })
    })()
  }, [attempt, end, left, attemptId, saving, offset])

  // The Attempt has ended: the device copy of its answers is no longer needed (P7d).
  const { clearDevice } = saving
  const countPhotos = useCallback((position: number, count: number) => setPhotoCounts((all) => (all[position] === count ? all : { ...all, [position]: count })), [])
  const closePhotos = useCallback(() => setPhotoClosed(true), [])
  useEffect(() => {
    if (end) clearDevice()
  }, [end, clearDevice])

  // A save refused as too late (or the Attempt submitted elsewhere): show how it ended.
  useEffect(() => {
    if (!(saving.closed || photoClosed) || end || !attempt) return
    getAttempt(attemptId).then(
      (loaded) => setEnd({ attempt: loaded, sealed: loaded.auto_submitted || loaded.status !== 'submitted' }),
      () => setEnd({ attempt: { ...attempt, submitted_at: attempt.expires_at }, sealed: true }),
    )
  }, [saving.closed, photoClosed, end, attempt, attemptId])

  if (!attempt) {
    return (
      <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 py-6 tablet:px-6">
        {failed ? (
          <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
            <Trans i18nKey="room.loadFailed" components={strong} />
          </Alert>
        ) : (
          <div aria-busy="true" aria-label={t('room.loading')} className="grid gap-6 desktop:grid-cols-3">
            <div className="hidden gap-3 rounded-lg border border-subtle bg-surface p-4 desktop:grid">
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none" />
              <div className="h-24 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none" />
            </div>
            <div className="grid gap-3 rounded-lg border border-subtle bg-surface p-6 desktop:col-span-2">
              {['w-1/5', 'w-full', 'w-4/5', 'w-full', 'w-full'].map((w, i) => <div key={i} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
            </div>
          </div>
        )}
      </main>
    )
  }

  if (end) return <EndScreen attempt={end.attempt} sealed={end.sealed} />

  const items = attempt.items
  const requested = Number(params.get('item'))
  const index = Math.max(0, items.findIndex((item) => item.position === requested))
  const item = items[index]
  const locked = ending || saving.closed
  // P6d: a problem with photos but no text counts as answered.
  const done = (position: number) => isAnswered(saving.answers[position]) || (photoCounts[position] ?? 0) > 0
  const answered = items.filter((i) => done(i.position)).length
  const points = items.reduce((sum, i) => sum + i.points, 0)

  function go(position: number) {
    saving.flush(item.position)
    setSheetOpen(false)
    setParams({ item: String(position) })
  }

  const low = left <= FIVE_MINUTES

  function toggleHidden(next: boolean) {
    setHidden(next)
    try {
      if (next) localStorage.setItem(hiddenKey(attemptId), '1')
      else localStorage.removeItem(hiddenKey(attemptId))
    } catch {
      // remembered for this page only
    }
  }

  async function submit() {
    setDialog({ unsaved: [], busy: true, failed: false })
    const unsaved = await saving.flushAll()
    if (unsaved.length > 0) return setDialog({ unsaved, busy: false, failed: false })
    try {
      const submitted = await submitAttempt(attemptId)
      setEnd({ attempt: submitted, sealed: submitted.auto_submitted })
    } catch {
      setDialog({ unsaved: [], busy: false, failed: true })
    }
  }

  async function retryUnsaved() {
    setDialog((d) => d && { ...d, busy: true })
    const unsaved = await saving.retryAll()
    setDialog({ unsaved, busy: false, failed: false })
  }

  let status = null
  if (saving.offline) status = <span className="inline-flex items-center gap-2 text-warning"><WifiOff className="size-icon-sm" aria-hidden="true" />{t('room.offlineStatus', { count: saving.waitingCount })}</span>
  else if (saving.state === 'saving') status = <span>{t('room.saving')}</span>
  else if (saving.state === 'failed') status = <span className="inline-flex items-center gap-2 text-warning"><CircleAlert className="size-icon-sm" aria-hidden="true" />{t('room.unsaved')}</span>
  else if (saving.state === 'saved' && saving.savedAt) {
    const seconds = Math.max(0, Math.round((now - saving.savedAt) / 1000))
    status = (
      <span className="inline-flex items-center gap-2">
        <Check className="size-icon-sm" aria-hidden="true" />
        {seconds < 60 ? t('room.savedSeconds', { count: seconds }) : t('room.savedMinutes', { count: Math.floor(seconds / 60) })}
      </span>
    )
  }

  const navigator = (inSheet = false) => (
    <Navigator items={items} answers={saving.answers} current={item.position} onJump={go} inSheet={inSheet} isDone={done} />
  )
  const previous = items[index - 1]
  const next = items[index + 1]

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-subtle bg-surface px-4 py-3 tablet:px-6">
        <div className="grid min-w-0">
          <span className="text-h3 [overflow-wrap:anywhere]">{attempt.exam.title}</span>
          <span className="hidden text-caption text-secondary tablet:block">
            {[attempt.exam.max_attempts && t('room.attemptOf', { number: attempt.attempt_number, max: attempt.exam.max_attempts }), t('room.summary', { count: items.length, points })].filter(Boolean).join(' · ')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" className="text-caption text-secondary">{status}</span>
          {!hidden && (
            <span role="timer" aria-label={t('room.timeLeft', { time: clock(left) })} className={`inline-flex min-h-hit items-center gap-2 rounded-full border px-4 ${low ? 'border-warning bg-warning-bg text-warning' : 'border-strong text-primary'}`}>
              {low ? <TriangleAlert className="size-icon-md" aria-hidden="true" /> : <Clock className="size-icon-md" aria-hidden="true" />}
              <span className="font-mono text-timer tabular-nums">{clock(left)}</span>
            </span>
          )}
          {hidden ? (
            <Button onClick={() => toggleHidden(false)}>
              <Clock className="size-icon-sm" aria-hidden="true" />
              {t('room.show')}
            </Button>
          ) : (
            <button type="button" aria-label={t('room.hideLabel')} onClick={() => toggleHidden(true)} className={`inline-flex min-h-hit items-center gap-2 rounded-md px-2 font-medium text-accent ${focusRing}`}>
              <EyeOff className="size-icon-sm" aria-hidden="true" />
              <span className="hidden tablet:inline">{t('room.hide')}</span>
            </button>
          )}
          <Button className="desktop:hidden" onClick={() => setSheetOpen(true)}>
            <List className="size-icon-sm" aria-hidden="true" />
            {t('room.itemsButton', { answered, total: items.length })}
          </Button>
          <Button variant="primary" disabled={locked} onClick={() => setDialog({ unsaved: [], busy: false, failed: false })}>{t('room.submit')}</Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 py-6 tablet:px-6 desktop:grid-cols-3 desktop:items-start">
        <div className="hidden desktop:grid">{navigator()}</div>

        <div className="grid gap-4 desktop:col-span-2">
          {saving.offline && !locked && (
            <Alert variant="warning" icon={WifiOff} role="alert"><Trans i18nKey="room.offline" components={strong} /></Alert>
          )}
          {saving.failed.length > 0 && !saving.offline && !locked && (
            <Alert variant="error" icon={CircleAlert} role="alert" action={<Button onClick={saving.retry}>{t('errors.retry')}</Button>}>
              <Trans i18nKey="room.notSaved" values={{ number: saving.failed[0] }} components={strong} />
            </Alert>
          )}
          {left <= ONE_MINUTE ? (
            <Alert variant="warning" icon={Clock} role="alert"><Trans i18nKey="room.lowOne" components={strong} /></Alert>
          ) : low && (
            <Alert variant="warning" icon={Clock} role="alert"><Trans i18nKey="room.lowFive" components={strong} /></Alert>
          )}
          {hidden && <Alert variant="info" icon={Info} role="status">{t('room.hidden')}</Alert>}

          <div className="flex items-center gap-3 font-medium text-secondary">
            <span>{t(item.section === 'subject_1' ? 'room.subjectOne' : 'room.subjectTwo')}</span>
            <span className="flex-1 border-t border-subtle" aria-hidden="true" />
          </div>

          {saving.answers[item.position] && (
            <ItemView
              key={item.position}
              item={item}
              answer={saving.answers[item.position]}
              disabled={locked}
              onChange={(change, typed) => saving.change(item.position, change, typed)}
              onLeave={() => saving.flush(item.position)}
              photos={attempt.photos_enabled ? { attemptId, onCount: countPhotos, onClosed: closePhotos } : undefined}
            />
          )}

          <div className="flex flex-wrap justify-between gap-3">
            {previous ? (
              <Button onClick={() => go(previous.position)}>
                <ArrowLeft className="size-icon-sm" aria-hidden="true" />
                {t('room.previous', { number: previous.position })}
              </Button>
            ) : <span />}
            {next && (
              <Button onClick={() => go(next.position)}>
                {t('room.next', { number: next.position })}
                <ArrowRight className="size-icon-sm" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {dialog && (
        <SubmitDialog
          answered={answered}
          total={items.length}
          unanswered={items.filter((i) => !done(i.position)).map((i) => i.position)}
          marked={items.filter((i) => saving.answers[i.position]?.marked).map((i) => i.position)}
          unsaved={dialog.unsaved}
          busy={dialog.busy}
          failed={dialog.failed}
          onBack={() => setDialog(null)}
          onSubmit={submit}
          onRetry={retryUnsaved}
        />
      )}

      {sheetOpen && (
        <Modal
          variant="sheet"
          title={t('room.navigator.title')}
          onClose={() => setSheetOpen(false)}
          titleAction={
            <Button iconOnly aria-label={t('room.navigator.close')} onClick={() => setSheetOpen(false)}>
              <X className="size-icon-md" aria-hidden="true" />
            </Button>
          }
        >
          {navigator(true)}
        </Modal>
      )}
    </>
  )
}
