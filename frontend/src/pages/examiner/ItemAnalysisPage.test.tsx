import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { examiner, json, mockApi } from '../../test/mockApi'
import ItemAnalysisPage from './ItemAnalysisPage'

function renderAt(path = '/examiner/exams/4/analysis') {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/examiner/exams/:id/analysis" element={<ItemAnalysisPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const measure = (p: number | null, r: number | null, flags: string[] = [], n = 14) =>
  ({ n, p, r, flags, not_enough_data: p === null || r === null })
const option = (o: number, label: string, count: number, extra = {}) =>
  ({ option: o, label, correct: false, count, share: count / 8, unused: count === 0, ...extra })
const analysis = {
  exam: { id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții' },
  graded: 14, submissions: 14, recheck: 0, mean: 7.2, median: 7.5,
  competences: [
    {
      code: 'C1', description: 'Calculează fracții dintr-un număr', p: 0.74, weak: 1,
      items: [
        {
          position: 1, section: 'subject_1', points: 5, ...measure(0.9286, 0.1203, ['too_easy', 'low_discrimination']),
          questions: [
            {
              id: 31, code: 'M6-FR-001', type: 'single_choice', ...measure(1, null, ['too_easy'], 8),
              options: [option(1, '12', 0), option(2, '36', 8, { correct: true, unused: false }), option(3, '32', 0)],
            },
            { id: 32, code: 'M6-FR-002', type: 'short_answer', ...measure(0.8333, 0.31, [], 6), options: null },
          ],
        },
        { position: 7, section: 'subject_2', points: 20, ...measure(0.68, 0.71), questions: [] },
      ],
    },
    {
      code: 'C2', description: 'Compară rapoarte', p: 0.41, weak: 1,
      items: [
        { position: 3, section: 'subject_1', points: 5, ...measure(0.36, -0.18, ['low_discrimination', 'negative_discrimination']), questions: [] },
      ],
    },
  ],
}
const base = { 'GET /user': json(200, { user: examiner }), 'GET /exams/4/analysis': json(200, analysis) }

beforeEach(() => localStorage.clear())

describe('ItemAnalysisPage (DS-010)', () => {
  it('shows the counts, the mean and median, and each competence with its success rate and weak Items', async () => {
    mockApi(base)
    renderAt()

    expect(await screen.findByRole('heading', { level: 1, name: 'Analiza itemilor' })).toBeInTheDocument()
    expect(screen.getByText('Evaluare Unitatea 3: Rapoarte și proporții')).toBeInTheDocument()
    expect(screen.getByText('14 din 14')).toBeInTheDocument()
    expect(screen.getByText('7,20')).toBeInTheDocument()
    expect(screen.getByText('7,50')).toBeInTheDocument()
    const c1 = screen.getByRole('region', { name: 'C1 · Calculează fracții dintr-un număr' })
    expect(c1).toHaveTextContent('Reușită 74%')
    expect(c1).toHaveTextContent('1 item slab')
  })

  it('shows each Item\'s success rate as a percentage, r with a comma, and its flags as text', async () => {
    mockApi(base)
    renderAt()

    const row = (await screen.findByText('Itemul 1')).closest('tr')!
    expect(row).toHaveTextContent('Subiectul I')
    expect(within(row).getByText('93%')).toBeInTheDocument()
    expect(within(row).getByText('0,12')).toBeInTheDocument()
    expect(within(row).getByText('Prea ușor')).toBeInTheDocument()
    expect(within(row).getByText('Discriminare slabă')).toBeInTheDocument()
    expect(within(screen.getByText('Itemul 7').closest('tr')!).getByText('Fără')).toBeInTheDocument()
  })

  it('shows only "Discriminare negativă" when r is negative, with a minus sign', async () => {
    mockApi(base)
    renderAt()

    const row = (await screen.findByText('Itemul 3')).closest('tr')!
    expect(within(row).getByText('−0,18')).toBeInTheDocument()
    expect(within(row).getByText('Discriminare negativă')).toBeInTheDocument()
    expect(within(row).queryByText('Discriminare slabă')).not.toBeInTheDocument()
  })

  it('opens an Item\'s Variants with their figures and options: correct, counts and unused ones', async () => {
    mockApi(base)
    renderAt()

    const toggle = await screen.findByRole('button', { name: '2 variante' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('M6-FR-001')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Variantele extrase pentru itemul 1: fiecare candidat a primit una dintre ele.')).toBeInTheDocument()
    const first = screen.getByText('M6-FR-001').closest('section')!
    expect(first).toHaveTextContent('Alegere unică · 8 candidați')
    expect(first).toHaveTextContent('Reușită 100%')
    expect(first).toHaveTextContent('Discriminare date insuficiente')
    const options = within(first).getByRole('list', { name: 'Opțiunile întrebării M6-FR-001' })
    const rows = within(options).getAllByRole('listitem')
    expect(rows[1]).toHaveTextContent('36')
    expect(rows[1]).toHaveTextContent('Corect')
    expect(rows[1]).toHaveTextContent('8 · 100%')
    expect(rows[0]).toHaveTextContent('Nefolosită')
    expect(rows[1]).not.toHaveTextContent('Nefolosită')
    expect(screen.getByText('M6-FR-002').closest('section')).toHaveTextContent('Completare · 6 candidați')

    fireEvent.click(toggle)
    expect(screen.queryByText('M6-FR-001')).not.toBeInTheDocument()
  })

  it('has a legend that folds, closed by default', async () => {
    mockApi(base)
    renderAt()

    const summary = await screen.findByText('Cum se citesc valorile')
    const details = summary.closest('details')!
    expect(details.open).toBe(false)
    fireEvent.click(summary)
    expect(details.open).toBe(true)
    expect(details).toHaveTextContent('În analiza itemilor se numește indicele de dificultate p.')
  })

  it('says when answers are marked for re-check, with a link to grading', async () => {
    mockApi({ ...base, 'GET /exams/4/analysis': json(200, { ...analysis, recheck: 2 }) })
    renderAt()

    expect(await screen.findByText('2 răspunsuri sunt marcate pentru reverificare; valorile se pot schimba după ce le corectezi din nou.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mergi la corectare' })).toHaveAttribute('href', '/examiner/exams/4/grading')
  })

  it('shows one notice instead of the tables with fewer than 2 graded Attempts', async () => {
    const one = {
      ...analysis, graded: 1, submissions: 3, mean: 8.5, median: 8.5,
      competences: [{ ...analysis.competences[0], p: null, weak: 0, items: [{ ...analysis.competences[0].items[0], ...measure(null, null, [], 1) }] }],
    }
    mockApi({ ...base, 'GET /exams/4/analysis': json(200, one) })
    renderAt()

    expect(await screen.findByText('Analiza are nevoie de cel puțin 2 încercări corectate. Acum este corectată 1 din 3; celelalte 2 așteaptă corectarea.')).toBeInTheDocument()
    expect(screen.getByText('1 din 3')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Cum se citesc valorile')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mergi la corectare' })).toHaveAttribute('href', '/examiner/exams/4/grading')
  })

  it('explains the empty state before any Attempt is graded', async () => {
    mockApi({ ...base, 'GET /exams/4/analysis': json(200, { ...analysis, graded: 0, submissions: 6, mean: null, median: null, competences: [] }) })
    renderAt()

    expect(await screen.findByRole('heading', { name: 'Încă nu există încercări corectate' })).toBeInTheDocument()
    expect(screen.getByText('Analiza itemilor apare după ce corectezi Subiectul II la cel puțin o încercare. 6 încercări predate așteaptă corectarea.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mergi la corectare' })).toHaveAttribute('href', '/examiner/exams/4/grading')
    expect(screen.queryByText('Media notelor')).not.toBeInTheDocument()
  })

  it('offers to try again when the analysis does not load', async () => {
    let calls = 0
    mockApi({ ...base, 'GET /exams/4/analysis': () => (++calls === 1 ? json(500, { message: 'Server Error' }) : json(200, analysis)) })
    renderAt()

    expect(await screen.findByText('Analiza nu s-a putut încărca. Verifică conexiunea și încearcă din nou.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }))

    expect(await screen.findByText('14 din 14')).toBeInTheDocument()
  })
})
