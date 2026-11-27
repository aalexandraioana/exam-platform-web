import type { AnswerValue, AttemptImage, ItemType } from './attempts'
import { apiFetch } from './client'

// The Candidate's results of an Exam (C-006, P8b; docs/API.md). Only after publication (D-019):
// before, the API answers 409 `results_not_published`.
interface ResultItemBase {
  position: number
  type: ItemType
  points: number
  statement: string
  /** Options in the order the Candidate saw them (D-045). */
  options: string[]
  answer: AnswerValue
  awarded_points: number
}

export interface SubjectOneResult extends ResultItemBase {
  section: 'subject_1'
  /** As shown: option positions, true/false, or the expected value (Q-082). */
  correct: AnswerValue
  explanation: string | null
}

export interface SubjectTwoResult extends ResultItemBase {
  section: 'subject_2'
  images: AttemptImage[]
  adjustment: number | null
  comment: string | null
  uses_barem: boolean
  barem: { description: string; points: number; earned: number }[]
}

export interface AttemptResult {
  id: number
  attempt_number: number
  submitted_at: string | null
  auto_submitted: boolean
  subject_1_score: number
  subject_2_score: number
  total_score: number
  grade: number
  /** The Attempt whose grade counts under the score policy (D-012, Q-084). */
  counted: boolean
  items: (SubjectOneResult | SubjectTwoResult)[]
}

export interface ExamResults {
  exam: { id: number; title: string; score_policy: 'highest' | 'latest'; results_published_at: string; cohort_note: string | null }
  attempts: AttemptResult[]
}

export const getResults = (examId: number) => apiFetch<ExamResults>(`/candidate/exams/${examId}/results`)
