import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { getToken, setToken } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { bodyOf, candidate, json, mockApi } from '../test/mockApi'
import ChangePasswordPage from './ChangePasswordPage'

const temporary = { ...candidate, must_change_password: true }

function renderAt(path = '/change-password') {
  setToken('1|temporary')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/candidate" element={<ProtectedRoute role="candidate"><p>candidate home</p></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function fill(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText('Parola nouă'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Scrie parola din nou'), { target: { value: confirmation } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvează parola' }))
}

beforeEach(() => {
  localStorage.clear()
})

describe('ChangePasswordPage (DS-018)', () => {
  it('greets the user and hides both fields, with show/hide', async () => {
    mockApi({ 'GET /user': json(200, { user: temporary }) })
    renderAt()

    expect(await screen.findByRole('heading', { level: 1, name: 'Alege-ți o parolă nouă' })).toBeInTheDocument()
    expect(screen.getByText(/Bună, Ana\. Administratorul ți-a setat o parolă temporară\./)).toBeInTheDocument()
    const field = screen.getByLabelText('Parola nouă')
    expect(field).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Scrie parola din nou')).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getAllByRole('button', { name: 'Arată parola' })[0])
    expect(field).toHaveAttribute('type', 'text')
  })

  it('checks the length and the confirmation before sending', async () => {
    const fetchMock = mockApi({ 'GET /user': json(200, { user: temporary }) })
    renderAt()
    await screen.findByRole('heading', { level: 1 })

    fill('scurta', 'scurta')
    expect(screen.getByText('Parola are 6 caractere; are nevoie de cel puțin 8.')).toBeInTheDocument()

    fill('soare-albastru-7', 'soare-albastru-8')
    expect(screen.getByText('Parolele nu sunt la fel.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refuses the temporary password', async () => {
    mockApi({
      'GET /user': json(200, { user: temporary }),
      'PUT /user/password': json(422, { message: 'x', errors: { password: ['same_as_temporary'] } }),
    })
    renderAt()
    await screen.findByRole('heading', { level: 1 })

    fill('lalea-verde-48', 'lalea-verde-48')

    expect(await screen.findByText('Aceasta este parola temporară. Alege una diferită.')).toBeInTheDocument()
  })

  it('saves the new password, keeps the new token and goes home', async () => {
    const fetchMock = mockApi({
      'GET /user': json(200, { user: temporary }),
      'PUT /user/password': json(200, { token: '2|own', user: candidate }),
    })
    renderAt()
    await screen.findByRole('heading', { level: 1 })

    fill('soare-albastru-7', 'soare-albastru-7')

    expect(await screen.findByText('candidate home')).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'PUT /user/password')).toEqual({ password: 'soare-albastru-7', password_confirmation: 'soare-albastru-7' })
    expect(getToken()).toBe('2|own')
  })

  it('says so when the server cannot be reached', async () => {
    mockApi({
      'GET /user': json(200, { user: temporary }),
      'PUT /user/password': () => {
        throw new TypeError('Failed to fetch')
      },
    })
    renderAt()
    await screen.findByRole('heading', { level: 1 })

    fill('soare-albastru-7', 'soare-albastru-7')

    expect(await screen.findByRole('alert')).toHaveTextContent('Parola nu a fost schimbată.')
  })

  it('lets the user sign out instead', async () => {
    mockApi({ 'GET /user': json(200, { user: temporary }), 'POST /logout': json(204) })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Ieși din cont' }))

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('sends a user whose password is not temporary home', async () => {
    mockApi({ 'GET /user': json(200, { user: candidate }) })
    renderAt()
    expect(await screen.findByText('candidate home')).toBeInTheDocument()
  })

  it('sends a signed-out visitor to login', async () => {
    mockApi({})
    render(
      <MemoryRouter initialEntries={['/change-password']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>login page</p>} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  })
})
