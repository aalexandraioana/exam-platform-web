import { API_BASE_URL, ApiError, apiFetch, getToken } from './client'

// The grading endpoints of C-007 (docs/API.md, "Grading (Examiner)").
export type AnswerStatus = 'to_grade' | 'graded' | 'recheck'
export type PublishMissing = 'ungraded' | 'recheck' | 'open_attempts' | 'window_open'

export interface QueueAnswer {
  attempt_item_id: number
  attempt_id: number
  candidate: string
  /** The Attempt's place in the list, shown when names are hidden. */
  number: number
  position: number
  question_code: string
  photos: number
  answered: boolean
  status: AnswerStatus
  awarded_points: number | null
}

export interface GradingQueue {
  exam: {
    id: number
    title: string
    classes: string[]
    available_until: string | null
    submissions: number
    results_published_at: string | null
    cohort_note: string | null
  }
  items: { position: number; competence: string | null; points: number; graded: number; total: number }[]
  answers: QueueAnswer[]
  counts: { total: number; graded: number; to_grade: number; recheck: number }
  publish: { ready: boolean; missing: PublishMissing[]; mean: number | null; median: number | null }
}

export interface BaremStep {
  id: number
  description: string
  points: number
  /** Changed after this answer was graded. */
  modified: boolean
}

export interface GradingItem {
  attempt_item_id: number
  attempt_id: number
  position: number
  question_id: number
  question_code: string
  candidate: string
  statement: string
  points: number
  text: string | null
  photos: { id: number; position: number; name: string; size: number }[]
  uses_barem: boolean
  barem: BaremStep[]
  scores: Record<string, number>
  adjustment: number | null
  comment: string | null
  awarded_points: number | null
  needs_recheck: boolean
  graded_at: string | null
}

export type Grade =
  | { steps: { id: number; points: number }[]; adjustment: number | null; comment: string | null }
  | { points: number; adjustment: number | null; comment: string | null }

export const getQueue = (examId: number) => apiFetch<GradingQueue>(`/exams/${examId}/grading`)

export async function getItem(id: number): Promise<GradingItem> {
  const { item } = await apiFetch<{ item: GradingItem }>(`/grading/items/${id}`)
  return item
}

export async function saveGrade(id: number, grade: Grade): Promise<GradingItem> {
  const { item } = await apiFetch<{ item: GradingItem }>(`/grading/items/${id}`, { method: 'PUT', body: grade })
  return item
}

export const publishResults = (examId: number, cohortNote: string | null) =>
  apiFetch<{ exam: { id: number } }>(`/exams/${examId}/results`, { method: 'POST', body: { cohort_note: cohortNote } })

/** Saves a question's barem from the grading screen (C-004): graded answers are recalculated. */
export async function saveBarem(questionId: number, barem: { id: number; description: string; points: number }[]) {
  const { regraded } = await apiFetch<{ regraded?: { answers: number; flagged: number } }>(`/questions/${questionId}`, {
    method: 'PATCH',
    body: { uses_barem: true, barem },
  })
  return regraded ?? { answers: 0, flagged: 0 }
}

/** A Subject II photo's bytes, fetched with the token (an <img> can't send it). */
export async function fetchPhoto(imageId: number): Promise<Blob> {
  const token = getToken()
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/grading/images/${imageId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch {
    throw new ApiError(0, 'network')
  }
  if (!response.ok) throw new ApiError(response.status)
  return response.blob()
}
