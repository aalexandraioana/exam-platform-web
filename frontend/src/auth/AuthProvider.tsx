import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '../api/auth'
import { ApiError, getToken, onUnauthorized, setToken } from '../api/client'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null)
  const [status, setStatus] = useState<AuthState['status']>(() => (getToken() ? 'loading' : 'ready'))

  useEffect(() => onUnauthorized(() => setUser(null)), [])

  useEffect(() => {
    if (!getToken()) return
    let active = true
    api
      .me()
      .then((loaded) => active && setUser(loaded))
      .catch((error: unknown) => {
        // A deactivated account keeps no token; a network error keeps it for the next start.
        if (error instanceof ApiError && error.status === 403) setToken(null)
      })
      .finally(() => active && setStatus('ready'))
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback((result: api.AuthResult) => {
    setToken(result.token)
    setUser(result.user)
    return result.user
  }, [])

  const login = useCallback((input: api.LoginInput) => api.login(input).then(signIn), [signIn])
  const register = useCallback((input: api.RegisterInput) => api.register(input).then(signIn), [signIn])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // the token is dropped here either way
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
