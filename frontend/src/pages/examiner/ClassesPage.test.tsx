import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { bodyOf, examiner, json, mockApi } from '../../test/mockApi'
import ClassesPage from './ClassesPage'

const classA = { id: 1, name: 'Clasa a VI-a A', join_code: 'K7Q-4MX', pending_count: 1, candidate_count: 2, published_exam_count: 2 }
const classB = { id: 2, name: 'Clasa a VI-a B', join_code: 'PQR-7ST', pending_count: 0, candidate_count: 26, published_exam_count: 0 }

const detailA = {
  class: classA,
  requests: [{ id: 41, candidate: { id: 30, name: 'Matei Radu', email: 'matei.radu@exemplu.ro' }, requested_at: new Date(Date.now() - 10 * 60_000).toISOString() }],
  candidates: [
    { id: 9, name: 'Ana Dumitru', email: 'ana.d@exemplu.ro', joined_at: '2026-09-12T08:00:00Z' },
    { id: 10, name: 'Bogdan Ilie', email: 'bogdan.ilie@exemplu.ro', joined_at: '2026-09-14T08:00:00Z' },
  ],
}
const detailB = { class: classB, requests: [], candidates: [] }

function renderPage() {
  setToken('1|t')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ClassesPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const base = {
  'GET /user': json(200, { user: examiner }),
  'GET /classes/1': json(200, detailA),
  'GET /classes/2': json(200, detailB),
}

beforeEach(() => {
  localStorage.clear()
})

describe('ClassesPage (DS-013)', () => {
  it('lists the classes and shows the first with its code, requests and roster', async () => {
    mockApi({ ...base, 'GET /classes': json(200, { classes: [classA, classB] }) })
    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Clase' })).toBeInTheDocument()
    const list = await screen.findByRole('navigation', { name: 'Clasele mele' })
    expect(within(list).getByRole('link', { name: /Clasa a VI-a A/ })).toHaveAttribute('aria-current', 'true')
    expect(within(list).getByText('1 cerere')).toBeInTheDocument()
    expect(within(list).getByText('2 candidați · 2 examene publicate')).toBeInTheDocument()
    expect(within(list).getByText('26 de candidați · niciun examen')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { level: 2, name: 'Clasa a VI-a A' })).toBeInTheDocument()
    expect(screen.getByText('K7Q-4MX')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cereri în așteptare (1)' })).toBeInTheDocument()
    expect(screen.getByText('Matei Radu')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Candidați (2)' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Ana Dumitru' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '12.09.2026' })).toBeInTheDocument()
  })

  it('shows the empty state when there are no classes', async () => {
    mockApi({ ...base, 'GET /classes': json(200, { classes: [] }) })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Încă nu ai nicio clasă' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Creează prima clasă' })).toBeInTheDocument()
  })

  it('says when a class has no pending requests', async () => {
    mockApi({ ...base, 'GET /classes': json(200, { classes: [classB] }) })
    renderPage()

    expect(
      await screen.findByText('Nicio cerere în așteptare. Când un candidat introduce codul clasei, cererea lui apare aici.'),
    ).toBeInTheDocument()
  })

  it('shows another class when it is picked', async () => {
    mockApi({ ...base, 'GET /classes': json(200, { classes: [classA, classB] }) })
    renderPage()

    fireEvent.click(await screen.findByRole('link', { name: /Clasa a VI-a B/ }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Clasa a VI-a B' })).toBeInTheDocument()
    expect(screen.getByText('PQR-7ST')).toBeInTheDocument()
  })

  it('creates a class from the dialog and selects it', async () => {
    const created = { ...classB, id: 3, name: 'Clasa a VII-a A', join_code: 'XYZ-234' }
    const fetchMock = mockApi({
      ...base,
      'GET /classes': json(200, { classes: [classA] }),
      'POST /classes': json(201, { class: created }),
      'GET /classes/3': json(200, { class: created, requests: [], candidates: [] }),
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Clasă nouă' }))
    const dialog = screen.getByRole('dialog', { name: 'Clasă nouă' })
    fireEvent.change(within(dialog).getByLabelText('Numele clasei'), { target: { value: 'Clasa a VII-a A' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează clasa' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Clasa a VII-a A' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bodyOf(fetchMock, 'POST /classes')).toEqual({ name: 'Clasa a VII-a A' })
  })

  it('asks for a name before creating a class', async () => {
    const fetchMock = mockApi({ ...base, 'GET /classes': json(200, { classes: [classA] }) })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Clasă nouă' }))
    fireEvent.click(screen.getByRole('button', { name: 'Creează clasa' }))

    expect(screen.getByText('Scrie numele clasei.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('renames the class from a dialog', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /classes': json(200, { classes: [classA] }),
      'PATCH /classes/1': json(200, { class: { ...classA, name: 'Clasa a VI-a C' } }),
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Redenumește' }))
    const dialog = screen.getByRole('dialog', { name: 'Redenumește clasa' })
    const input = within(dialog).getByLabelText('Numele clasei')
    expect(input).toHaveValue('Clasa a VI-a A')
    fireEvent.change(input, { target: { value: 'Clasa a VI-a C' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvează' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Clasa a VI-a C' })).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'PATCH /classes/1')).toEqual({ name: 'Clasa a VI-a C' })
  })

  it('accepts and declines requests, then refreshes the class', async () => {
    let accepted = false
    mockApi({
      ...base,
      'GET /classes': json(200, { classes: [classA] }),
      'GET /classes/1': () =>
        json(200, accepted
          ? { ...detailA, requests: [], candidates: [...detailA.candidates, { id: 30, name: 'Matei Radu', email: 'matei.radu@exemplu.ro', joined_at: '2026-11-23T18:45:00Z' }] }
          : detailA),
      'POST /memberships/41/accept': () => {
        accepted = true
        return json(200, { membership: { id: 41, status: 'accepted', decided_at: '2026-11-23T18:45:00Z' } })
      },
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Acceptă cererea lui Matei Radu' }))

    expect(await screen.findByRole('cell', { name: 'Matei Radu' })).toBeInTheDocument()
    expect(screen.getByText('Nicio cerere în așteptare. Când un candidat introduce codul clasei, cererea lui apare aici.')).toBeInTheDocument()
  })

  it('declines a request', async () => {
    let declined = false
    const fetchMock = mockApi({
      ...base,
      'GET /classes': json(200, { classes: [classA] }),
      'GET /classes/1': () => json(200, declined ? { ...detailA, requests: [] } : detailA),
      'POST /memberships/41/decline': () => {
        declined = true
        return json(200, { membership: { id: 41, status: 'rejected', decided_at: '2026-11-23T18:45:00Z' } })
      },
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Respinge cererea lui Matei Radu' }))

    await waitFor(() => expect(screen.queryByText('Matei Radu')).not.toBeInTheDocument())
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/memberships/41/decline') && init?.method === 'POST')).toBe(true)
  })

  it('explains a failed accept and offers to try again', async () => {
    let calls = 0
    mockApi({
      ...base,
      'GET /classes': json(200, { classes: [classA] }),
      'POST /memberships/41/accept': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { membership: { id: 41, status: 'accepted', decided_at: '2026-11-23T18:45:00Z' } })
      },
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Acceptă cererea lui Matei Radu' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Cererea lui Matei Radu nu a putut fi acceptată. Conexiunea s-a întrerupt. Cererea rămâne în așteptare; încearcă din nou.',
    )
    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(calls).toBe(2)
  })

  it('replaces the join code', async () => {
    mockApi({
      ...base,
      'GET /classes': json(200, { classes: [classA] }),
      'POST /classes/1/join-code': json(200, { class: { ...classA, join_code: 'NEW-234' } }),
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Generează alt cod' }))

    expect(await screen.findByText('NEW-234')).toBeInTheDocument()
  })

  it('copies the join code', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    mockApi({ ...base, 'GET /classes': json(200, { classes: [classA] }) })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Copiază' }))

    expect(writeText).toHaveBeenCalledWith('K7Q-4MX')
  })

  it('filters the roster by name or email', async () => {
    mockApi({ ...base, 'GET /classes': json(200, { classes: [classA] }) })
    renderPage()

    fireEvent.change(await screen.findByLabelText('Caută un candidat'), { target: { value: 'bogdan' } })

    expect(screen.queryByRole('cell', { name: 'Ana Dumitru' })).not.toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Bogdan Ilie' })).toBeInTheDocument()
  })

  it('has no new-password button in the roster (D-054: only the Administrator sets passwords)', async () => {
    mockApi({ ...base, 'GET /classes': json(200, { classes: [classA] }) })
    renderPage()

    expect(await screen.findByRole('cell', { name: 'Bogdan Ilie' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Parolă nouă/ })).not.toBeInTheDocument()
  })

  it('offers to try again when the classes cannot be loaded', async () => {
    let calls = 0
    mockApi({
      ...base,
      'GET /classes': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { classes: [classA] })
      },
    })
    renderPage()

    const alert = await screen.findByRole('alert')
    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Clasa a VI-a A' })).toBeInTheDocument()
  })
})
