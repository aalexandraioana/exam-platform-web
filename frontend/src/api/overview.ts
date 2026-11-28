import { apiFetch } from './client'

// The Overview endpoints of C-009 (docs/API.md, "Overview").
export type ExamState = 'upcoming' | 'open' | 'closed'

export interface DashboardExam {
  id: number
  title: string
  state: ExamState
  available_until: string | null
  in_progress: number
  awaiting_grading: number
  results_published: boolean
}

export interface Dashboard {
  counts: { active_exams: number; attempts_in_progress: number; awaiting_grading: number }
  exams: DashboardExam[]
}

export interface SupervisedExam {
  id: number
  title: string
  examiner: { id: number; name: string }
  status: 'draft' | 'published'
  /** Null for a draft. */
  state: ExamState | null
  available_from: string | null
  available_until: string | null
  results_published_at: string | null
  classes: { id: number; name: string }[]
  attempts: { submitted: number; graded: number }
}

/** The Examiner's dashboard (DS-006). */
export async function getDashboard(): Promise<Dashboard> {
  return apiFetch<Dashboard>('/examiner/dashboard')
}

/** Every exam on the platform, read-only (DS-012, Q-098). */
export async function listAllExams(): Promise<SupervisedExam[]> {
  return (await apiFetch<{ exams: SupervisedExam[] }>('/admin/exams')).exams
}
