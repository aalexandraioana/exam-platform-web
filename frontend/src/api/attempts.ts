import { apiFetch } from './client'

// The Candidate's side of C-006 (docs/API.md, "Attempts (Candidate)").
export interface CandidateExam {
  id: number
  title: string
  description: string | null
  duration_minutes: number
  available_from: string | null
  available_until: string | null
  max_attempts: number
  attempts_used: number
  state: 'upcoming' | 'open' | 'closed'
  open_attempt_id: number | null
  open_attempt: { id: number; started_at: string; expires_at: string } | null
  can_start: boolean
  /** Submitted or sealed at least once: "submitted, awaiting grading" until P9 (D-019). */
  submitted: boolean
  results_published: boolean
  /** The Items' topics; competence codes are not shown (Q-069). */
  topics: string[]
  item_counts: { subject_1: number; subject_2: number }
}

export interface CandidateExams {
  server_time: string
  /** The Candidate's class requests, for the empty states (P7a). */
  classes: { accepted: number; pending: number }
  exams: CandidateExam[]
}

export function listCandidateExams(): Promise<CandidateExams> {
  return apiFetch<CandidateExams>('/candidate/exams')
}

/** Starts an Attempt; a `409 attempt_open` carries the open one's `attempt_id` in its body. */
export async function startAttempt(examId: number): Promise<{ id: number }> {
  return (await apiFetch<{ attempt: { id: number } }>(`/candidate/exams/${examId}/attempts`, { method: 'POST' })).attempt
}

export type ItemType = 'single_choice' | 'multiple_choice' | 'dual_choice' | 'short_answer' | 'structured_problem'
/** Choices are the shown positions (1-based); true/false a boolean; text a string; null cleared. */
export type AnswerValue = number | number[] | boolean | string | null

export interface SavedAnswer {
  value: AnswerValue
  version: number
  marked_for_review: boolean
  saved_at: string | null
}

export interface AttemptItem {
  position: number
  section: 'subject_1' | 'subject_2'
  type: ItemType
  points: number
  statement: string
  /** In the order shown to this Candidate (D-045). */
  options: string[]
  answer: SavedAnswer | null
}

export interface Attempt {
  id: number
  exam: { id: number; title: string }
  status: 'started' | 'in_progress' | 'submitted' | 'graded'
  attempt_number: number
  started_at: string
  expires_at: string
  server_time: string
  submitted_at: string | null
  auto_submitted: boolean
  items: AttemptItem[]
}

export async function getAttempt(id: number): Promise<Attempt> {
  return (await apiFetch<{ attempt: Attempt }>(`/attempts/${id}`)).attempt
}

/** Autosave (C-006): stored only when `version` is higher than the stored one. */
export function saveAnswer(id: number, position: number, body: { answer: AnswerValue; marked_for_review: boolean; version: number }) {
  return apiFetch<{ answer: SavedAnswer; applied: boolean; status: Attempt['status'] }>(`/attempts/${id}/items/${position}/answer`, { method: 'PUT', body })
}
