import { apiFetch } from './client'

// The auth endpoints of C-001 (docs/API.md, "Users").
export type Role = 'candidate' | 'examiner' | 'administrator'

/** The client-side email check before a request; the API still validates. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface User {
  id: number
  first_name: string
  last_name: string
  /** "Prenume Nume", for display. */
  name: string
  email: string
  role: Role
  is_active: boolean
  /** The password is temporary (D-054): only DS-018 is shown until it is changed. */
  must_change_password: boolean
}

export interface AuthResult {
  token: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  class_code?: string
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return apiFetch('/register', { method: 'POST', body: input })
}

export function login(input: LoginInput): Promise<AuthResult> {
  return apiFetch('/login', { method: 'POST', body: input })
}

export function logout(): Promise<void> {
  return apiFetch('/logout', { method: 'POST' })
}

/** Replaces a temporary password; the answer carries a new token (D-050, D-054). */
export function changePassword(password: string, password_confirmation: string): Promise<AuthResult> {
  return apiFetch('/user/password', { method: 'PUT', body: { password, password_confirmation } })
}

export async function me(): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/user')
  return user
}
