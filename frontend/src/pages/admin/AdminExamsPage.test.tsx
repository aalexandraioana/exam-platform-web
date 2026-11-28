import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { administrator, json, mockApi } from '../../test/mockApi'
import AdminExamsPage from './AdminExamsPage'

const exam = (id: number, title: string, examiner: string, status: string, state: string | null, extra: object = {}) => ({
  id, title, examiner: { id: id + 100, name: examiner }, status, state,
  available_from: null, available_until: null, results_published_at: null, classes: [], attempts: { submitted: 0, graded: 0 }, ...extra,
})
const exams = [
  exam(6, 'Evaluare Unitatea 3: Rapoarte și proporții', 'Maria Popa', 'published', 'open', {
    available_from: '2026-11-30T07:00:00+00:00', available_until: '2026-11-30T10:00:00+00:00',
    classes: [{ id: 1, name: '6A' }, { id: 2, name: '6B' }], attempts: { submitted: 9, graded: 4 },
  }),
  exam(5, 'Evaluare finală semestrul I', 'Maria Popa', 'published', 'upcoming'),
  exam(4, 'Evaluare Unitatea 2: Unghiuri', 'Maria Popa', 'published', 'closed', { results_published_at: '2026-11-22T10:00:00+00:00', attempts: { submitted: 24, graded: 24 } }),
  exam(3, 'Evaluare Unitatea 1: Numere naturale', 'Ion Rusu', 'published', 'closed', { attempts: { submitted: 18, graded: 12 } }),
  exam(2, 'Fracții ordinare (în lucru)', 'Ion Rusu', 'draft', null),
]

function renderPage() {
  setToken('1|t')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminExamsPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const rowOf = (title: string) => screen.getByText(title).closest('tr')!

beforeEach(() => {
  localStorage.clear()
})

describe('AdminExamsPage (DS-012, C-009, Q-098)', () => {
  it('lists every exam with its Examiner, state, window, classes and Attempt counts, read-only', async () => {
    mockApi({ 'GET /user': json(200, { user: administrator }), 'GET /admin/exams': json(200, { exams }) })
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Examene' })).toBeInTheDocument()
    await screen.findByText('Evaluare Unitatea 3: Rapoarte și proporții')
    const open = rowOf('Evaluare Unitatea 3: Rapoarte și proporții')
    expect(within(open).getByText('Maria Popa')).toBeInTheDocument()
    expect(within(open).getByText('Deschis')).toBeInTheDocument()
    expect(within(open).getByText('30.11.2026, 09:00 – 12:00')).toBeInTheDocument()
    expect(within(open).getByText('6A, 6B')).toBeInTheDocument()
    expect(within(open).getByText('9 / 4')).toBeInTheDocument()
    expect(within(rowOf('Evaluare finală semestrul I')).getByText('Urmează')).toBeInTheDocument()
    const published = rowOf('Evaluare Unitatea 2: Unghiuri')
    expect(within(published).getByText('Închis')).toBeInTheDocument()
    expect(within(published).getByText('Rezultate publicate')).toBeInTheDocument()
    const draft = rowOf('Fracții ordinare (în lucru)')
    expect(within(draft).getByText('Ciornă')).toBeInTheDocument()
    expect(within(draft).getByText('nicio clasă')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryAllByRole('button')).toHaveLength(0)
  })

  it('filters by state: active, archived, drafts, all', async () => {
    mockApi({ 'GET /user': json(200, { user: administrator }), 'GET /admin/exams': json(200, { exams }) })
    renderPage()
    await screen.findByText('Evaluare Unitatea 3: Rapoarte și proporții')
    const titles = () => within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => r.querySelector('td')!.textContent)
    const filter = screen.getByLabelText('Arată')

    expect(within(filter).getAllByRole('option').map((o) => o.textContent)).toEqual(['Toate (5)', 'Active (2)', 'Arhivate (2)', 'Ciorne (1)'])
    fireEvent.change(filter, { target: { value: 'active' } })
    expect(titles()).toEqual([expect.stringContaining('Evaluare Unitatea 3'), expect.stringContaining('Evaluare finală')])
    fireEvent.change(filter, { target: { value: 'archived' } })
    expect(titles()).toEqual([expect.stringContaining('Unitatea 2'), expect.stringContaining('Unitatea 1')])
    fireEvent.change(filter, { target: { value: 'drafts' } })
    expect(titles()).toEqual([expect.stringContaining('Fracții ordinare')])
    fireEvent.change(filter, { target: { value: 'all' } })
    expect(titles()).toHaveLength(5)
  })

  it('says when a filter matches nothing', async () => {
    mockApi({ 'GET /user': json(200, { user: administrator }), 'GET /admin/exams': json(200, { exams: exams.filter((e) => e.state !== 'closed') }) })
    renderPage()
    await screen.findByText('Evaluare Unitatea 3: Rapoarte și proporții')

    fireEvent.change(screen.getByLabelText('Arată'), { target: { value: 'archived' } })
    expect(screen.getByText('Niciun examen arhivat încă. Un examen ajunge aici după ce i se închide fereastra.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the empty state when there is no exam at all', async () => {
    mockApi({ 'GET /user': json(200, { user: administrator }), 'GET /admin/exams': json(200, { exams: [] }) })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Încă nu există examene' })).toBeInTheDocument()
  })

  it('shows a loading state, then an error with retry', async () => {
    let calls = 0
    mockApi({
      'GET /user': json(200, { user: administrator }),
      'GET /admin/exams': () => (++calls === 1 ? json(500) : json(200, { exams })),
    })
    renderPage()

    expect(screen.getByLabelText('Se încarcă examenele')).toBeInTheDocument()
    expect(await screen.findByText(/Lista de examene nu s-a încărcat\./)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByText('Evaluare Unitatea 3: Rapoarte și proporții')).toBeInTheDocument()
  })
})
