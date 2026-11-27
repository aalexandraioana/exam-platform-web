import { Check, CircleAlert, Info } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { matchCount, type ExamItem, type ItemInput } from '../../../api/exams'
import { DIFFICULTIES, SECTIONS, typesFor, type Competence, type Difficulty, type QuestionType, type Ref, type Section } from '../../../api/questions'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import DialogActions from '../../../components/DialogActions'
import Modal from '../../../components/Modal'
import SelectField from '../../../components/SelectField'
import TextField from '../../../components/TextField'

const COUNT_DELAY_MS = 400
const strong = { strong: <strong /> }

interface Props {
  examId: number
  grade: number | null
  item: ExamItem | null
  pools: Ref[]
  competences: Competence[]
  topics: Ref[]
  onClose: () => void
  onSave: (input: ItemInput) => Promise<void>
  onDelete: () => Promise<void>
}

/** D-062: every Subject II problem is worth 20 points. */
const SUBJECT_TWO_POINTS = 20

// DS-008 Item editor (D-057): the criteria, with a live count of the Ready questions they match.
export default function ItemDialog({ examId, grade, item, pools, competences, topics, onClose, onSave, onDelete }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    section: item?.section ?? ('subject_1' as Section),
    points: item?.section === 'subject_2' ? String(SUBJECT_TWO_POINTS) : item?.points ? String(item.points) : '',
    pool_id: item?.pool ? String(item.pool.id) : '',
    competence_id: item?.competence ? String(item.competence.id) : '',
    difficulty: (item?.difficulty ?? '') as Difficulty | '',
    type: (item?.type ?? '') as QuestionType | '',
    topic_id: item?.topic ? String(item.topic.id) : '',
  })
  const [count, setCount] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  const input: ItemInput = {
    section: form.section,
    points: form.points.trim() ? Number(form.points.replace(',', '.')) : null,
    pool_id: form.pool_id ? Number(form.pool_id) : null,
    competence_id: form.competence_id ? Number(form.competence_id) : null,
    difficulty: form.difficulty || null,
    type: form.type || null,
    topic_id: form.topic_id ? Number(form.topic_id) : null,
  }
  const complete = Boolean(input.pool_id && input.competence_id && input.difficulty)
  const request = JSON.stringify(input)

  useEffect(() => {
    if (!complete) return
    let active = true
    const timer = setTimeout(() => {
      matchCount(examId, JSON.parse(request)).then((n) => active && setCount(n), () => active && setCount(null))
    }, COUNT_DELAY_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [examId, request, complete])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setFailed(false)
    try {
      await action()
      onClose()
    } catch {
      setBusy(false)
      setFailed(true)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    run(() => onSave(input))
  }

  const gradeName = grade ? t(`bank.grade.${grade}`) : ''

  return (
    <Modal title={item ? t('exams.itemLabel', { n: item.position }) : t('exams.itemNew')} onClose={onClose}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <div className="grid gap-3 tablet:grid-cols-2">
          <SelectField id="item-section" label={t('exams.section')} value={form.section} onChange={(e) => { const s = e.target.value as Section; setForm((f) => ({ ...f, section: s, type: '', points: s === 'subject_2' ? String(SUBJECT_TWO_POINTS) : f.section === 'subject_2' ? '' : f.points })) }}>
            {SECTIONS.map((s) => <option key={s} value={s}>{t(`bank.section.${s}`)}</option>)}
          </SelectField>
          <TextField id="item-points" label={t('exams.pointsLabel')} inputMode="decimal" className="font-mono" value={form.points} readOnly={form.section === 'subject_2'} help={form.section === 'subject_2' ? t('exams.subjectTwoPoints', { count: SUBJECT_TWO_POINTS }) : undefined} onChange={(e) => set('points', e.target.value)} />
        </div>
        <SelectField id="item-pool" label={t('exams.pool')} value={form.pool_id} onChange={(e) => set('pool_id', e.target.value)}>
          <option value="">{t('exams.choose')}</option>
          {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <SelectField id="item-competence" label={t('exams.competence')} value={form.competence_id} onChange={(e) => set('competence_id', e.target.value)}>
          <option value="">{t('exams.choose')}</option>
          {competences.map((c) => <option key={c.id} value={c.id}>{`${c.code} · ${c.description}`}</option>)}
        </SelectField>
        <div className="grid gap-3 tablet:grid-cols-2">
          <SelectField id="item-difficulty" label={t('exams.difficulty')} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty | '')}>
            <option value="">{t('exams.choose')}</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`bank.difficulty.${d}`)}</option>)}
          </SelectField>
          <SelectField id="item-type" label={t('exams.type')} value={form.type} onChange={(e) => set('type', e.target.value as QuestionType | '')}>
            <option value="">{t('exams.anyTypeOption')}</option>
            {typesFor(form.section).map((ty) => <option key={ty} value={ty}>{t(`bank.type.${ty}`)}</option>)}
          </SelectField>
        </div>
        <SelectField id="item-topic" label={t('exams.topic')} value={form.topic_id} onChange={(e) => set('topic_id', e.target.value)}>
          <option value="">{t('exams.anyTopicOption')}</option>
          {topics.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
        </SelectField>

        <div aria-live="polite">
          {!complete || count === null ? (
            <Alert variant="info" icon={Info}>{t('exams.countNeeds')}</Alert>
          ) : count > 0 ? (
            <Alert variant="success" icon={Check}>
              <Trans i18nKey="exams.countSome" count={count} values={{ grade: gradeName }} components={strong} />
            </Alert>
          ) : (
            <Alert variant="error" icon={CircleAlert}>
              <Trans i18nKey="exams.countNone" components={strong} />
            </Alert>
          )}
        </div>
        {failed && <p role="alert" className="text-caption text-error">{t('exams.failed')}</p>}

        <DialogActions>
          {item && (
            <Button variant="danger" className="col-span-2" disabled={busy} onClick={() => run(onDelete)}>
              {t('exams.deleteItem')}
            </Button>
          )}
          <Button onClick={onClose}>{t('exams.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{t('exams.saveItem')}</Button>
        </DialogActions>
      </form>
    </Modal>
  )
}
