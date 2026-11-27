import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Exam, ExamPatch, ScorePolicy } from '../../../api/exams'
import { GRADES, type Ref } from '../../../api/questions'
import SelectField from '../../../components/SelectField'
import TextField from '../../../components/TextField'
import { focusRing } from '../../../components/styles'
import { TextAreaField } from '../questions/ui'
import { fromLocalInput, toLocalInput } from './format'

// DS-008 "Setări" (D-012, D-015, D-021): every change is queued for autosave. Once published,
// only the title, the description and the end of the window change (Q-060); once the results are
// published, the end is locked too (Q-081).
export default function SettingsCard({ exam, classes, onChange }: { exam: Exam; classes: Ref[]; onChange: (patch: ExamPatch) => void }) {
  const { t } = useTranslation()
  const locked = exam.status === 'published'
  const endLocked = Boolean(exam.results_published_at)
  const [form, setForm] = useState({
    title: exam.title,
    description: exam.description ?? '',
    grade_level: exam.grade_level ? String(exam.grade_level) : '',
    duration_minutes: exam.duration_minutes ? String(exam.duration_minutes) : '',
    available_from: toLocalInput(exam.available_from),
    available_until: toLocalInput(exam.available_until),
    max_attempts: String(exam.max_attempts),
    score_policy: exam.score_policy,
    class_ids: exam.class_ids,
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K], patch: ExamPatch) {
    setForm((f) => ({ ...f, [key]: value }))
    onChange(patch)
  }

  const number = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value) : null)
  const single = form.max_attempts.trim() === '1'

  return (
    <section aria-labelledby="settings-heading" className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
      <h2 id="settings-heading" className="text-h2">{t('exams.settings')}</h2>
      <div className="grid items-start gap-4 tablet:grid-cols-2">
        <div className="tablet:col-span-2">
          <TextField
            id="exam-title"
            label={t('exams.titleField')}
            maxLength={255}
            value={form.title}
            error={form.title.trim() ? undefined : t('exams.problem.required.title')}
            onChange={(e) => {
              const value = e.target.value
              setForm((f) => ({ ...f, title: value }))
              // An empty title is never sent: the API requires one (C-005).
              if (value.trim()) onChange({ title: value.trim() })
            }}
          />
        </div>
        <div className="tablet:col-span-2">
          <TextAreaField
            id="exam-description"
            label={<>{t('exams.descriptionField')} <span className="font-normal text-secondary">{t('exams.optional')}</span></>}
            rows={3}
            maxLength={5000}
            value={form.description}
            onChange={(e) => set('description', e.target.value, { description: e.target.value.trim() ? e.target.value : null })}
          />
        </div>
        <SelectField id="exam-grade" label={t('exams.level')} help={t('exams.levelHelp')} disabled={locked} value={form.grade_level} onChange={(e) => set('grade_level', e.target.value, { grade_level: e.target.value ? Number(e.target.value) : null })}>
          <option value="">{t('exams.choose')}</option>
          {GRADES.map((g) => <option key={g} value={g}>{t(`bank.grade.${g}`)}</option>)}
        </SelectField>
        <TextField id="exam-duration" label={t('exams.duration')} help={t('exams.durationHelp')} inputMode="numeric" disabled={locked} value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value, { duration_minutes: number(e.target.value) })} />
        <div className="grid gap-1">
          <span className="font-medium">{t('exams.classes')}</span>
          {classes.length === 0 ? (
            <span className="text-caption text-secondary">{t('exams.noClasses')}</span>
          ) : (
            <div role="group" aria-label={t('exams.classes')} className="flex flex-wrap gap-2">
              {classes.map((c) => {
                const on = form.class_ids.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    disabled={locked}
                    onClick={() => {
                      const next = on ? form.class_ids.filter((id) => id !== c.id) : [...form.class_ids, c.id].sort((a, b) => a - b)
                      set('class_ids', next, { class_ids: next })
                    }}
                    className={`min-h-hit rounded-full border px-3 text-caption disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'border-focus bg-primary-subtle font-semibold text-accent' : 'border-input bg-surface'} ${focusRing}`}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <TextField id="exam-from" type="datetime-local" label={t('exams.availableFrom')} disabled={locked} value={form.available_from} onChange={(e) => set('available_from', e.target.value, { available_from: fromLocalInput(e.target.value) })} />
        <TextField id="exam-until" type="datetime-local" label={t('exams.availableUntil')} help={t(endLocked ? 'exams.untilLocked' : 'exams.untilHelp')} disabled={endLocked} value={form.available_until} onChange={(e) => set('available_until', e.target.value, { available_until: fromLocalInput(e.target.value) })} />
        <TextField id="exam-attempts" label={t('exams.attempts')} inputMode="numeric" disabled={locked} value={form.max_attempts} onChange={(e) => { const n = number(e.target.value); setForm((f) => ({ ...f, max_attempts: e.target.value })); if (n && n >= 1) onChange({ max_attempts: n }) }} />
        <SelectField id="exam-policy" label={t('exams.policy')} help={t('exams.policyHelp')} disabled={locked || single} value={form.score_policy} onChange={(e) => set('score_policy', e.target.value as ScorePolicy, { score_policy: e.target.value as ScorePolicy })}>
          <option value="highest">{t('exams.highest')}</option>
          <option value="latest">{t('exams.latest')}</option>
        </SelectField>
      </div>
    </section>
  )
}
