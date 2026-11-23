import { createContext, useContext } from 'react'
import type { LoginInput, RegisterInput, Role, User } from '../api/auth'

export interface AuthState {
  user: User | null
  /** "loading" while the stored token is checked on start-up. */
  status: 'loading' | 'ready'
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth needs an <AuthProvider>')
  return auth
}

// Each role's home; temporary placeholders until P3 (examiner), P7 (candidate), P11 (admin).
const homes: Record<Role, string> = { candidate: '/candidate', examiner: '/examiner', administrator: '/admin' }

export function homePath(role: Role): string {
  return homes[role]
}
