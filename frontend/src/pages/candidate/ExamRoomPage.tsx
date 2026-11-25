import { ArrowLeft, ArrowRight, Check, CircleAlert, Info, List, WifiOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { getAttempt, type Attempt } from '../../api/attempts'
import { ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { focusRing } from '../../components/styles'
import ItemView from './exam/ItemView'
import Navigator from './exam/Navigator'
import { isAnswered, useAnswers } from './exam/useAnswers'

const strong = { strong: <strong /> }
const secondaryLink = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border border-strong bg-surface px-4 py-2 font-medium text-primary no-underline hover:bg-surface-subtle ${focusRing}`

// DS-004 · the exam room, reading and answering (P7b): one item per screen (Q-072), kept in the
// address (?item=3) so a refresh stays on it. The timer and submitting come in P7c; keeping
// unsent answers on the device in P7d.
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
  const saving = useAnswers(attemptId, attempt?.items ?? null)

  useEffect(() => {
    let active = true
    getAttempt(attemptId).then(
      (loaded) => active && setAttempt(loaded),
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

  const items = attempt.items
  const requested = Number(params.get('item'))
  const index = Math.max(0, items.findIndex((item) => item.position === requested))
  const item = items[index]
  const locked = saving.closed || attempt.status === 'submitted' || attempt.status === 'graded'
  const answered = items.filter((i) => isAnswered(saving.answers[i.position])).length
  const points = items.reduce((sum, i) => sum + i.points, 0)

  function go(position: number) {
    saving.flush(item.position)
    setSheetOpen(false)
    setParams({ item: String(position) })
  }

  let status = null
  if (saving.state === 'saving') status = <span>{t('room.saving')}</span>
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
    <Navigator items={items} answers={saving.answers} current={item.position} onJump={go} inSheet={inSheet} />
  )
  const previous = items[index - 1]
  const next = items[index + 1]

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-subtle bg-surface px-4 py-3 tablet:px-6">
        <div className="grid min-w-0">
          <span className="text-h3 [overflow-wrap:anywhere]">{attempt.exam.title}</span>
          <span className="hidden text-caption text-secondary tablet:block">{t('room.summary', { count: items.length, points })}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" className="text-caption text-secondary">{status}</span>
          <Button className="desktop:hidden" onClick={() => setSheetOpen(true)}>
            <List className="size-icon-sm" aria-hidden="true" />
            {t('room.itemsButton', { answered, total: items.length })}
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 py-6 tablet:px-6 desktop:grid-cols-3 desktop:items-start">
        <div className="hidden desktop:grid">{navigator()}</div>

        <div className="grid gap-4 desktop:col-span-2">
          {saving.failed.length > 0 && !locked && (
            <Alert variant="error" icon={CircleAlert} role="alert" action={<Button onClick={saving.retry}>{t('errors.retry')}</Button>}>
              <Trans i18nKey="room.notSaved" values={{ number: saving.failed[0] }} components={strong} />
            </Alert>
          )}
          {locked && (
            <Alert variant="info" icon={Info} role="status" action={<Link to="/candidate" className={secondaryLink}>{t('room.toDashboard')}</Link>}>
              <Trans i18nKey="room.closed" components={strong} />
            </Alert>
          )}

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
