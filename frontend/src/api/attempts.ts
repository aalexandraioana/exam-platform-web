import { API_BASE_URL, ApiError, apiFetch, getToken } from './client'

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
  /** Submitted or sealed at least once: "submitted, awaiting grading" until results are published (D-019). */
  submitted: boolean
  results_published: boolean
  /** The counted grade (1–10) once the results are published, else null (P8b, D-012). */
  grade: number | null
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
  /** Subject II photos (P6d); null for other items. */
  images?: AttemptImage[] | null
}

export interface AttemptImage {
  id: number
  position: number
  name: string
  size: number
}

export interface Attempt {
  id: number
  /** `max_attempts` since P7c ("Încercarea 1 din 1"). */
  exam: { id: number; title: string; max_attempts?: number }
  status: 'started' | 'in_progress' | 'submitted' | 'graded'
  attempt_number: number
  started_at: string
  expires_at: string
  /** The deadline plus the Grace Period (D-004): late answers are accepted until then (P7d). */
  accepts_answers_until?: string
  server_time: string
  /** False in production until the photo storage is set up (P6d, D-048). */
  photos_enabled?: boolean
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

/** Submits (C-006): repeating it changes nothing; after the deadline + grace it seals instead. */
export async function submitAttempt(id: number): Promise<Attempt> {
  return (await apiFetch<{ attempt: Attempt }>(`/attempts/${id}/submit`, { method: 'POST' })).attempt
}

/**
 * Uploads one Subject II photo (P6d) with progress: `onProgress(sent, total)`. XMLHttpRequest, as
 * fetch can't report upload progress. Errors are ApiErrors like `apiFetch`'s (status 0 = network).
 */
export function uploadImage(id: number, position: number, file: File, onProgress: (sent: number, total: number) => void): Promise<AttemptImage> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${API_BASE_URL}/attempts/${id}/items/${position}/images`)
    request.setRequestHeader('Accept', 'application/json')
    const token = getToken()
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.upload.onprogress = (event) => onProgress(event.loaded, event.total || file.size)
    request.onerror = () => reject(new ApiError(0, 'network'))
    request.onload = () => {
      let data: Record<string, unknown> = {}
      try {
        data = JSON.parse(request.responseText || '{}')
      } catch {
        // not JSON
      }
      if (request.status === 201) resolve(data.image as AttemptImage)
      else reject(new ApiError(request.status, data.code as string | undefined, (data.errors as Record<string, string[]>) ?? {}, data))
    }
    const body = new FormData()
    body.append('image', file)
    request.send(body)
  })
}

export function deleteImage(id: number, position: number, imageId: number): Promise<void> {
  return apiFetch<void>(`/attempts/${id}/items/${position}/images/${imageId}`, { method: 'DELETE' })
}

/** The photo's bytes, fetched with the token (an <img> can't send it). */
export async function fetchImage(id: number, imageId: number): Promise<Blob> {
  const token = getToken()
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/attempts/${id}/images/${imageId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch {
    throw new ApiError(0, 'network')
  }
  if (!response.ok) throw new ApiError(response.status)
  return response.blob()
}
