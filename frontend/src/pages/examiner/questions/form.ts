import type { AnswerKey, Difficulty, Parameters, Question, QuestionPatch, QuestionType, Section, ValueDefinition } from '../../../api/questions'

// The editor's state, as typed (strings for numbers), and its conversion to a C-004 PATCH.

export type ValueKind = 'random' | 'fixed' | 'calculated'

export interface ValueRow {
  name: string
  kind: ValueKind
  min: string
  max: string
  except: string
  fixed: string
  formula: string
}

export interface ValuesForm {
  rows: ValueRow[]
  conditions: string
  answer: string
}

export interface QuestionForm {
  section: Section
  type: QuestionType
  grade_level: string
  difficulty: Difficulty | ''
  competence_id: string
  topic_id: string
  points: string
  statement: string
  explanation: string
  answer_key: AnswerKey
  values: ValuesForm | null
  uses_barem: boolean
  barem: { description: string; points: string }[]
  pool_ids: number[]
}

export const emptyRow = (name = ''): ValueRow => ({ name, kind: 'random', min: '', max: '', except: '', fixed: '', formula: '' })

const text = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))

function rowFrom(name: string, definition: ValueDefinition): ValueRow {
  if ('fixed' in definition) return { ...emptyRow(name), kind: 'fixed', fixed: text(definition.fixed) }
  if ('calculated' in definition) return { ...emptyRow(name), kind: 'calculated', formula: definition.calculated }
  const range = definition.random
  return { ...emptyRow(name), kind: 'random', min: text(range.min), max: text(range.max), except: (range.except ?? []).join(', ') }
}

export function formFrom(q: Question): QuestionForm {
  return {
    section: q.section,
    type: q.type,
    grade_level: text(q.grade_level),
    difficulty: q.difficulty ?? '',
    competence_id: text(q.competence?.id),
    topic_id: text(q.topic?.id),
    points: text(q.points),
    statement: q.statement ?? '',
    explanation: q.explanation ?? '',
    answer_key: q.answer_key ?? defaultKey(q.type),
    values: q.parameters
      ? {
          rows: Object.entries(q.parameters.values ?? {}).map(([name, d]) => rowFrom(name, d)),
          conditions: (q.parameters.conditions ?? []).join('; '),
          answer: q.parameters.answer ?? '',
        }
      : null,
    uses_barem: q.uses_barem,
    barem: q.barem.map((s) => ({ description: s.description, points: text(s.points) })),
    pool_ids: q.pools.map((p) => p.id),
  }
}

/** A fresh answer key for a type, e.g. after the type changes. */
export function defaultKey(type: QuestionType): AnswerKey {
  switch (type) {
    case 'dual_choice':
      return { correct: true }
    case 'single_choice':
      return { options: ['', ''], correct: 1 }
    case 'multiple_choice':
      return { options: ['', ''], correct: [] }
    case 'short_answer':
      return { kind: 'text', accepted: [''] }
    default:
      return {}
  }
}

/** A whole number as typed, or the text itself so the server reports it (D-057 codes). */
function whole(value: string): number | string {
  const trimmed = value.trim().replace('−', '-')
  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed
}

export function parametersFrom(values: ValuesForm): Parameters {
  const definitions: Record<string, ValueDefinition> = {}
  for (const row of values.rows) {
    const name = row.name.trim()
    if (!name) continue
    if (row.kind === 'fixed') definitions[name] = { fixed: whole(row.fixed) } as ValueDefinition
    else if (row.kind === 'calculated') definitions[name] = { calculated: row.formula }
    else {
      const except = row.except.split(/[,;]/).map((v) => v.trim()).filter(Boolean).map(whole)
      definitions[name] = { random: { min: whole(row.min), max: whole(row.max), ...(except.length ? { except } : {}) } } as ValueDefinition
    }
  }
  const conditions = values.conditions.split(';').map((c) => c.trim()).filter(Boolean)
  return {
    values: definitions,
    ...(conditions.length ? { conditions } : {}),
    ...(values.answer.trim() ? { answer: values.answer.trim() } : {}),
  }
}

const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value.replace(',', '.')))
const idOrNull = (value: string) => (value === '' ? null : Number(value))

export function patchFrom(form: QuestionForm): QuestionPatch {
  return {
    section: form.section,
    type: form.type,
    grade_level: idOrNull(form.grade_level),
    difficulty: form.difficulty || null,
    competence_id: idOrNull(form.competence_id),
    topic_id: idOrNull(form.topic_id),
    points: numberOrNull(form.points),
    statement: form.statement.trim() ? form.statement : null,
    explanation: form.explanation.trim() ? form.explanation : null,
    answer_key: form.section === 'subject_1' ? form.answer_key : null,
    parameters: form.values ? parametersFrom(form.values) : null,
    uses_barem: form.section === 'subject_2' && form.uses_barem,
    barem: form.section === 'subject_2' && form.uses_barem
      ? form.barem.map((s) => ({ description: s.description, points: Number(s.points.replace(',', '.')) || 0 }))
      : [],
    pool_ids: form.pool_ids,
  }
}
