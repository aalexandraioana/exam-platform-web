import { apiFetch } from './client'

// The class endpoints of C-002 (docs/API.md, "Classes").
export interface SchoolClass {
  id: number
  name: string
  /** Shown with a hyphen, e.g. "K7Q-4MX". */
  join_code: string
  pending_count: number
  candidate_count: number
  published_exam_count: number
}

export interface JoinRequest {
  id: number
  candidate: { id: number; first_name: string; last_name: string; name: string; email: string }
  requested_at: string
}

export interface ClassCandidate {
  id: number
  first_name: string
  last_name: string
  name: string
  email: string
  joined_at: string
}

export interface ClassDetail {
  class: SchoolClass
  requests: JoinRequest[]
  candidates: ClassCandidate[]
}

export async function listClasses(): Promise<SchoolClass[]> {
  const { classes } = await apiFetch<{ classes: SchoolClass[] }>('/classes')
  return classes
}

export function getClass(id: number): Promise<ClassDetail> {
  return apiFetch(`/classes/${id}`)
}

export async function createClass(name: string): Promise<SchoolClass> {
  const result = await apiFetch<{ class: SchoolClass }>('/classes', { method: 'POST', body: { name } })
  return result.class
}

export async function renameClass(id: number, name: string): Promise<SchoolClass> {
  const result = await apiFetch<{ class: SchoolClass }>(`/classes/${id}`, { method: 'PATCH', body: { name } })
  return result.class
}

export async function newJoinCode(id: number): Promise<SchoolClass> {
  const result = await apiFetch<{ class: SchoolClass }>(`/classes/${id}/join-code`, { method: 'POST' })
  return result.class
}

export function decideRequest(id: number, decision: 'accept' | 'decline'): Promise<unknown> {
  return apiFetch(`/memberships/${id}/${decision}`, { method: 'POST' })
}

export function setCandidatePassword(classId: number, candidateId: number, password: string): Promise<void> {
  return apiFetch(`/classes/${classId}/candidates/${candidateId}/password`, { method: 'PUT', body: { password } })
}
