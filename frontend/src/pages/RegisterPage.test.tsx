import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { getToken } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import { bodyOf, candidate, json, mockApi } from '../test/mockApi'
import RegisterPage from './RegisterPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/candidate" element={<p>candidate home</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillValid() {
  type('Nume și prenume', 'Ana Dumitru')
  type('Email', 'ana.dumitru@exemplu.ro')
  type('Parola', 'lalea-verde-48')
  type('Scrie parola din nou', 'lalea-verde-48')
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Creează contul' }))
}

beforeEach(() => {
  localStorage.clear()
})

describe('RegisterPage (DS-002)', () => {
  it('shows the screen as in the mock', () => {
    mockApi({})
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Creează-ți cont de candidat' })).toBeInTheDocument()
    expect(screen.getByText('Cel puțin 8 caractere.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Codul clasei/)).toHaveAttribute('placeholder', 'K7Q-4MX')
    expect(screen.getByRole('link', { name: 'Intră în cont' })).toHaveAttribute('href', '/login')
    expect(screen.getByText('Ești examinator? Contul tău îl creează administratorul platformei.')).toBeInTheDocument()
  })

  it('checks every field before calling the API', () => {
    const fetchMock = mockApi({})
    renderPage()

    type('Email', 'ana.dumitru@')
    type('Parola', 'abc12')
    type('Scrie parola din nou', 'abc123')
    submit()

    expect(screen.getByRole('alert')).toHaveTextContent('Mai sunt 4 câmpuri de corectat. Le găsești marcate mai jos.')
    expect(screen.getByText('Scrie-ți numele, așa cum îl știe examinatorul clasei.')).toBeInTheDocument()
    expect(screen.getByText('Scrie o adresă de email întreagă, de exemplu nume@exemplu.ro.')).toBeInTheDocument()
    expect(screen.getByText('Parola are 5 caractere; are nevoie de cel puțin 8.')).toBeInTheDocument()
    expect(screen.getByText('Parolele nu sunt la fel.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nume și prenume')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the singular when one field is left', () => {
    mockApi({})
    renderPage()

    fillValid()
    type('Nume și prenume', '')
    submit()

    expect(screen.getByRole('alert')).toHaveTextContent('Mai este 1 câmp de corectat. Îl găsești marcat mai jos.')
  })

  it('creates the account and lands on the Candidate home', async () => {
    const fetchMock = mockApi({ 'POST /register': json(201, { token: '14|new', user: candidate }) })
    renderPage()

    fillValid()
    type('Codul clasei (opțional)', 'k7q-4mx')
    submit()

    expect(await screen.findByText('candidate home')).toBeInTheDocument()
    expect(getToken()).toBe('14|new')
    expect(bodyOf(fetchMock)).toEqual({
      name: 'Ana Dumitru',
      email: 'ana.dumitru@exemplu.ro',
      password: 'lalea-verde-48',
      password_confirmation: 'lalea-verde-48',
      class_code: 'k7q-4mx',
    })
  })

  it('does not send an empty class code', async () => {
    const fetchMock = mockApi({ 'POST /register': json(201, { token: '14|new', user: candidate }) })
    renderPage()

    fillValid()
    submit()

    await screen.findByText('candidate home')
    expect(bodyOf(fetchMock)).not.toHaveProperty('class_code')
  })

  it('shows the loading button while creating the account', async () => {
    mockApi({ 'POST /register': () => new Promise<Response>(() => {}) })
    renderPage()

    fillValid()
    submit()

    expect(await screen.findByRole('button', { name: 'Se creează contul…' })).toBeDisabled()
  })

  it('maps a taken email to the email field, with a link to log in', async () => {
    mockApi({ 'POST /register': json(422, { message: 'Invalid.', errors: { email: ['taken'] } }) })
    renderPage()

    fillValid()
    submit()

    const error = await screen.findByText(/Există deja un cont cu acest email\./)
    expect(error).toHaveTextContent('Există deja un cont cu acest email. Intră în cont sau folosește alt email.')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('link', { name: 'Intră în cont' })[0]).toHaveAttribute('href', '/login')
  })

  it('maps a class code that matches no class to the code field', async () => {
    mockApi({ 'POST /register': json(422, { message: 'Invalid.', errors: { class_code: ['not_found'] } }) })
    renderPage()

    fillValid()
    type('Codul clasei (opțional)', 'K7Q-4NX')
    submit()

    expect(
      await screen.findByText(
        'Niciun cod de clasă nu se potrivește. Verifică-l cu examinatorul clasei sau lasă câmpul gol și adaugă codul mai târziu.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Codul clasei (opțional)')).toHaveAttribute('aria-invalid', 'true')
  })

  it('maps server password codes to their fields', async () => {
    mockApi({
      'POST /register': json(422, { message: 'Invalid.', errors: { password: ['mismatch'], name: ['required'] } }),
    })
    renderPage()

    fillValid()
    submit()

    expect(await screen.findByText('Parolele nu sunt la fel.')).toBeInTheDocument()
    expect(screen.getByText('Scrie-ți numele, așa cum îl știe examinatorul clasei.')).toBeInTheDocument()
  })

  it('keeps the typed data when the server cannot be reached', async () => {
    mockApi({
      'POST /register': () => {
        throw new TypeError('Failed to fetch')
      },
    })
    renderPage()

    fillValid()
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Contul nu a fost creat. Nu ne-am putut conecta la server. Datele scrise rămân aici; încearcă din nou.',
    )
    expect(screen.getByLabelText('Nume și prenume')).toHaveValue('Ana Dumitru')
    expect(screen.getByLabelText('Email')).toHaveValue('ana.dumitru@exemplu.ro')
    expect(screen.getByRole('button', { name: 'Încearcă din nou' })).toBeInTheDocument()
  })
})

describe('RegisterPage focus after a failed submit', () => {
  it('moves focus to the first invalid field of the client checks', () => {
    mockApi({})
    renderPage()

    type('Email', 'ana.dumitru@exemplu.ro')
    type('Parola', 'abc12')
    submit()

    expect(screen.getByLabelText('Nume și prenume')).toHaveFocus()
  })

  it('moves focus to the first field the server marks invalid, in form order', async () => {
    mockApi({
      'POST /register': json(422, { message: 'Invalid.', errors: { class_code: ['not_found'], email: ['taken'] } }),
    })
    renderPage()

    fillValid()
    type('Codul clasei (opțional)', 'K7Q-4NX')
    submit()

    await screen.findByText(/Există deja un cont cu acest email\./)
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })
})
