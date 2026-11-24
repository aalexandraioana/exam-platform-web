import { createContext, useContext } from 'react'
import type { LoginInput, RegisterInput, Role, User } from '../api/auth'

export interface AuthState {
  user: User | null
  /** "loading" while the stored token is checked on start-up. */
  status: 'loading' | 'ready'
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
  /** Replaces a temporary password and keeps the session with the new token (D-054). */
  changePassword: (password: string, confirmation: string) => Promise<User>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth needs an <AuthProvider>')
  return auth
}

// Each role's home; the Candidate's is a placeholder until P7.
const homes: Record<Role, string> = { candidate: '/candidate', examiner: '/examiner', administrator: '/admin' }

export function homePath(role: Role): string {
  return homes[role]
}

/** Where a signed-in user goes: DS-018 while the password is temporary (D-054), else their home. */
export function landingPath(user: User): string {
  return user.must_change_password ? '/change-password' : homePath(user.role)
}
