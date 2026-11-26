import { apiFetch } from './client'

// The question bank endpoints of C-004 (docs/API.md, "Question bank").
export type Section = 'subject_1' | 'subject_2'
export type QuestionType = 'dual_choice' | 'single_choice' | 'multiple_choice' | 'short_answer' | 'structured_problem'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Status = 'draft' | 'ready'

export const SECTIONS: Section[] = ['subject_1', 'subject_2']
export const TYPES: QuestionType[] = ['single_choice', 'multiple_choice', 'dual_choice', 'short_answer', 'structured_problem']
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
export const GRADES = [5, 6, 7, 8]

/** structured_problem is the only Subject II type. */
export const typesFor = (section: Section): QuestionType[] =>
  section === 'subject_2' ? ['structured_problem'] : TYPES.filter((t) => t !== 'structured_problem')

/** The answer key, its shape depends on the type (questions.template.yaml). */
export interface AnswerKey {
  correct?: boolean | number | number[]
  options?: string[]
  kind?: 'text' | 'number' | 'fraction'
  accepted?: string[]
  value?: string
}

export type ValueDefinition = { fixed: number } | { random: { min: number; max: number; except?: number[] } } | { calculated: string }

/** Named values (D-057). */
export interface Parameters {
  values: Record<string, ValueDefinition>
  conditions?: string[]
  answer?: string
}

/** What Ready still needs (D-059), or a named-value problem. */
export interface Problem {
  code: string
  field?: string
  name?: string
}

export interface Ref {
  id: number
  name: string
}

export interface Competence {
  id: number
  code: string
  description: string
}

export interface QuestionSummary {
  id: number
  code: string
  section: Section
  type: QuestionType
  status: Status
  grade_level: number | null
  difficulty: Difficulty | null
  statement: string | null
  competence: { id: number; code: string; description?: string } | null
  topic: Ref | null
  pools: Ref[]
}

export interface Question extends QuestionSummary {
  points: number | null
  explanation: string | null
  answer_key: AnswerKey | null
  parameters: Parameters | null
  uses_barem: boolean
  // Step ids keep the grades given on a step when the barem is edited (C-004, P8a).
  barem: { id: number; description: string; points: number }[]
  copied_from: { id: number; code: string } | null
  published: boolean
  problems: Problem[]
}

export interface QuestionPatch {
  section?: Section
  type?: QuestionType
  grade_level?: number | null
  difficulty?: Difficulty | null
  competence_id?: number | null
  topic_id?: number | null
  points?: number | null
  statement?: string | null
  explanation?: string | null
  answer_key?: AnswerKey | null
  parameters?: Parameters | null
  uses_barem?: boolean
  barem?: { id?: number; description: string; points: number }[]
  pool_ids?: number[]
}

export interface Filters {
  search?: string
  competence_id?: number
  topic_id?: number
  pool_id?: number
  type?: QuestionType
  section?: Section
  grade_level?: number
  difficulty?: Difficulty
  status?: Status
}

export interface Sample {
  values: Record<string, number>
  statement: string
  options: string[]
  answer: number | null
}

export interface LibraryEntry {
  id: number
  code: string
  section: Section
  type: QuestionType
  grade_level: number | null
  difficulty: Difficulty | null
  statement: string | null
  competence: { code: string; description: string } | null
  topic: { name: string } | null
  author: string
  copied_as: string | null
}

function query(filters: Filters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export async function listQuestions(filters: Filters = {}): Promise<QuestionSummary[]> {
  const { questions } = await apiFetch<{ questions: QuestionSummary[] }>(`/questions${query(filters)}`)
  return questions
}

async function one(path: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown): Promise<Question> {
  const { question } = await apiFetch<{ question: Question }>(path, { method, body })
  return question
}

export const getQuestion = (id: number) => one(`/questions/${id}`)
export const createQuestion = (input: { code: string; section: Section; type: QuestionType }) => one('/questions', 'POST', input)
export const updateQuestion = (id: number, patch: QuestionPatch) => one(`/questions/${id}`, 'PATCH', patch)
export const markReady = (id: number) => one(`/questions/${id}/ready`, 'POST')
export const markDraft = (id: number) => one(`/questions/${id}/draft`, 'POST')
export const deleteQuestion = (id: number) => apiFetch<void>(`/questions/${id}`, { method: 'DELETE' })

export function preview(input: { type: QuestionType; statement: string; options?: string[]; parameters: Parameters }) {
  return apiFetch<{ problems: Problem[]; samples: Sample[] }>('/questions/preview', { method: 'POST', body: input })
}

export async function checkAnswer(input: { type: QuestionType; answer_key: AnswerKey; given: unknown; expected?: number | null }) {
  const { accepted } = await apiFetch<{ accepted: boolean }>('/questions/check-answer', { method: 'POST', body: input })
  return accepted
}

export async function listCompetences(): Promise<Competence[]> {
  return (await apiFetch<{ competences: Competence[] }>('/competences')).competences
}
export async function createCompetence(input: { code: string; description: string }): Promise<Competence> {
  return (await apiFetch<{ competence: Competence }>('/competences', { method: 'POST', body: input })).competence
}
export async function listTopics(): Promise<Ref[]> {
  return (await apiFetch<{ topics: Ref[] }>('/topics')).topics
}
export async function createTopic(name: string): Promise<Ref> {
  return (await apiFetch<{ topic: Ref }>('/topics', { method: 'POST', body: { name } })).topic
}
export async function listPools(): Promise<Ref[]> {
  return (await apiFetch<{ pools: Ref[] }>('/pools')).pools
}
export async function createPool(name: string): Promise<Ref> {
  return (await apiFetch<{ pool: Ref }>('/pools', { method: 'POST', body: { name } })).pool
}

export async function publish(id: number): Promise<LibraryEntry> {
  return (await apiFetch<{ entry: LibraryEntry }>(`/questions/${id}/publish`, { method: 'POST' })).entry
}
export async function listLibrary(): Promise<LibraryEntry[]> {
  return (await apiFetch<{ entries: LibraryEntry[] }>('/library')).entries
}
export const copyEntry = (id: number, code: string) => one(`/library/${id}/copy`, 'POST', { code })
