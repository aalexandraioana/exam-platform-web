import { ArrowLeft, Eye, Info, Trash2, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { listClasses } from '../../api/classes'
import {
  addItem,
  createExam,
  deleteExam,
  deleteItem,
  getExam,
  publishExam,
  reorderItems,
  updateExam,
  updateItem,
  type Exam,
  type ExamItem,
  type ExamPatch,
} from '../../api/exams'
import { listCompetences, listPools, listTopics, type Competence, type Ref } from '../../api/questions'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import { linkClass } from '../../components/styles'
import BlueprintList from './exams/BlueprintList'
import ChecksCard from './exams/ChecksCard'
import { formatDateTime } from './exams/format'
import ItemDialog from './exams/ItemDialog'
import PreviewView from './exams/PreviewView'
import SettingsCard from './exams/SettingsCard'

const strong = { strong: <strong /> }
const SAVE_DELAY_MS = 600

type SaveState = 'idle' | 'saving' | 'saved' | 'failed'
type Dialog = { kind: 'item'; item: ExamItem | null } | { kind: 'publish' } | { kind: 'delete' }

// DS-008: one exam's settings (saved automatically), blueprint, checks, preview and publication
// (D-005, D-012, D-015, D-021, D-057; Q-060, Q-061). `/examiner/exams/new` creates the exam once
// its title is written.
export default function ExamBuilderPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id: param } = useParams()
  const creating = param === 'new'
  const id = creating ? null : Number(param)

  const [exam, setExam] = useState<Exam | null>(null)
  const [classes, setClasses] = useState<Ref[]>([])
  const [pools, setPools] = useState<Ref[]>([])
  const [competences, setCompetences] = useState<Competence[]>([])
  const [topics, setTopics] = useState<Ref[]>([])
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [save, setSave] = useState<SaveState>('idle')
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([listClasses(), listPools(), listCompetences(), listTopics()]).then(
      ([c, p, comp, tp]) => {
        if (!active) return
        setClasses(c.map((x) => ({ id: x.id, name: x.name })))
        setPools(p)
        setCompetences(comp)
        setTopics(tp)
      },
      () => undefined,
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (id === null) return
    let active = true
    getExam(id).then(
      (e) => active && setExam(e),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [id, reload])

  // Autosave: changes wait a moment and go together in one PATCH.
  const pending = useRef<ExamPatch>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flush = useCallback(async () => {
    if (id === null) return
    const patch = pending.current
    pending.current = {}
    setSave('saving')
    try {
      setExam(await updateExam(id, patch))
      setSave('saved')
    } catch {
      setSave('failed')
    }
  }, [id])
  const queue = useCallback(
    (patch: ExamPatch) => {
      pending.current = { ...pending.current, ...patch }
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush],
  )
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  if (creating) return <NewExam />

  const back = (
    <Link to="/examiner/exams" className={`${linkClass} inline-flex items-center gap-1 text-caption`}>
      <ArrowLeft className="size-icon-sm" aria-hidden="true" />
      {t('exams.back')}
    </Link>
  )
  const shell = 'mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8'

  if (!exam) {
    return (
      <main className={shell}>
        {back}
        {failed ? (
          <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
            <Trans i18nKey="exams.loadExamFailed" components={strong} />
          </Alert>
        ) : (
          <div aria-busy="true" aria-label={t('exams.loading')} className="grid gap-4">
            {['w-1/2', 'w-4/5', 'w-3/5'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
        )}
      </main>
    )
  }

  const published = exam.status === 'published'
  const classNames = exam.classes.map((c) => c.name).join(', ')

  async function move(item: ExamItem, by: -1 | 1) {
    const ids = exam!.items.map((i) => i.id)
    const index = ids.indexOf(item.id)
    ;[ids[index], ids[index + by]] = [ids[index + by], ids[index]]
    try {
      setExam(await reorderItems(exam!.id, ids))
    } catch {
      setSave('failed')
    }
  }

  return (
    <main className={shell}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          {back}
          <h1 className="text-display [overflow-wrap:anywhere]">{exam.title}</h1>
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <span className={`rounded-full px-2 text-caption font-semibold ${published ? 'bg-success-bg text-success' : 'bg-surface-subtle text-secondary'}`}>
              {t(`exams.status.${exam.status}`)}
            </span>
            {published && exam.published_at && <span className="text-caption text-secondary">{t('exams.publishedOn', { date: formatDateTime(exam.published_at, i18n.resolvedLanguage) })}</span>}
            {save === 'saving' && <span className="text-caption text-secondary">{t('exams.saving')}</span>}
            {save === 'saved' && <span className="text-caption text-secondary">{t('exams.saved')}</span>}
            {save === 'failed' && <span className="text-caption text-error">{t('exams.saveFailed')}</span>}
          </div>
        </div>
        {!preview && (
          <div className="flex flex-wrap gap-2">
            {!published && (
              <Button className="border-transparent text-error" onClick={() => setDialog({ kind: 'delete' })}>
                <Trash2 className="size-icon-sm" aria-hidden="true" />
                {t('exams.deleteDraft')}
              </Button>
            )}
            <Button onClick={() => setPreview(true)}>
              <Eye className="size-icon-sm" aria-hidden="true" />
              {t('exams.preview')}
            </Button>
            {!published && (
              <Button variant="primary" disabled={exam.checks.problems.length > 0} aria-describedby={exam.checks.problems.length > 0 ? 'publish-why' : undefined} onClick={() => setDialog({ kind: 'publish' })}>
                {t('exams.publish')}
              </Button>
            )}
          </div>
        )}
      </div>

      {preview ? (
        <PreviewView examId={exam.id} onClose={() => setPreview(false)} />
      ) : (
        <>
          {published ? (
            <Alert variant="info" icon={Info} role="status">
              <Trans i18nKey="exams.publishedNotice" values={{ classes: classNames }} components={strong} />
            </Alert>
          ) : (
            <ChecksCard exam={exam} />
          )}
          <SettingsCard key={`${exam.id}-${exam.status}`} exam={exam} classes={classes} onChange={queue} />
          <BlueprintList exam={exam} onAdd={() => setDialog({ kind: 'item', item: null })} onEdit={(item) => setDialog({ kind: 'item', item })} onMove={move} />
        </>
      )}

      {dialog?.kind === 'item' && (
        <ItemDialog
          examId={exam.id}
          grade={exam.grade_level}
          item={dialog.item}
          pools={pools}
          competences={competences}
          topics={topics}
          onClose={() => setDialog(null)}
          onSave={async (input) => setExam(dialog.item ? await updateItem(exam.id, dialog.item.id, input) : await addItem(exam.id, input))}
          onDelete={async () => setExam(await deleteItem(exam.id, dialog.item!.id))}
        />
      )}
      {dialog?.kind === 'publish' && (
        <ConfirmDialog
          title={t('exams.publishTitle', { title: exam.title })}
          text={t('exams.publishText', {
            classes: classNames,
            when: exam.available_from ? t('exams.whenFrom', { date: formatDateTime(exam.available_from, i18n.resolvedLanguage) }) : t('exams.whenNow'),
          })}
          confirm={t('exams.publishConfirm')}
          variant="primary"
          onClose={() => setDialog(null)}
          onConfirm={async () => setExam(await publishExam(exam.id))}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t('exams.deleteTitle', { title: exam.title })}
          text={t('exams.deleteText')}
          confirm={t('exams.deleteConfirm')}
          variant="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteExam(exam.id)
            navigate('/examiner/exams', { replace: true })
          }}
        />
      )}
    </main>
  )
}

function ConfirmDialog({ title, text, confirm, variant, onClose, onConfirm }: { title: string; text: string; confirm: string; variant: 'primary' | 'danger'; onClose: () => void; onConfirm: () => Promise<void> }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setFailed(false)
    try {
      await onConfirm()
      onClose()
    } catch {
      setBusy(false)
      setFailed(true)
    }
  }

  return (
    <Modal role="alertdialog" title={title} onClose={onClose}>
      <p className="text-secondary">{text}</p>
      {failed && <p role="alert" className="text-caption text-error">{t('exams.failed')}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onClose}>{t('exams.cancel')}</Button>
        <Button variant={variant} onClick={run} disabled={busy}>
          {variant === 'danger' && <Trash2 className="size-icon-sm" aria-hidden="true" />}
          {confirm}
        </Button>
      </div>
    </Modal>
  )
}

// DS-008 "Examen nou": the exam is created once its title is written, then the builder opens.
function NewExam() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const trimmed = title.trim()
    if (!trimmed) return
    let active = true
    const timer = setTimeout(() => {
      createExam(trimmed).then(
        (exam) => active && navigate(`/examiner/exams/${exam.id}`, { replace: true }),
        () => active && setFailed(true),
      )
    }, SAVE_DELAY_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [title, navigate])

  return (
    <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="grid gap-2">
        <Link to="/examiner/exams" className={`${linkClass} inline-flex items-center gap-1 text-caption`}>
          <ArrowLeft className="size-icon-sm" aria-hidden="true" />
          {t('exams.back')}
        </Link>
        <h1 className="text-display">{t('exams.newTitle')}</h1>
      </div>
      <section className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
        <TextField id="exam-title" label={t('exams.titleLabel')} placeholder={t('exams.titlePlaceholder')} maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} help={t('exams.titleHelp')} error={failed ? t('exams.createFailed') : undefined} />
      </section>
      <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
        <h2 className="text-h2">{t('exams.noItemsTitle')}</h2>
        <p className="text-secondary">{t('exams.noItemsText')}</p>
        <Button variant="primary" disabled aria-describedby="exam-title-help">{t('exams.addFirstItem')}</Button>
      </div>
    </main>
  )
}
