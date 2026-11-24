import { Check, CircleAlert, CircleCheck, Info, LoaderCircle, Trash2, WifiOff, X } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ApiError } from '../../../api/client'
import {
  DIFFICULTIES,
  GRADES,
  SECTIONS,
  markDraft,
  markReady,
  publish,
  typesFor,
  updateQuestion,
  type Competence,
  type Problem,
  type Question,
  type QuestionType,
  type Ref,
  type Sample,
  type Section,
} from '../../../api/questions'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import SelectField, { selectClass } from '../../../components/SelectField'
import TextField from '../../../components/TextField'
import { focusRing } from '../../../components/styles'
import AnswerEditor from './AnswerEditor'
import BaremEditor from './BaremEditor'
import { defaultKey, emptyRow, formFrom, patchFrom, type QuestionForm } from './form'
import { problemText } from './problems'
import { ghostClass, TextAreaField } from './ui'
import ValuesEditor from './ValuesEditor'

export type ListKind = 'competence' | 'topic' | 'pool'
const NEW = '__new'
const strong = { strong: <strong /> }

type Notice = 'saved' | 'refused' | 'notReady' | 'saveFailed' | 'published' | 'alreadyPublished' | 'failed'

interface Props {
  question: Question
  competences: Competence[]
  topics: Ref[]
  pools: Ref[]
  onChanged: (question: Question) => void
  onDelete: () => void
  /** Opens the inline "new competence / topic / pool" dialog (Q-053); resolves with the new id. */
  onNewItem: (kind: ListKind) => Promise<number | null>
}

// DS-007 editor: every field an Item can match on (D-057, D-059), the answer, named values, the
// barem, Draft ↔ Ready (Q-057), publishing (D-040) and deleting (Q-056).
export default function QuestionEditor({ question, competences, topics, pools, onChanged, onDelete, onNewItem }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState<QuestionForm>(() => formFrom(question))
  const [problems, setProblems] = useState<Problem[]>(question.problems)
  const [notice, setNotice] = useState<{ kind: Notice; code?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [samples, setSamples] = useState<Sample[]>([])

  const set = <K extends keyof QuestionForm>(key: K, value: QuestionForm[K]) => setForm((f) => ({ ...f, [key]: value }))
  const ready = question.status === 'ready'
  const missing = (field: string) => problems.some((p) => p.code === 'required' && p.field === field)

  function changeSection(section: Section) {
    const type = typesFor(section)[0]
    setForm((f) => ({ ...f, section, type, answer_key: defaultKey(type), uses_barem: false }))
  }

  function changeType(type: QuestionType) {
    setForm((f) => ({ ...f, type, answer_key: defaultKey(type), values: type === 'dual_choice' ? null : f.values }))
  }

  async function pick(kind: ListKind, value: string, apply: (id: string) => void) {
    if (value !== NEW) return apply(value)
    const id = await onNewItem(kind)
    if (id !== null) apply(String(id))
  }

  async function act(action: () => Promise<Question>, success: Notice | null) {
    setBusy(true)
    setNotice(null)
    try {
      const saved = await action()
      setProblems(saved.problems)
      onChanged(saved)
      if (success) setNotice({ kind: success })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.fields.status?.[0] === 'not_ready') {
        setProblems((error.body.problems as Problem[] | undefined) ?? problems)
        setNotice({ kind: ready ? 'refused' : 'notReady' })
      } else {
        setNotice({ kind: 'saveFailed' })
      }
    } finally {
      setBusy(false)
    }
  }

  const save = () => act(() => updateQuestion(question.id, patchFrom(form)), 'saved')
  // Ready checks the saved question, so the editor's changes are saved first.
  const makeReady = () => act(async () => markReady((await updateQuestion(question.id, patchFrom(form))).id), 'saved')
  const makeDraft = () => act(() => markDraft(question.id), null)

  async function share() {
    setNotice(null)
    try {
      const entry = await publish(question.id)
      onChanged({ ...question, published: true })
      setNotice({ kind: 'published', code: entry.code })
    } catch (error) {
      setNotice({ kind: error instanceof ApiError && error.status === 409 ? 'alreadyPublished' : 'failed' })
    }
  }

  const options = form.answer_key.options ?? []
  const availablePools = pools.filter((p) => !form.pool_ids.includes(p.id))

  return (
    <section aria-labelledby="editor-heading" className="grid content-start gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle desktop:sticky desktop:top-16">
      <div className="flex items-center justify-between gap-3">
        <h2 id="editor-heading" className="text-h2 font-mono">
          {question.code}
        </h2>
        <span className={`rounded-full px-2 text-caption font-semibold ${ready ? 'bg-success-bg text-success' : 'bg-surface-subtle text-secondary'}`}>
          {t(`bank.status.${question.status}`)}
        </span>
      </div>

      {notice?.kind === 'saved' && (
        <Alert variant="success" icon={CircleCheck} role="status">
          {t('bank.saved')}
        </Alert>
      )}
      {(notice?.kind === 'refused' || notice?.kind === 'notReady') && (
        <Alert variant="error" icon={CircleAlert} role="alert">
          <Trans i18nKey={`bank.${notice.kind}`} components={strong} />
        </Alert>
      )}
      {notice?.kind === 'saveFailed' && (
        <Alert variant="error" icon={WifiOff} role="alert">
          <Trans i18nKey="bank.saveFailed" components={strong} />
        </Alert>
      )}
      {notice?.kind === 'published' && (
        <Alert variant="success" icon={CircleCheck} role="status">
          <Trans i18nKey="bank.publishedDone" values={{ code: notice.code }} components={strong} />
        </Alert>
      )}
      {(notice?.kind === 'alreadyPublished' || notice?.kind === 'failed') && (
        <Alert variant="error" icon={CircleAlert} role="alert">
          {t(notice.kind === 'failed' ? 'bank.failed' : 'bank.alreadyPublished')}
        </Alert>
      )}
      {!ready && (
        <Alert variant="info" icon={Info}>
          {t('bank.draftNote')}
        </Alert>
      )}

      <div className="grid gap-3 tablet:grid-cols-2">
        <SelectField id="q-section" label={t('bank.fieldSection')} value={form.section} onChange={(e) => changeSection(e.target.value as Section)}>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{t(`bank.section.${s}`)}</option>
          ))}
        </SelectField>
        <SelectField id="q-type" label={t('bank.fieldType')} value={form.type} onChange={(e) => changeType(e.target.value as QuestionType)}>
          {typesFor(form.section).map((type) => (
            <option key={type} value={type}>{t(`bank.type.${type}`)}</option>
          ))}
        </SelectField>
        <SelectField id="q-grade" label={t('bank.fieldGrade')} value={form.grade_level} onChange={(e) => set('grade_level', e.target.value)} error={missing('grade_level') ? problemText(t, { code: 'required', field: 'grade_level' }) : undefined}>
          <option value="">{t('bank.choose')}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>{t(`bank.grade.${g}`)}</option>
          ))}
        </SelectField>
        <SelectField id="q-difficulty" label={t('bank.fieldDifficulty')} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as QuestionForm['difficulty'])} error={missing('difficulty') ? problemText(t, { code: 'required', field: 'difficulty' }) : undefined}>
          <option value="">{t('bank.choose')}</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{t(`bank.difficulty.${d}`)}</option>
          ))}
        </SelectField>
        <div className="tablet:col-span-2">
          <SelectField
            id="q-competence"
            label={t('bank.fieldCompetence')}
            value={form.competence_id}
            onChange={(e) => pick('competence', e.target.value, (id) => set('competence_id', id))}
            error={missing('competence') ? problemText(t, { code: 'required', field: 'competence' }) : undefined}
            help={t('bank.newOptionHelp')}
          >
            <option value="">{t('bank.choose')}</option>
            {competences.map((c) => (
              <option key={c.id} value={c.id}>{`${c.code} · ${c.description}`}</option>
            ))}
            <option value={NEW}>{t('bank.newCompetence')}</option>
          </SelectField>
        </div>
        <div className="tablet:col-span-2">
          <SelectField
            id="q-topic"
            label={t('bank.fieldTopic')}
            value={form.topic_id}
            onChange={(e) => pick('topic', e.target.value, (id) => set('topic_id', id))}
            error={missing('topic') ? problemText(t, { code: 'required', field: 'topic' }) : undefined}
          >
            <option value="">{t('bank.chooseTopic')}</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
            <option value={NEW}>{t('bank.newTopic')}</option>
          </SelectField>
        </div>
        <TextField id="q-points" label={t('bank.fieldPoints')} inputMode="decimal" className="font-mono" value={form.points} onChange={(e) => set('points', e.target.value)} error={missing('points') ? problemText(t, { code: 'required', field: 'points' }) : undefined} />
      </div>

      <div className="grid gap-2">
        <span className="font-medium">{t('bank.pools')}</span>
        <div className="flex flex-wrap items-center gap-2">
          {form.pool_ids.map((id) => {
            const name = pools.find((p) => p.id === id)?.name ?? ''
            return (
              <button
                key={id}
                type="button"
                aria-label={t('bank.removeFromPool', { name })}
                onClick={() => set('pool_ids', form.pool_ids.filter((p) => p !== id))}
                className={`inline-flex min-h-hit items-center gap-1 rounded-full border border-focus bg-primary-subtle px-3 text-caption font-semibold text-accent ${focusRing}`}
              >
                {name}
                <X className="size-icon-sm" aria-hidden="true" />
              </button>
            )
          })}
          <select
            aria-label={t('bank.addToPool')}
            className={`${selectClass} w-auto`}
            value=""
            onChange={(e) => pick('pool', e.target.value, (id) => set('pool_ids', [...form.pool_ids, Number(id)]))}
          >
            <option value="">{t('bank.addToPool')}</option>
            {availablePools.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value={NEW}>{t('bank.newPool')}</option>
          </select>
        </div>
        <span className="text-caption text-secondary">{t('bank.poolsHelp')}</span>
      </div>

      <TextAreaField
        id="q-statement"
        label={t(form.type === 'dual_choice' ? 'bank.fieldStatementDual' : 'bank.fieldStatement')}
        className="font-mono"
        value={form.statement}
        onChange={(e) => set('statement', e.target.value)}
        error={missing('statement') ? problemText(t, { code: 'required', field: 'statement' }) : undefined}
      />

      {form.type !== 'dual_choice' && (
        <label className="flex min-h-hit items-center gap-2 font-medium">
          <input
            type="checkbox"
            className="size-icon-md accent-[var(--bg-primary)]"
            checked={form.values !== null}
            onChange={(e) => set('values', e.target.checked ? { rows: [emptyRow('p')], conditions: '', answer: '' } : null)}
          />
          {t('bank.values')}
        </label>
      )}
      {form.values && (
        <ValuesEditor type={form.type} statement={form.statement} options={options} value={form.values} onChange={(v) => set('values', v)} onSamples={setSamples} />
      )}

      {form.section === 'subject_1' ? (
        <AnswerEditor type={form.type} value={form.answer_key} onChange={(k) => set('answer_key', k)} hasValues={form.values !== null} sampleAnswer={samples[0]?.answer ?? null} />
      ) : (
        <div className="grid gap-2">
          <label className="flex min-h-hit items-center gap-2 font-medium">
            <input type="checkbox" className="size-icon-md accent-[var(--bg-primary)]" checked={form.uses_barem} onChange={(e) => set('uses_barem', e.target.checked)} />
            {t('bank.barem')}
          </label>
          {form.uses_barem ? (
            <BaremEditor steps={form.barem} points={form.points} onChange={(steps) => set('barem', steps)} />
          ) : (
            <span className="text-caption text-secondary">{t('bank.baremNoBarem')}</span>
          )}
        </div>
      )}

      <TextAreaField
        id="q-explanation"
        label={<>{t('bank.fieldExplanation')} <span className="font-normal text-secondary">{t('bank.optional')}</span></>}
        rows={3}
        value={form.explanation}
        onChange={(e) => set('explanation', e.target.value)}
        help={t('bank.explanationHelp')}
      />

      {!ready && problems.length > 0 && (
        <div className="grid gap-2">
          <span className="font-medium">{t('bank.missingTitle')}</span>
          <ul className="grid gap-1">
            {problems.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <X className="mt-1 size-icon-sm shrink-0 text-error" aria-hidden="true" />
                {problemText(t, p)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-t border-subtle pt-3">
        {ready && !question.published && (
          <button type="button" className={ghostClass} onClick={share}>
            {t('bank.publish')}
          </button>
        )}
        {question.published && (
          <span className="inline-flex min-h-hit items-center gap-1 px-3 text-caption text-secondary">
            <Check className="size-icon-sm" aria-hidden="true" />
            {t('bank.published')}
          </span>
        )}
        {ready ? (
          <button type="button" className={ghostClass} onClick={makeDraft} disabled={busy}>
            {t('bank.moveToDraft')}
          </button>
        ) : (
          <button type="button" className={ghostClass} onClick={makeReady} disabled={busy}>
            {t('bank.markReady')}
          </button>
        )}
        <button type="button" className={`${ghostClass} text-error`} onClick={onDelete}>
          <Trash2 className="size-icon-sm" aria-hidden="true" />
          {t('bank.delete')}
        </button>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={save} disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="size-icon-md animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {t('bank.saving')}
            </>
          ) : (
            t(ready ? 'bank.save' : 'bank.saveDraft')
          )}
        </Button>
      </div>
    </section>
  )
}
