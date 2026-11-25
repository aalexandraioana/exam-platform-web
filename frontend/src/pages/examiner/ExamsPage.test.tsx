import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { examiner, json, mockApi } from '../../test/mockApi'
import ExamsPage from './ExamsPage'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderPage() {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={['/examiner/exams']}>
      <AuthProvider>
        <Routes>
          <Route path="/examiner/exams" element={<ExamsPage />} />
          <Route path="*" element={null} />
        </Routes>
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const exams = [
  { id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții', status: 'draft', grade_level: 6, available_from: '2026-11-30T06:00:00+00:00', available_until: '2026-11-30T12:00:00+00:00', published_at: null, classes: [{ id: 1, name: 'Clasa a VI-a A' }, { id: 2, name: 'Clasa a VI-a B' }], item_count: 9 },
  { id: 2, title: 'Test inițial · clasa a VI-a', status: 'published', grade_level: 6, available_from: null, available_until: null, published_at: '2026-09-14T10:00:00+00:00', classes: [], item_count: 9 },
]

beforeEach(() => {
  localStorage.clear()
})

describe('ExamsPage (DS-008, Q-059)', () => {
  it('lists the exams with status, classes, window and Items', async () => {
    mockApi({ 'GET /user': json(200, { user: examiner }), 'GET /exams': json(200, { exams }) })
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Examene' })).toBeInTheDocument()
    const draft = (await screen.findByRole('link', { name: 'Evaluare Unitatea 3: Rapoarte și proporții' })).closest('tr')!
    expect(within(draft).getByText('Ciornă')).toBeInTheDocument()
    expect(within(draft).getByText('Clasa a VI-a A, Clasa a VI-a B')).toBeInTheDocument()
    expect(within(draft).getByText('9')).toBeInTheDocument()
    const published = screen.getByRole('link', { name: 'Test inițial · clasa a VI-a' }).closest('tr')!
    expect(within(published).getByText('Publicat')).toBeInTheDocument()
    expect(within(published).getByText('Fără fereastră')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Evaluare Unitatea 3: Rapoarte și proporții' })).toHaveAttribute('href', '/examiner/exams/4')
  })

  it('shows the empty state and starts a new exam', async () => {
    mockApi({ 'GET /user': json(200, { user: examiner }), 'GET /exams': json(200, { exams: [] }) })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Încă nu ai niciun examen' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: '+ Creează primul examen' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/examiner/exams/new')
  })

  it('offers to try again when the list cannot be loaded', async () => {
    let calls = 0
    mockApi({
      'GET /user': json(200, { user: examiner }),
      'GET /exams': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { exams })
      },
    })
    renderPage()

    fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByRole('link', { name: 'Test inițial · clasa a VI-a' })).toBeInTheDocument()
  })
})
