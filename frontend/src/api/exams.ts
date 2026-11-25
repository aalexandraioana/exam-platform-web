import { apiFetch } from './client'
import type { Difficulty, QuestionType, Ref, Section } from './questions'

// The exam endpoints of C-005 (docs/API.md, "Exams").
export type ScorePolicy = 'highest' | 'latest'

export interface ExamSummary {
  id: number
  title: string
  status: 'draft' | 'published'
  grade_level: number | null
  available_from: string | null
  available_until: string | null
  published_at: string | null
  classes: Ref[]
  item_count: number
}

export interface ExamItem {
  id: number
  position: number
  section: Section
  points: number | null
  pool: Ref | null
  competence: { id: number; code: string; description: string } | null
  difficulty: Difficulty | null
  /** null means "any" (D-057). */
  type: QuestionType | null
  topic: Ref | null
  /** Ready questions this Item may draw. */
  eligible: number
}

/** What blocks publishing (D-005, D-057) and the uncovered competences (Q-063). */
export interface ExamProblem {
  code: string
  field?: string
  section?: Section
  sum?: number
  expected?: number
  item?: number
  items?: number[]
}

export interface Exam extends ExamSummary {
  description: string | null
  duration_minutes: number | null
  max_attempts: number
  score_policy: ScorePolicy
  class_ids: number[]
  items: ExamItem[]
  checks: {
    totals: { subject_1: number; subject_2: number }
    problems: ExamProblem[]
    warnings: { code: string; competence: { id: number; code: string; description: string } }[]
  }
}

export interface ExamPatch {
  title?: string
  description?: string | null
  grade_level?: number | null
  duration_minutes?: number | null
  available_from?: string | null
  available_until?: string | null
  max_attempts?: number
  score_policy?: ScorePolicy
  class_ids?: number[]
}

export interface ItemInput {
  section?: Section
  points?: number | null
  pool_id?: number | null
  competence_id?: number | null
  difficulty?: Difficulty | null
  type?: QuestionType | null
  topic_id?: number | null
}

export interface PreviewItem {
  item_id: number
  position: number
  question_id: number
  code: string
  competence: string | null
  eligible: number
  values: Record<string, number>
  statement: string | null
  options: string[]
  answer: number | null
}

async function one(path: string, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET', body?: unknown): Promise<Exam> {
  return (await apiFetch<{ exam: Exam }>(path, { method, body })).exam
}

export async function listExams(): Promise<ExamSummary[]> {
  return (await apiFetch<{ exams: ExamSummary[] }>('/exams')).exams
}
export const createExam = (title: string) => one('/exams', 'POST', { title })
export const getExam = (id: number) => one(`/exams/${id}`)
export const updateExam = (id: number, patch: ExamPatch) => one(`/exams/${id}`, 'PATCH', patch)
export const deleteExam = (id: number) => apiFetch<void>(`/exams/${id}`, { method: 'DELETE' })
export const publishExam = (id: number) => one(`/exams/${id}/publish`, 'POST')
export const addItem = (id: number, input: ItemInput) => one(`/exams/${id}/items`, 'POST', input)
export const updateItem = (id: number, itemId: number, input: ItemInput) => one(`/exams/${id}/items/${itemId}`, 'PATCH', input)
export const deleteItem = (id: number, itemId: number) => one(`/exams/${id}/items/${itemId}`, 'DELETE')
export const reorderItems = (id: number, itemIds: number[]) => one(`/exams/${id}/items/order`, 'PUT', { item_ids: itemIds })

export async function matchCount(id: number, input: ItemInput): Promise<number> {
  return (await apiFetch<{ count: number }>(`/exams/${id}/match`, { method: 'POST', body: input })).count
}

export async function previewExam(id: number): Promise<PreviewItem[]> {
  return (await apiFetch<{ items: PreviewItem[] }>(`/exams/${id}/preview`)).items
}
