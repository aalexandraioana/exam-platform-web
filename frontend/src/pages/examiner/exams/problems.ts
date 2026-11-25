import type { TFunction } from 'i18next'
import type { ExamProblem } from '../../../api/exams'

/** A readable sentence for a C-005 publish problem (PATTERN-005). */
export function examProblemText(t: TFunction, p: ExamProblem): string {
  switch (p.code) {
    case 'required':
      return t(`exams.problem.required.${p.field}`, { defaultValue: t('exams.problem.unknown', { code: p.code }) })
    case 'subject_total':
      return t('exams.problem.subject_total', { section: t(`bank.section.${p.section}`), sum: p.sum, expected: p.expected })
    case 'item_incomplete':
      return t('exams.problem.item_incomplete', { item: p.item, field: t(`exams.problem.field.${p.field}`) })
    case 'no_distinct_draw':
      return t('exams.problem.no_distinct_draw', { items: (p.items ?? []).join(', ') })
    default:
      return t('exams.problem.unknown', { code: p.code })
  }
}
