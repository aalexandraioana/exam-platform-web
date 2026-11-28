import { apiFetch } from './client'
import type { QuestionType } from './questions'

// The Item Analysis endpoint of C-008 (docs/API.md, "Item Analysis (Examiner)").
export type AnalysisFlag = 'too_hard' | 'too_easy' | 'low_discrimination' | 'negative_discrimination'

/** p (0–1) and r; null when there isn't enough data (D-047, Q-095). */
export interface Measure {
  n: number
  p: number | null
  r: number | null
  flags: AnalysisFlag[]
  not_enough_data: boolean
}

export interface AnalysisOption {
  /** The original position (1, 2, …), or true / false for a true/false question. */
  option: number | boolean
  label: string
  correct: boolean
  count: number
  share: number
  unused: boolean
}

export interface AnalysisVariant extends Measure {
  id: number
  code: string
  type: QuestionType
  options: AnalysisOption[] | null
}

export interface AnalysisItem extends Measure {
  position: number
  section: 'subject_1' | 'subject_2'
  points: number
  questions: AnalysisVariant[]
}

export interface AnalysisCompetence {
  code: string | null
  description: string | null
  p: number | null
  weak: number
  items: AnalysisItem[]
}

export interface ItemAnalysis {
  exam: { id: number; title: string }
  graded: number
  submissions: number
  recheck: number
  mean: number | null
  median: number | null
  competences: AnalysisCompetence[]
}

export const getAnalysis = (examId: number) => apiFetch<ItemAnalysis>(`/exams/${examId}/analysis`)
