import { apiFetch } from './client'

// The auth endpoints of C-001 (docs/API.md, "Users").
export type Role = 'candidate' | 'examiner' | 'administrator'

/** The client-side email check before a request; the API still validates. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface User {
  id: number
  name: string
  email: string
  role: Role
  is_active: boolean
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
  name: string
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

export async function me(): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/user')
  return user
}
