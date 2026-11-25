import { Check, Minus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Exam } from '../../../api/exams'
import { examProblemText } from './problems'

// DS-008 "Verificări înainte de publicare": the Subject totals (D-005), one question per Item
// (D-057), the competences covered and the missing ones as warnings (Q-063), and what blocks publishing.
export default function ChecksCard({ exam }: { exam: Exam }) {
  const { t } = useTranslation()
  const { totals, problems, warnings } = exam.checks
  const count = (section: string) => exam.items.filter((i) => i.section === section).length
  const distinctOk = exam.items.length > 0 && !problems.some((p) => p.code === 'no_distinct_draw')
  const eligible = exam.items.map((i) => i.eligible)
  const covered = [...new Map(exam.items.filter((i) => i.competence).map((i) => [i.competence!.id, i.competence!])).values()]
    .sort((a, b) => a.code.localeCompare(b.code))
  const tiles = [
    { ok: totals.subject_1 === 30, title: t('exams.subject1', { sum: totals.subject_1 }), detail: t('exams.items', { count: count('subject_1') }) },
    { ok: totals.subject_2 === 60, title: t('exams.subject2', { sum: totals.subject_2 }), detail: t('exams.items', { count: count('subject_2') }) },
    { ok: totals.subject_1 + totals.subject_2 === 90, title: t('exams.total', { total: totals.subject_1 + totals.subject_2 + 10 }), detail: t('exams.totalDetail', { sum: totals.subject_1 + totals.subject_2 }) },
    {
      ok: distinctOk,
      title: t(distinctOk ? 'exams.distinctOk' : 'exams.distinctBad'),
      detail: distinctOk ? t('exams.distinctOkDetail', { min: Math.min(...eligible), max: Math.max(...eligible) }) : t('exams.distinctBadDetail'),
    },
  ]

  return (
    <section aria-labelledby="checks-heading" className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
      <h2 id="checks-heading" className="text-h2">{t('exams.checksTitle')}</h2>
      <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.title} className={`flex items-start gap-2 rounded-md p-3 ${tile.ok ? 'bg-success-bg text-success' : 'bg-error-bg text-error'}`}>
            {tile.ok ? <Check className="mt-1 size-icon-sm shrink-0" aria-hidden="true" /> : <X className="mt-1 size-icon-sm shrink-0" aria-hidden="true" />}
            <div>
              <strong>{tile.title}</strong>
              <div className="text-caption text-secondary">{tile.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <span className="font-medium">{t('exams.coverage')}</span>
        <ul aria-label={t('exams.coverage')} className="flex flex-wrap gap-2">
          {covered.map((c) => (
            <li key={c.id} className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 text-caption font-semibold text-success">
              <Check className="size-icon-sm" aria-hidden="true" />
              {`${c.code} · ${c.description}`}
            </li>
          ))}
          {warnings.map((w) => (
            <li key={w.competence.id} className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 text-caption font-semibold text-warning">
              <Minus className="size-icon-sm" aria-hidden="true" />
              {t('exams.missingCompetence', { code: w.competence.code, description: w.competence.description })}
            </li>
          ))}
        </ul>
      </div>
      {problems.length > 0 && (
        <div id="publish-why" className="grid gap-1 text-error">
          <span className="font-medium">{t('exams.blocked')}</span>
          <ul className="grid list-disc gap-1 pl-6">
            {problems.map((p, i) => <li key={i}>{examProblemText(t, p)}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
