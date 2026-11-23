import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Role } from '../api/auth'
import { homePath, useAuth } from './context'

/** Shows `children` only to a signed-in user with `role`; others go to /login or their own home. */
export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.role !== role) return <Navigate to={homePath(user.role)} replace />
  return children
}
