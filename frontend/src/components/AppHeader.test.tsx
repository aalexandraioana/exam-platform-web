import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getToken, setToken } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import i18n from '../i18n'
import { administrator, candidate, json, mockApi } from '../test/mockApi'
import AppHeader from './AppHeader'

function renderHeader() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppHeader />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  document.documentElement.dataset.theme = 'light'
})

describe('AppHeader', () => {
  it('shows the brand and no log-out when signed out', () => {
    mockApi({})
    renderHeader()

    expect(screen.getByRole('link', { name: 'Evaluare Digitală' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ieși din cont' })).not.toBeInTheDocument()
  })

  it('switches the theme and saves the choice', () => {
    mockApi({})
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Schimbă tema' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('switches the language', async () => {
    mockApi({})
    renderHeader()
    expect(screen.getByRole('button', { name: 'RO' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(await screen.findByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(i18n.language).toBe('en')
  })

  it('logs out a signed-in user', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: candidate }), 'POST /logout': json(204) })
    renderHeader()

    fireEvent.click(await screen.findByRole('button', { name: 'Ieși din cont' }))

    expect(await screen.findByRole('link', { name: 'Evaluare Digitală' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ieși din cont' })).not.toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})

describe('AppHeader for an Examiner', () => {
  it('shows the Examiner nav with the current screen marked', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: { ...candidate, role: 'examiner' } }) })
    render(
      <MemoryRouter initialEntries={['/examiner/classes']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    const nav = await screen.findByRole('navigation', { name: 'Navigare examinator' })
    expect(within(nav).getByRole('link', { name: 'Clase' })).toHaveAttribute('aria-current', 'page')
  })

  it('lists the Examiner screens in the mocks\' order (DS-006, DS-007, DS-008, DS-013)', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: { ...candidate, role: 'examiner' } }) })
    render(
      <MemoryRouter initialEntries={['/examiner/exams/4']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    const nav = await screen.findByRole('navigation', { name: 'Navigare examinator' })
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['Panou', 'Bancă de întrebări', 'Examene', 'Clase'])
    expect(within(nav).getByRole('link', { name: 'Examene' })).toHaveAttribute('href', '/examiner/exams')
  })

  it('opens the menu drawer with the nav, language, theme and log-out', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: { ...candidate, role: 'examiner' } }) })
    render(
      <MemoryRouter initialEntries={['/examiner']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Deschide meniul' }))
    const drawer = screen.getByRole('dialog', { name: 'Meniu' })
    expect(within(drawer).getByRole('link', { name: 'Clase' })).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'Ieși din cont' })).toBeInTheDocument()

    fireEvent.click(within(drawer).getByRole('button', { name: 'Închide meniul' }))
    expect(screen.queryByRole('dialog', { name: 'Meniu' })).not.toBeInTheDocument()
  })
})

describe('AppHeader for an Administrator', () => {
  it('gives the Administrator the Utilizatori link (DS-011)', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: administrator }) })
    renderHeader()

    const nav = await screen.findByRole('navigation', { name: 'Navigare administrator' })
    expect(within(nav).getByRole('link', { name: 'Utilizatori' })).toHaveAttribute('href', '/admin')
  })

  it('shows no navigation and no log-out button while the password is temporary (DS-018)', async () => {
    setToken('1|t')
    const fetchMock = mockApi({ 'GET /user': json(200, { user: { ...administrator, must_change_password: true } }) })
    renderHeader()

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await act(async () => {})
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ieși din cont' })).not.toBeInTheDocument()
  })
})


describe('AppHeader for a Candidate', () => {
  it('moves language, theme and log-out into the menu drawer on phones, as DS-003 shows', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: candidate }) })
    render(
      <MemoryRouter initialEntries={['/candidate']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    const menu = await screen.findByRole('button', { name: 'Deschide meniul' })
    expect(menu).toHaveClass('tablet:hidden')
    expect(screen.getByRole('button', { name: 'Ieși din cont' })).toHaveClass('hidden', 'tablet:inline-flex')

    fireEvent.click(menu)
    const drawer = screen.getByRole('dialog', { name: 'Meniu' })
    expect(within(drawer).queryByRole('navigation')).not.toBeInTheDocument()
    expect(within(drawer).getByRole('group', { name: 'Limba' })).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'Ieși din cont' })).toBeInTheDocument()
  })
})

describe('AppHeader in the exam room', () => {
  it('is not shown: DS-004 has its own header', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: candidate }) })
    const { container } = render(
      <MemoryRouter initialEntries={['/candidate/attempts/12']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(container.querySelector('header')).toBeNull()
  })
})

describe('AppHeader for an Administrator (P11)', () => {
  it('links the users and the exam supervision (DS-011, DS-012)', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: { ...candidate, role: 'administrator' } }) })
    render(
      <MemoryRouter initialEntries={['/admin/exams']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    const nav = await screen.findByRole('navigation', { name: 'Navigare administrator' })
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['Utilizatori', 'Examene'])
    expect(within(nav).getByRole('link', { name: 'Examene' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Utilizatori' })).toHaveAttribute('href', '/admin')
  })
})

describe('AppHeader dashboard link (P11, Q-099)', () => {
  it('marks Panou on the Examiner landing and links Clase to /examiner/classes', async () => {
    setToken('1|t')
    mockApi({ 'GET /user': json(200, { user: { ...candidate, role: 'examiner' } }) })
    render(
      <MemoryRouter initialEntries={['/examiner']}>
        <AuthProvider>
          <AppHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    const nav = await screen.findByRole('navigation', { name: 'Navigare examinator' })
    expect(within(nav).getByRole('link', { name: 'Panou' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Clase' })).toHaveAttribute('href', '/examiner/classes')
    expect(within(nav).getByRole('link', { name: 'Clase' })).not.toHaveAttribute('aria-current')
  })
})
