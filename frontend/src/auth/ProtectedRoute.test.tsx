import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../api/client'
import { candidate, examiner, json, mockApi } from '../test/mockApi'
import { AuthProvider } from './AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'

function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
  return <p>login page, from {from ?? 'nowhere'}</p>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/candidate" element={<ProtectedRoute role="candidate"><p>candidate home</p></ProtectedRoute>} />
          <Route path="/examiner" element={<ProtectedRoute role="examiner"><p>examiner home</p></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="administrator"><p>admin home</p></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('ProtectedRoute', () => {
  it('sends a signed-out visitor to /login, keeping where they came from', async () => {
    mockApi({})

    renderAt('/candidate')

    expect(await screen.findByText('login page, from /candidate')).toBeInTheDocument()
  })

  it('shows the page to a user with the right role', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: candidate }) })

    renderAt('/candidate')

    expect(await screen.findByText('candidate home')).toBeInTheDocument()
  })

  it('sends a user with another role to their own home', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: examiner }) })

    renderAt('/candidate')

    expect(await screen.findByText('examiner home')).toBeInTheDocument()
  })

  it('sends an Administrator to /admin', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: { ...examiner, role: 'administrator' } }) })

    renderAt('/examiner')

    expect(await screen.findByText('admin home')).toBeInTheDocument()
  })
})
