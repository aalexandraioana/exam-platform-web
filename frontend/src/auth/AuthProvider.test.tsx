import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { getToken, setToken } from '../api/client'
import { bodyOf, candidate, json, mockApi } from '../test/mockApi'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './context'

function Probe() {
  const { user, status, login, logout } = useAuth()
  return (
    <div>
      <p>{status === 'loading' ? 'loading' : (user?.name ?? 'signed out')}</p>
      <button onClick={() => login({ email: 'ana.dumitru@exemplu.ro', password: 'lalea-verde-48' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('loads the user from GET /api/user on start-up when a token is stored', async () => {
    setToken('12|abc')
    const fetchMock = mockApi({ 'GET /user': json(200, { user: candidate }) })

    renderProbe()

    expect(await screen.findByText('Ana Dumitru')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('starts signed out without calling the API when no token is stored', async () => {
    const fetchMock = mockApi({})

    renderProbe()

    expect(await screen.findByText('signed out')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('drops a revoked token on start-up', async () => {
    setToken('12|revoked')
    mockApi({ 'GET /user': json(401, { message: 'Unauthenticated.' }) })

    renderProbe()

    expect(await screen.findByText('signed out')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('stores the token and the user after login', async () => {
    const fetchMock = mockApi({ 'POST /login': json(200, { token: '13|new', user: candidate }) })
    renderProbe()
    await screen.findByText('signed out')

    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    expect(await screen.findByText('Ana Dumitru')).toBeInTheDocument()
    expect(getToken()).toBe('13|new')
    expect(bodyOf(fetchMock)).toEqual({ email: 'ana.dumitru@exemplu.ro', password: 'lalea-verde-48' })
  })

  it('calls POST /api/logout and clears the token and the user on logout', async () => {
    setToken('12|abc')
    const fetchMock = mockApi({ 'GET /user': json(200, { user: candidate }), 'POST /logout': json(204) })
    renderProbe()
    await screen.findByText('Ana Dumitru')

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(await screen.findByText('signed out')).toBeInTheDocument()
    expect(getToken()).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/logout$/), expect.objectContaining({ method: 'POST' }))
  })

  it('signs out locally even when the logout request fails', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: candidate }), 'POST /logout': json(500) })
    renderProbe()
    await screen.findByText('Ana Dumitru')

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(await screen.findByText('signed out')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})
