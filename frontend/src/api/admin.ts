import type { User } from './auth'
import { apiFetch } from './client'

// The Administrator endpoints of C-003 (docs/API.md, "Administrator").
export interface NewExaminer {
  first_name: string
  last_name: string
  email: string
  password: string
}

export async function listUsers(): Promise<User[]> {
  const { users } = await apiFetch<{ users: User[] }>('/admin/users')
  return users
}

export async function createExaminer(input: NewExaminer): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/admin/examiners', { method: 'POST', body: input })
  return user
}

/** A temporary password (D-054): the user chooses their own at the next sign-in. */
export function setTemporaryPassword(id: number, password: string): Promise<void> {
  return apiFetch(`/admin/users/${id}/password`, { method: 'PUT', body: { password } })
}

/** Permanent (D-056): there is no reactivation. */
export async function deactivateUser(id: number): Promise<User> {
  const { user } = await apiFetch<{ user: User }>(`/admin/users/${id}`, { method: 'PATCH', body: { is_active: false } })
  return user
}
