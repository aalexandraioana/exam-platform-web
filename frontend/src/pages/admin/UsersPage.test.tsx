import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { administrator, bodyOf, json, mockApi } from '../../test/mockApi'
import UsersPage from './UsersPage'

const user = (id: number, first: string, last: string, role: string, is_active = true) => ({
  id, first_name: first, last_name: last, name: `${first} ${last}`, email: `${first.toLowerCase()}@exemplu.ro`,
  role, is_active, must_change_password: false,
})
const ana = user(9, 'Ana', 'Dumitru', 'candidate')
const bogdan = user(10, 'Bogdan', 'Ilie', 'candidate')
const ioana = user(2, 'Ioana', 'Marin', 'administrator')
const maria = user(8, 'Maria', 'Popa', 'examiner')
const elena = user(11, 'Elena', 'Vasilescu', 'candidate', false)
const users = [ana, bogdan, administrator, ioana, maria, elena]

const base = { 'GET /user': json(200, { user: administrator }), 'GET /admin/users': json(200, { users }) }

function renderPage() {
  setToken('1|t')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UsersPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) })

beforeEach(() => {
  localStorage.clear()
})

describe('UsersPage (DS-011)', () => {
  it('lists every user with role, status and the actions each one allows', async () => {
    mockApi(base)
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Utilizatori' })).toBeInTheDocument()
    await screen.findByText('Ana Dumitru')

    expect(within(row('Ana Dumitru')).getAllByText('Candidat').length).toBeGreaterThan(0)
    expect(within(row('Ana Dumitru')).getByRole('button', { name: 'Parolă temporară pentru Ana Dumitru' })).toBeInTheDocument()
    expect(within(row('Ana Dumitru')).getByRole('button', { name: 'Dezactivează contul lui Ana Dumitru' })).toBeInTheDocument()
    expect(within(row('Maria Popa')).getByRole('button', { name: 'Dezactivează contul lui Maria Popa' })).toBeInTheDocument()

    // D-056: no Administrator is deactivated; one's own row has no actions.
    expect(within(row('Ioana Marin')).getByRole('button', { name: 'Parolă temporară pentru Ioana Marin' })).toBeInTheDocument()
    expect(within(row('Ioana Marin')).queryByRole('button', { name: /Dezactivează/ })).not.toBeInTheDocument()
    expect(within(row('Radu Ionescu')).getByText('(tu)')).toBeInTheDocument()
    expect(within(row('Radu Ionescu')).queryByRole('button')).not.toBeInTheDocument()

    // D-056: a deactivated account has no actions.
    expect(within(row('Elena Vasilescu')).getAllByText('Dezactivat').length).toBeGreaterThan(0)
    expect(within(row('Elena Vasilescu')).getByText('Cont dezactivat')).toBeInTheDocument()
    expect(within(row('Elena Vasilescu')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('searches by name or email', async () => {
    mockApi(base)
    renderPage()
    await screen.findByText('Ana Dumitru')
    const search = screen.getByRole('searchbox', { name: 'Caută după nume sau email' })

    fireEvent.change(search, { target: { value: 'maria@' } })
    expect(screen.getByText('Maria Popa')).toBeInTheDocument()
    expect(screen.queryByText('Ana Dumitru')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'zamfir' } })
    expect(screen.getByText('Niciun utilizator nu se potrivește cu „zamfir”. Verifică numele sau emailul.')).toBeInTheDocument()
  })

  it('sets a temporary password typed twice, hidden', async () => {
    const fetchMock = mockApi({ ...base, 'PUT /admin/users/10/password': json(204) })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Parolă temporară pentru Bogdan Ilie' }))
    const dialog = screen.getByRole('dialog', { name: 'Parolă temporară pentru Bogdan Ilie' })
    const field = within(dialog).getByLabelText('Parola temporară')
    const again = within(dialog).getByLabelText('Scrie parola din nou')
    expect(field).toHaveAttribute('type', 'password')
    expect(again).toHaveAttribute('type', 'password')
    const submit = within(dialog).getByRole('button', { name: 'Setează parola temporară' })

    fireEvent.change(field, { target: { value: 'scurta' } })
    fireEvent.click(submit)
    expect(within(dialog).getByText('Parola are 6 caractere; are nevoie de cel puțin 8.')).toBeInTheDocument()

    fireEvent.change(field, { target: { value: 'lalea-verde-48' } })
    fireEvent.change(again, { target: { value: 'lalea-verde' } })
    fireEvent.click(submit)
    expect(within(dialog).getByText('Parolele nu sunt la fel.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)

    fireEvent.change(again, { target: { value: 'lalea-verde-48' } })
    fireEvent.click(submit)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(bodyOf(fetchMock, 'PUT /admin/users/10/password')).toEqual({ password: 'lalea-verde-48' })
    expect(screen.getByRole('status')).toHaveTextContent('Parola temporară pentru Bogdan Ilie a fost setată.')
  })

  it('creates an examiner with a temporary password and adds them to the list', async () => {
    const created = user(12, 'Mihai', 'Stan', 'examiner')
    let taken = true
    const fetchMock = mockApi({
      ...base,
      'POST /admin/examiners': () =>
        taken
          ? ((taken = false), json(422, { message: 'x', errors: { email: ['taken'] } }))
          : json(201, { user: { ...created, must_change_password: true } }),
    })
    renderPage()
    await screen.findByText('Ana Dumitru')

    fireEvent.click(screen.getByRole('button', { name: 'Examinator nou' }))
    const dialog = screen.getByRole('dialog', { name: 'Examinator nou' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează contul' }))
    expect(within(dialog).getByText('Scrie prenumele.')).toBeInTheDocument()
    expect(within(dialog).getByText('Scrie numele de familie.')).toBeInTheDocument()
    expect(within(dialog).getByText('Scrie o adresă de email întreagă, de exemplu nume@exemplu.ro.')).toBeInTheDocument()
    expect(within(dialog).getByText('Scrie parola.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Prenume'), { target: { value: ' Mihai ' } })
    fireEvent.change(within(dialog).getByLabelText('Nume'), { target: { value: 'Stan' } })
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'mihai@exemplu.ro' } })
    expect(within(dialog).getByLabelText('Parola temporară')).toHaveAttribute('type', 'password')
    fireEvent.change(within(dialog).getByLabelText('Parola temporară'), { target: { value: 'tei-inflorit-21' } })
    fireEvent.change(within(dialog).getByLabelText('Scrie parola din nou'), { target: { value: 'tei-inflorit-21' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează contul' }))

    expect(await within(dialog).findByText('Există deja un cont cu acest email. Folosește alt email.')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează contul' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(bodyOf(fetchMock, 'POST /admin/examiners')).toEqual({
      first_name: 'Mihai', last_name: 'Stan', email: 'mihai@exemplu.ro', password: 'tei-inflorit-21',
    })
    expect(screen.getByRole('status')).toHaveTextContent('Contul examinatorului Mihai Stan a fost creat.')
    expect(within(row('Mihai Stan')).getAllByText('Examinator').length).toBeGreaterThan(0)
  })

  it('deactivates after a confirmation; the row then shows the account as deactivated', async () => {
    const fetchMock = mockApi({ ...base, 'PATCH /admin/users/10': json(200, { user: { ...bogdan, is_active: false } }) })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Dezactivează contul lui Bogdan Ilie' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Dezactivezi contul lui Bogdan Ilie?' })
    expect(dialog).toHaveTextContent('Contul nu mai poate fi reactivat.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dezactivează contul' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(bodyOf(fetchMock, 'PATCH /admin/users/10')).toEqual({ is_active: false })
    expect(within(row('Bogdan Ilie')).getByText('Cont dezactivat')).toBeInTheDocument()
    expect(within(row('Bogdan Ilie')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers to try again when the list cannot be loaded', async () => {
    let calls = 0
    mockApi({
      'GET /user': json(200, { user: administrator }),
      'GET /admin/users': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { users })
      },
    })
    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Lista de utilizatori nu s-a încărcat.')
    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))

    expect(await screen.findByText('Ana Dumitru')).toBeInTheDocument()
  })
})
