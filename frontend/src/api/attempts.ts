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
