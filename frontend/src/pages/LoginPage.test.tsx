import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getToken, setToken } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import { bodyOf, candidate, examiner, json, mockApi } from '../test/mockApi'
import LoginPage from './LoginPage'

function renderAt(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<p>register page</p>} />
          <Route path="/candidate" element={<p>candidate home</p>} />
          <Route path="/examiner" element={<p>examiner home</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function fillIn(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Parola'), { target: { value: password } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Intră în cont' }))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LoginPage (DS-001)', () => {
  it('shows the screen as in the mock', () => {
    mockApi({})
    renderAt()

    expect(screen.getByRole('heading', { level: 1, name: 'Intră în cont' })).toBeInTheDocument()
    expect(screen.getByText('Pentru candidați, examinatori și administratori.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Înregistrează-te ca candidat' })).toHaveAttribute('href', '/register')
    expect(screen.getByText('Conturile de examinator le creează administratorul platformei.')).toBeInTheDocument()
  })

  it('checks empty fields without calling the API', () => {
    const fetchMock = mockApi({})
    renderAt()

    submit()

    expect(screen.getByText('Scrie o adresă de email întreagă, de exemplu nume@exemplu.ro.')).toBeInTheDocument()
    expect(screen.getByText('Scrie parola.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Parola')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('checks the email format', () => {
    const fetchMock = mockApi({})
    renderAt()

    fillIn('ana.dumitru@', 'parola-mea')
    submit()

    expect(screen.getByText('Scrie o adresă de email întreagă, de exemplu nume@exemplu.ro.')).toBeInTheDocument()
    expect(screen.queryByText('Scrie parola.')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logs in and lands on the home of the role', async () => {
    const fetchMock = mockApi({ 'POST /login': json(200, { token: '13|new', user: examiner }) })
    renderAt()

    fillIn('maria.popa@exemplu.ro', 'parola-mea')
    submit()

    expect(await screen.findByText('examiner home')).toBeInTheDocument()
    expect(getToken()).toBe('13|new')
    expect(bodyOf(fetchMock)).toEqual({ email: 'maria.popa@exemplu.ro', password: 'parola-mea' })
  })

  it('shows the loading button while checking', async () => {
    mockApi({ 'POST /login': () => new Promise<Response>(() => {}) })
    renderAt()

    fillIn('ana.dumitru@exemplu.ro', 'parola-mea')
    submit()

    expect(await screen.findByRole('button', { name: 'Se verifică…' })).toBeDisabled()
  })

  it('shows the server-waking banner when login takes more than 5 seconds', async () => {
    vi.useFakeTimers()
    mockApi({ 'POST /login': () => new Promise<Response>(() => {}) })
    renderAt()

    fillIn('ana.dumitru@exemplu.ro', 'parola-mea')
    submit()
    await act(async () => {
      vi.advanceTimersByTime(4999)
    })
    expect(screen.queryByText('Serverul pornește.')).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Serverul pornește. După o pauză, prima conectare durează până la un minut. Nu închide pagina.',
    )
  })

  it('shows the wrong-credentials banner on 422 credentials', async () => {
    mockApi({ 'POST /login': json(422, { message: 'Invalid.', errors: { email: ['credentials'] } }) })
    renderAt()

    fillIn('ana.dumitru@exemplu.ro', 'gresita1')
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Emailul sau parola nu sunt corecte. Verifică-le și încearcă din nou.',
    )
  })

  it('shows the deactivated banner on 403 account_inactive', async () => {
    mockApi({ 'POST /login': json(403, { code: 'account_inactive', message: 'This account is deactivated.' }) })
    renderAt()

    fillIn('ana.dumitru@exemplu.ro', 'parola-mea')
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Contul tău este dezactivat. Cere-i administratorului platformei să îl reactiveze.',
    )
    expect(getToken()).toBeNull()
  })

  it('shows the throttled banner on 429', async () => {
    mockApi({ 'POST /login': json(429, { message: 'Too Many Attempts.' }) })
    renderAt()

    fillIn('ana.dumitru@exemplu.ro', 'parola-mea')
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Prea multe autentificări eșuate. Așteaptă un minut și încearcă din nou.')
  })

  it('shows the offline banner and retries', async () => {
    let calls = 0
    mockApi({
      'POST /login': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { token: '13|new', user: candidate })
      },
    })
    renderAt()

    fillIn('ana.dumitru@exemplu.ro', 'parola-mea')
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nu ne-am putut conecta la server. Verifică internetul și încearcă din nou.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }))

    expect(await screen.findByText('candidate home')).toBeInTheDocument()
  })

  it('opens and closes the forgot-password note', () => {
    mockApi({})
    renderAt()
    const toggle = screen.getByRole('button', { name: 'Ai uitat parola?' })
    const note =
      'Nu trimitem linkuri de resetare pe email. Cere-i examinatorului clasei tale sau administratorului o parolă nouă.'
    expect(screen.queryByText(note)).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(screen.getByText(note)).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggle)
    expect(screen.queryByText(note)).not.toBeInTheDocument()
  })

  it('shows and hides the password', () => {
    mockApi({})
    renderAt()
    const password = screen.getByLabelText('Parola')
    expect(password).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Arată parola' }))
    expect(password).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Ascunde parola' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('sends a signed-in user to their home', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: candidate }) })

    renderAt()

    expect(await screen.findByText('candidate home')).toBeInTheDocument()
  })
})
