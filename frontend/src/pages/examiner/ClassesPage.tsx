import { Check, CircleAlert, Copy, LoaderCircle, Plus, Users, WifiOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import {
  createClass,
  decideRequest,
  getClass,
  listClasses,
  newJoinCode,
  renameClass,
  type ClassCandidate,
  type ClassDetail,
  type JoinRequest,
  type SchoolClass,
} from '../../api/classes'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import { focusRing } from '../../components/styles'

const strong = { strong: <strong /> }
const card = 'rounded-lg border border-subtle bg-surface shadow-subtle'

type Decision = 'accept' | 'decline'
type Dialog = { kind: 'new' } | { kind: 'rename' }

// DS-013: the Examiner's classes (D-015, D-028), join requests and the roster. New passwords are
// the Administrator's (D-054, DS-011). The selected class is in the URL (?class=<id>).
export default function ClassesPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [classes, setClasses] = useState<SchoolClass[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [failed, setFailed] = useState<{ request: JoinRequest; decision: Decision } | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)

  const requestedId = Number(params.get('class')) || null
  const selectedId = classes?.some((c) => c.id === requestedId) ? requestedId : (classes?.[0]?.id ?? null)

  // Bumped to load again (retry, after a decision); the effects below only fetch.
  const [classesKey, setClassesKey] = useState(0)
  const [detailKey, setDetailKey] = useState(0)

  useEffect(() => {
    let active = true
    listClasses().then(
      (list) => active && setClasses(list),
      () => active && setLoadFailed(true),
    )
    return () => {
      active = false
    }
  }, [classesKey])

  useEffect(() => {
    if (selectedId === null) return
    let active = true
    getClass(selectedId).then(
      (next) => {
        if (!active) return
        setDetail(next)
        setClasses((list) => list?.map((c) => (c.id === next.class.id ? next.class : c)) ?? list)
      },
      () => active && setLoadFailed(true),
    )
    return () => {
      active = false
    }
  }, [selectedId, detailKey])

  function retryLoad() {
    setLoadFailed(false)
    if (classes) setDetailKey((key) => key + 1)
    else setClassesKey((key) => key + 1)
  }

  function select(id: number) {
    setFailed(null)
    setParams({ class: String(id) })
  }

  function replaceClass(updated: SchoolClass) {
    setClasses((list) => list?.map((c) => (c.id === updated.id ? updated : c)) ?? list)
    setDetail((current) => (current && current.class.id === updated.id ? { ...current, class: updated } : current))
  }

  async function decide(request: JoinRequest, decision: Decision) {
    setFailed(null)
    try {
      await decideRequest(request.id, decision)
      setDetailKey((key) => key + 1)
    } catch {
      setFailed({ request, decision })
    }
  }

  const selected = detail && detail.class.id === selectedId ? detail : null

  return (
    <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-display">{t('classes.title')}</h1>
        {classes && classes.length > 0 && (
          <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
            <Plus className="size-icon-sm" aria-hidden="true" />
            {t('classes.new')}
          </Button>
        )}
      </div>

      {loadFailed && (
        <Alert
          variant="error"
          icon={WifiOff}
          role="alert"
          action={
            <Button onClick={retryLoad}>
              {t('errors.retry')}
            </Button>
          }
        >
          <Trans i18nKey="errors.offline" components={strong} />
        </Alert>
      )}

      {failed && (
        <Alert
          variant="error"
          icon={CircleAlert}
          role="alert"
          action={<Button onClick={() => decide(failed.request, failed.decision)}>{t('errors.retry')}</Button>}
        >
          <Trans
            i18nKey={failed.decision === 'accept' ? 'classes.acceptFailed' : 'classes.declineFailed'}
            values={{ name: failed.request.candidate.name }}
            components={strong}
          />
        </Alert>
      )}

      {classes === null && !loadFailed && (
        <div role="status" className="grid justify-items-center gap-4 py-12 text-center">
          <LoaderCircle className="size-icon-lg animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
          <p className="text-body-medium">{t('classes.loading')}</p>
        </div>
      )}

      {classes && classes.length === 0 && <EmptyState onCreate={() => setDialog({ kind: 'new' })} />}

      {classes && classes.length > 0 && (
        <div className="grid items-start gap-4 desktop:grid-cols-3">
          <nav aria-label={t('classes.list')} className="grid gap-2">
            {classes.map((c) => (
              <ClassCard key={c.id} schoolClass={c} current={c.id === selectedId} onSelect={() => select(c.id)} />
            ))}
          </nav>
          {selected && (
            <div className="grid gap-4 desktop:col-span-2">
              <JoinCodeCard
                schoolClass={selected.class}
                onRename={() => setDialog({ kind: 'rename' })}
                onNewCode={async () => replaceClass(await newJoinCode(selected.class.id))}
              />
              <RequestsCard requests={selected.requests} onDecide={decide} />
              <Roster candidates={selected.candidates} />
            </div>
          )}
        </div>
      )}

      {dialog?.kind === 'new' && (
        <NameDialog
          title={t('classes.new')}
          submitLabel={t('classes.create')}
          help={t('classes.newHelp')}
          onClose={() => setDialog(null)}
          onSubmit={async (name) => {
            const created = await createClass(name)
            setClasses((list) => [...(list ?? []), created].sort((a, b) => a.name.localeCompare(b.name)))
            select(created.id)
          }}
        />
      )}
      {dialog?.kind === 'rename' && selected && (
        <NameDialog
          title={t('classes.renameTitle')}
          submitLabel={t('classes.save')}
          initial={selected.class.name}
          onClose={() => setDialog(null)}
          onSubmit={async (name) => replaceClass(await renameClass(selected.class.id, name))}
        />
      )}
    </main>
  )
}

function ClassCard({ schoolClass, current, onSelect }: { schoolClass: SchoolClass; current: boolean; onSelect: () => void }) {
  const { t } = useTranslation()
  const counts = `${t('classes.candidates', { count: schoolClass.candidate_count })} · ${t('classes.exams', { count: schoolClass.published_exam_count })}`
  return (
    <Link
      to={`?class=${schoolClass.id}`}
      aria-current={current ? 'true' : undefined}
      onClick={(event) => {
        event.preventDefault()
        onSelect()
      }}
      className={`grid gap-2 rounded-md border p-4 text-primary no-underline ${current ? 'border-focus bg-primary-subtle' : 'border-subtle bg-surface'} ${focusRing}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-h3 [overflow-wrap:anywhere]">{schoolClass.name}</span>
        {schoolClass.pending_count > 0 && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-warning-bg px-2 text-caption font-semibold text-warning">
            {t('classes.requests', { count: schoolClass.pending_count })}
          </span>
        )}
      </span>
      <span className="text-caption text-secondary">{counts}</span>
    </Link>
  )
}

function JoinCodeCard({ schoolClass, onRename, onNewCode }: { schoolClass: SchoolClass; onRename: () => void; onNewCode: () => Promise<void> }) {
  const { t } = useTranslation()
  const spelled = schoolClass.join_code.replace('-', '').split('').join(' ')
  return (
    <section aria-labelledby="class-heading" className={`${card} grid gap-4 p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="class-heading" className="text-h1 [overflow-wrap:anywhere]">
          {schoolClass.name}
        </h2>
        <button type="button" onClick={onRename} className={`min-h-hit rounded-md px-4 font-medium text-accent ${focusRing}`}>
          {t('classes.rename')}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-strong p-4">
        <div className="grid flex-1">
          <span className="text-caption text-secondary">{t('classes.joinCode')}</span>
          <span className="whitespace-nowrap font-mono text-h1 font-bold tracking-code" aria-label={t('classes.joinCodeLabel', { spelled })}>
            {schoolClass.join_code}
          </span>
        </div>
        <Button onClick={() => navigator.clipboard?.writeText(schoolClass.join_code)}>
          <Copy className="size-icon-sm" aria-hidden="true" />
          {t('classes.copy')}
        </Button>
        <Button onClick={() => onNewCode()}>{t('classes.newCode')}</Button>
      </div>
      <p className="text-caption text-secondary">{t('classes.joinHelp')}</p>
    </section>
  )
}

function RequestsCard({ requests, onDecide }: { requests: JoinRequest[]; onDecide: (request: JoinRequest, decision: Decision) => void }) {
  const { t, i18n } = useTranslation()
  if (requests.length === 0) {
    return (
      <section className={`${card} p-6`}>
        <p className="text-secondary">{t('classes.noRequests')}</p>
      </section>
    )
  }
  return (
    <section aria-labelledby="requests-heading" className={`${card} grid gap-4 p-6`}>
      <h2 id="requests-heading" className="text-h2">
        {t('classes.requestsTitle', { count: requests.length })}
      </h2>
      <ul className="grid">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle py-3">
            <span className="grid">
              <span className="font-medium">{request.candidate.name}</span>
              <span className="text-caption text-secondary [overflow-wrap:anywhere]">
                {request.candidate.email} · {timeAgo(request.requested_at, i18n.resolvedLanguage)}
              </span>
            </span>
            <span className="flex gap-3">
              <button
                type="button"
                aria-label={t('classes.declineLabel', { name: request.candidate.name })}
                onClick={() => onDecide(request, 'decline')}
                className={`min-h-hit rounded-md px-4 font-medium text-accent ${focusRing}`}
              >
                {t('classes.decline')}
              </button>
              <Button aria-label={t('classes.acceptLabel', { name: request.candidate.name })} onClick={() => onDecide(request, 'accept')}>
                <Check className="size-icon-sm" aria-hidden="true" />
                {t('classes.accept')}
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Roster({ candidates }: { candidates: ClassCandidate[] }) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = needle
    ? candidates.filter((c) => c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle))
    : candidates
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-GB' : 'ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const cell = 'border-b border-subtle px-4 py-3 align-top'
  const head = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'

  return (
    <section aria-labelledby="roster-heading" className={`${card} grid gap-4 pt-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6">
        <h2 id="roster-heading" className="text-h2">
          {t('classes.rosterTitle', { count: candidates.length })}
        </h2>
        {candidates.length > 0 && (
          <input
            type="search"
            aria-label={t('classes.search')}
            placeholder={t('classes.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`min-h-hit w-full rounded-md border border-input bg-surface px-3 py-2 text-primary placeholder:text-muted tablet:w-auto ${focusRing}`}
          />
        )}
      </div>
      {candidates.length === 0 || shown.length === 0 ? (
        <p className="px-6 pb-6 text-secondary">{t(candidates.length === 0 ? 'classes.noCandidates' : 'classes.noMatch')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={head}>{t('classes.colName')}</th>
                <th className={`${head} hidden tablet:table-cell`}>{t('classes.colEmail')}</th>
                <th className={`${head} hidden tablet:table-cell`}>{t('classes.colSince')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((candidate) => (
                <tr key={candidate.id}>
                  <td className={`${cell} [overflow-wrap:anywhere]`}>{candidate.name}</td>
                  <td className={`${cell} hidden [overflow-wrap:anywhere] tablet:table-cell`}>{candidate.email}</td>
                  <td className={`${cell} hidden tablet:table-cell`}>{date.format(new Date(candidate.joined_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
      <Users className="size-icon-lg text-muted" aria-hidden="true" />
      <h2 className="text-h2">{t('classes.emptyTitle')}</h2>
      <p className="text-secondary">{t('classes.emptyText')}</p>
      <Button variant="primary" onClick={onCreate}>
        <Plus className="size-icon-sm" aria-hidden="true" />
        {t('classes.createFirst')}
      </Button>
    </div>
  )
}

interface NameDialogProps {
  title: string
  submitLabel: string
  help?: string
  initial?: string
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

function NameDialog({ title, submitLabel, help, initial = '', onClose, onSubmit }: NameDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return setError(t('classes.nameRequired'))
    setBusy(true)
    try {
      await onSubmit(name.trim())
      onClose()
    } catch {
      setBusy(false)
      setError(t('errors.offlineShort'))
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <TextField
          id="class-name"
          label={t('classes.nameField')}
          placeholder={t('classes.namePlaceholder')}
          value={name}
          maxLength={255}
          onChange={(event) => setName(event.target.value)}
          error={error}
          help={help}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{t('classes.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function timeAgo(iso: string, language = 'ro'): string {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60_000)
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return format.format(hours, 'hour')
  return format.format(Math.round(hours / 24), 'day')
}
