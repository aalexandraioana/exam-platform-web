import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { examiner, json, mockApi } from '../../test/mockApi'
import ExaminerDashboardPage from './ExaminerDashboardPage'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderPage() {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={['/examiner']}>
      <AuthProvider>
        <Routes>
          <Route path="/examiner" element={<ExaminerDashboardPage />} />
          <Route path="*" element={null} />
        </Routes>
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const dashboard = {
  counts: { active_exams: 2, attempts_in_progress: 11, awaiting_grading: 7 },
  exams: [
    { id: 12, title: 'Evaluare Unitatea 3: Rapoarte și proporții', state: 'open', available_until: '2026-11-30T10:00:00+00:00', in_progress: 8, awaiting_grading: 3, results_published: false },
    { id: 9, title: 'Test de recapitulare la fracții zecimale', state: 'open', available_until: null, in_progress: 3, awaiting_grading: 0, results_published: false },
    { id: 7, title: 'Evaluare Unitatea 2: Unghiuri', state: 'closed', available_until: '2026-11-20T10:00:00+00:00', in_progress: 0, awaiting_grading: 4, results_published: false },
  ],
}
const none = { counts: { active_exams: 0, attempts_in_progress: 0, awaiting_grading: 0 }, exams: [] }

beforeEach(() => {
  localStorage.clear()
})

describe('ExaminerDashboardPage (DS-006, C-009)', () => {
  it('shows the three counts', async () => {
    mockApi({ 'GET /user': json(200, { user: examiner }), 'GET /examiner/dashboard': json(200, dashboard) })
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Panou' })).toBeInTheDocument()
    expect((await screen.findByText('Examene active')).parentElement).toHaveTextContent('2')
    expect(screen.getByText('Încercări în desfășurare').parentElement).toHaveTextContent('11')
    expect(screen.getByText('Încercări de corectat').parentElement).toHaveTextContent('7')
  })

  it('lists the exams that need attention, each linking to its grading', async () => {
    mockApi({ 'GET /user': json(200, { user: examiner }), 'GET /examiner/dashboard': json(200, dashboard) })
    renderPage()

    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Evaluare Unitatea 3: Rapoarte și proporții')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Deschis')).toBeInTheDocument()
    expect(within(rows[0]).getByText(/Se închide pe 30\.11\.2026, 12:00/)).toBeInTheDocument()
    expect(within(rows[1]).getByText('Fără dată de închidere')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Închis')).toBeInTheDocument()
    expect(within(rows[2]).getByText(/Închis pe 20\.11\.2026, 12:00/)).toBeInTheDocument()

    fireEvent.click(within(rows[2]).getByRole('link', { name: 'Corectează' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/examiner/exams/7/grading')
  })

  it('says there is nothing to do when nothing is open or waiting', async () => {
    mockApi({ 'GET /user': json(200, { user: examiner }), 'GET /examiner/dashboard': json(200, { ...none, counts: { ...none.counts } }), 'GET /exams': json(200, { exams: [{ id: 1, status: 'published' }] }) })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Nimic de făcut acum' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Vezi examenele' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/examiner/exams')
  })

  it('offers a new exam when none is published yet', async () => {
    mockApi({ 'GET /user': json(200, { user: examiner }), 'GET /examiner/dashboard': json(200, none), 'GET /exams': json(200, { exams: [] }) })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Încă nu ai publicat niciun examen' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Examen nou' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/examiner/exams/new')
  })

  it('shows a loading state, then an error with retry', async () => {
    let calls = 0
    mockApi({
      'GET /user': json(200, { user: examiner }),
      'GET /examiner/dashboard': () => (++calls === 1 ? json(500) : json(200, dashboard)),
    })
    renderPage()

    expect(screen.getByLabelText('Se încarcă panoul')).toBeInTheDocument()
    expect(await screen.findByText('Panoul nu s-a putut încărca. Verifică conexiunea și încearcă din nou.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByText('Evaluare Unitatea 3: Rapoarte și proporții')).toBeInTheDocument()
  })
})
