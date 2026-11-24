import type { TFunction } from 'i18next'
import type { Problem } from '../../../api/questions'

/** A readable sentence for a C-004 problem code (D-059, PATTERN-005). */
export function problemText(t: TFunction, problem: Problem): string {
  if (problem.code === 'required' && problem.field) {
    return t('bank.problem.requiredSuffix', { field: t(`bank.problem.required.${problem.field}`) })
  }
  const key = `bank.problem.${problem.code}`
  return t(key, { name: problem.name ?? '', defaultValue: t('bank.problem.unknown', { code: problem.code }) })
}

/** The letter of an option: 1 → a. */
export const letter = (index: number) => String.fromCharCode(97 + index)
