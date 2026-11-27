import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { bodyOf, examiner, json, mockApi } from '../../test/mockApi'
import GradingPage from './GradingPage'

function renderAt(path = '/examiner/exams/4/grading') {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/examiner/exams/:id/grading" element={<GradingPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const answer = (id: number, number: number, candidate: string, position: number, extra = {}) => ({
  attempt_item_id: id, attempt_id: 100 + number, candidate, number, position, question_code: position === 7 ? 'M6-TR-004' : 'M6-UG-005',
  photos: 0, answered: true, status: 'to_grade', awarded_points: null, ...extra,
})
const queue = {
  exam: { id: 4, title: 'Evaluare Unitatea 3', classes: ['Clasa a VI-a A'], available_until: '2026-11-30T12:00:00+00:00', submissions: 2, results_published_at: null, cohort_note: null },
  items: [
    { position: 7, competence: 'C4', points: 20, graded: 1, total: 2 },
    { position: 8, competence: 'C3', points: 20, graded: 0, total: 2 },
  ],
  answers: [
    answer(51, 1, 'Ana Dumitru', 7, { status: 'graded', awarded_points: 16 }),
    answer(52, 1, 'Ana Dumitru', 8),
    answer(61, 2, 'Elena-Alexandra Popescu-Vasilescu', 7, { photos: 2 }),
    answer(62, 2, 'Elena-Alexandra Popescu-Vasilescu', 8, { answered: false }),
  ],
  counts: { total: 4, graded: 1, to_grade: 3, recheck: 0 },
  publish: { ready: false, missing: ['ungraded', 'window_open'], mean: null, median: null },
}
const barem = [
  { id: 1, description: 'Triunghi isoscel ⇒ ∢B = ∢C', points: 6, modified: false },
  { id: 2, description: '∢B + ∢C = 140°', points: 6, modified: false },
  { id: 3, description: '∢B = 70°', points: 8, modified: false },
]
const item = (id: number, extra = {}) => ({
  attempt_item_id: id, attempt_id: 102, position: 7, question_id: 31, question_code: 'M6-TR-004', candidate: 'Elena-Alexandra Popescu-Vasilescu',
  statement: 'În triunghiul ABC, AB = AC și ∢A = 40°. Calculează ∢B.', points: 20, text: 'a) ∢B = 75°', photos: [],
  uses_barem: true, barem, scores: {}, adjustment: null, comment: null, awarded_points: null, needs_recheck: false, graded_at: null, ...extra,
})
const holistic = item(52, { position: 8, question_id: 32, question_code: 'M6-UG-005', candidate: 'Ana Dumitru', uses_barem: false, barem: [], statement: 'Calculează unghiurile.', text: 'AOB = 135°' })
const base = {
  'GET /user': json(200, { user: examiner }),
  'GET /exams/4/grading': json(200, { ...queue }),
  'GET /grading/items/61': json(200, { item: item(61) }),
  'GET /grading/items/51': json(200, { item: item(51, { candidate: 'Ana Dumitru', scores: { 1: 6, 2: 6, 3: 4 }, awarded_points: 16, graded_at: '2026-12-01T10:00:00+00:00' }) }),
  'GET /grading/items/52': json(200, { item: holistic }),
  'GET /grading/items/62': json(200, { item: item(62, { position: 8, question_id: 32, uses_barem: false, barem: [], text: null }) }),
}

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:photo')
  URL.revokeObjectURL = vi.fn()
})

describe('GradingPage (DS-009)', () => {
  it('shows the progress and why the results cannot be published yet (Q-076)', async () => {
    mockApi(base)
    renderAt()

    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare Unitatea 3' })).toBeInTheDocument()
    expect(screen.getByText('Subiectul II: 1 / 4 răspunsuri corectate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publică rezultatele' })).toBeDisabled()
    expect(screen.getByText('Poți publica după ce corectezi toate răspunsurile (3 rămase) și se încheie examenul (30.11.2026, 14:00).')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Înapoi la examen' })).toHaveAttribute('href', '/examiner/exams/4')
  })

  it('grades by item: the first answer left to grade, labelled by competence and points', async () => {
    mockApi(base)
    renderAt()

    const select = await screen.findByRole('combobox', { name: 'Item' })
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Itemul 7 · C4 · 20 p · 1 / 2', 'Itemul 8 · C3 · 20 p · 0 / 2'])
    expect(await screen.findByRole('heading', { level: 2, name: 'Elena-Alexandra Popescu-Vasilescu · itemul 7' })).toBeInTheDocument()
    expect(screen.getByText('Răspunsul 2 din 2 · 1 de corectat')).toBeInTheDocument()
    expect(screen.getByText('Varianta M6-TR-004')).toBeInTheDocument()
    expect(screen.getByText('a) ∢B = 75°')).toBeInTheDocument()
  })

  it('ticks the barem with no, part or all of each step, and saves and moves to the next answer (D-031)', async () => {
    const fetchMock = mockApi({ ...base, 'PUT /grading/items/61': json(200, { item: item(61, { awarded_points: 9.5 }) }) })
    renderAt()

    const step1 = await screen.findByRole('group', { name: 'Pasul 1' })
    fireEvent.click(within(step1).getByRole('button', { name: 'Da' }))
    fireEvent.click(within(screen.getByRole('group', { name: 'Pasul 2' })).getByRole('button', { name: 'Parțial' }))
    fireEvent.change(screen.getByLabelText('Puncte acordate la pasul 2'), { target: { value: '2,5' } })
    fireEvent.click(within(screen.getByRole('group', { name: 'Pasul 3' })).getByRole('button', { name: 'Nu' }))
    fireEvent.change(screen.getByLabelText('Ajustare (opțional)'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Comentariu pentru candidat'), { target: { value: 'La a) calculul e greșit.' } })
    expect(screen.getByTestId('grade-total')).toHaveTextContent('9,5 / 20')

    fireEvent.click(screen.getByRole('button', { name: 'Salvează și următorul' }))

    await waitFor(() => expect(bodyOf(fetchMock, 'PUT /grading/items/61')).toEqual({
      steps: [{ id: 1, points: 6 }, { id: 2, points: 2.5 }, { id: 3, points: 0 }], adjustment: 1, comment: 'La a) calculul e greșit.',
    }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Ana Dumitru · itemul 8' })).toBeInTheDocument()
  })

  it('refuses a total outside 0..20 before saving', async () => {
    mockApi(base)
    renderAt()

    for (const n of [1, 2, 3]) fireEvent.click(within(await screen.findByRole('group', { name: `Pasul ${n}` })).getByRole('button', { name: 'Da' }))
    fireEvent.change(screen.getByLabelText('Ajustare (opțional)'), { target: { value: '2' } })

    expect(screen.getByText('Totalul trebuie să fie între 0 și 20.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvează' })).toBeDisabled()
  })

  it('grades a problem without a barem with one score', async () => {
    const fetchMock = mockApi({ ...base, 'PUT /grading/items/52': json(200, { item: { ...holistic, awarded_points: 14 } }) })
    renderAt()

    fireEvent.change(await screen.findByRole('combobox', { name: 'Item' }), { target: { value: '8' } })
    expect(await screen.findByRole('heading', { level: 2, name: 'Ana Dumitru · itemul 8' })).toBeInTheDocument()
    expect(screen.getByText('Această întrebare se corectează fără barem. Dă un punctaj între 0 și 20.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Puncte acordate'), { target: { value: '14' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvează' }))

    expect(await screen.findByText('Salvat.')).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'PUT /grading/items/52')).toEqual({ points: 14, adjustment: null, comment: null })
  })

  it('says when a Candidate wrote nothing', async () => {
    mockApi(base)
    renderAt()

    fireEvent.change(await screen.findByRole('combobox', { name: 'Item' }), { target: { value: '8' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Răspunsul următor' }))

    expect(await screen.findByText('Candidatul nu a scris nimic și nu a încărcat fotografii.')).toBeInTheDocument()
  })

  it('hides the Candidates\' names', async () => {
    mockApi(base)
    renderAt()

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Ascunde numele candidaților' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Candidat #2 · itemul 7' })).toBeInTheDocument()
    expect(screen.queryByText('Elena-Alexandra Popescu-Vasilescu')).not.toBeInTheDocument()
  })

  it('grades by Candidate: their problems with status, one at a time', async () => {
    mockApi(base)
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Pe candidat' }))
    const select = screen.getByRole('combobox', { name: 'Candidat' })
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Ana Dumitru · 1 / 2', 'Elena-Alexandra Popescu-Vasilescu · 0 / 2'])
    const problems = screen.getByRole('navigation', { name: 'Problemele candidatului' })
    expect(within(problems).getByRole('link', { name: /Itemul 7.*16 \/ 20/ })).toBeInTheDocument()
    fireEvent.click(within(problems).getByRole('link', { name: /Itemul 8/ }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Ana Dumitru · itemul 8' })).toBeInTheDocument()
    expect(screen.getByText('Candidatul 1 din 2 · 1 din 2 probleme corectate')).toBeInTheDocument()
  })

  it('marks answers and barem steps to check again after a barem change', async () => {
    mockApi({
      ...base,
      'GET /exams/4/grading': json(200, { ...queue, answers: [{ ...queue.answers[0], status: 'recheck' }, ...queue.answers.slice(1)], counts: { ...queue.counts, graded: 0, recheck: 1 } }),
      'GET /grading/items/51': json(200, { item: item(51, { candidate: 'Ana Dumitru', needs_recheck: true, scores: { 1: 6, 2: 5, 3: 4 }, barem: [barem[0], { ...barem[1], points: 5, modified: true }, barem[2]] }) }),
    })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Răspunsul anterior' }))

    expect(await screen.findByText('modificat')).toBeInTheDocument()
    expect(screen.getByText(/1 de reverificat/)).toBeInTheDocument()
  })

  it('edits the barem inline and reports the recalculated grades (Q-078, C-004)', async () => {
    const fetchMock = mockApi({
      ...base,
      'PATCH /questions/31': json(200, { question: { id: 31 }, regraded: { answers: 3, flagged: 1 } }),
    })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Editează baremul' }))
    const editor = screen.getByRole('region', { name: 'Editează baremul' })
    fireEvent.change(within(editor).getByLabelText('Puncte pasul 2'), { target: { value: '5' } })
    expect(within(editor).getByText(/Pașii însumează/)).toHaveTextContent('Pașii însumează 19 din 20 de puncte.')
    expect(within(editor).getByRole('button', { name: 'Salvează baremul' })).toBeDisabled()
    fireEvent.change(within(editor).getByLabelText('Puncte pasul 3'), { target: { value: '9' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Salvează baremul' }))

    expect(await screen.findByText('Baremul variantei M6-TR-004 a fost salvat: 3 punctaje recalculate, 1 marcat pentru reverificare.')).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'PATCH /questions/31')).toEqual({ uses_barem: true, barem: [
      { id: 1, description: 'Triunghi isoscel ⇒ ∢B = ∢C', points: 6 }, { id: 2, description: '∢B + ∢C = 140°', points: 5 }, { id: 3, description: '∢B = 70°', points: 9 },
    ] })
  })

  it('publishes the results with the cohort note once everything is graded (D-019)', async () => {
    const graded = {
      ...queue,
      exam: { ...queue.exam, available_until: '2026-11-30T12:00:00+00:00' },
      answers: queue.answers.map((a) => ({ ...a, status: 'graded', awarded_points: 12 })),
      items: queue.items.map((i) => ({ ...i, graded: 2 })),
      counts: { total: 4, graded: 4, to_grade: 0, recheck: 0 },
      publish: { ready: true, missing: [], mean: 7.64, median: 7.9 },
    }
    const fetchMock = mockApi({ ...base, 'GET /exams/4/grading': json(200, graded), 'POST /exams/4/results': json(200, { exam: { id: 4 } }) })
    renderAt()

    expect(await screen.findByText(/Toate cele 4 răspunsuri sunt corectate/)).toHaveTextContent('Media: 7,64 · mediana: 7,90')
    fireEvent.change(screen.getByLabelText('Notă pentru toată clasa'), { target: { value: 'Scrieți concluzia.' } })
    const after = mockApi({ ...base, 'GET /exams/4/grading': json(200, { ...graded, exam: { ...graded.exam, results_published_at: '2026-12-01T16:20:00+00:00', cohort_note: 'Scrieți concluzia.' } }), 'POST /exams/4/results': json(200, { exam: { id: 4 } }) })
    fireEvent.click(screen.getByRole('button', { name: 'Publică rezultatele pentru 2 candidați' }))

    expect(await screen.findByText(/Rezultatele au fost publicate pe 01.12.2026, ora 18:20./)).toBeInTheDocument()
    expect(screen.getByText('Scrieți concluzia.')).toBeInTheDocument()
    expect(bodyOf(after, 'POST /exams/4/results')).toEqual({ cohort_note: 'Scrieți concluzia.' })
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/results'), expect.anything())
  })

  it('keeps publishing closed while the exam is still open, with the reason', async () => {
    mockApi({ ...base, 'GET /exams/4/grading': json(200, {
      ...queue, answers: queue.answers.map((a) => ({ ...a, status: 'graded' })), counts: { total: 4, graded: 4, to_grade: 0, recheck: 0 },
      publish: { ready: false, missing: ['open_attempts', 'window_open'], mean: 7, median: 7 },
    }) })
    renderAt()

    expect(await screen.findByText('Poți publica după ce nu mai lucrează nimeni la examen și se încheie examenul (30.11.2026, 14:00).')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publică rezultatele pentru 2 candidați' })).toBeDisabled()
  })

  it('names the answers to check again among the reasons publishing is closed (Q-079)', async () => {
    mockApi({ ...base, 'GET /exams/4/grading': json(200, {
      ...queue, counts: { ...queue.counts, recheck: 2 }, publish: { ready: false, missing: ['ungraded', 'recheck', 'window_open'], mean: null, median: null },
    }) })
    renderAt()

    expect(await screen.findByText('Poți publica după ce corectezi toate răspunsurile (3 rămase), reverifici cele 2 marcate și se încheie examenul (30.11.2026, 14:00).')).toBeInTheDocument()
  })

  it('asks for an end date first when the exam has none (Q-080)', async () => {
    mockApi({ ...base, 'GET /exams/4/grading': json(200, {
      ...queue, exam: { ...queue.exam, available_until: null }, answers: queue.answers.map((a) => ({ ...a, status: 'graded' })),
      counts: { total: 4, graded: 4, to_grade: 0, recheck: 0 }, publish: { ready: false, missing: ['window_open'], mean: 7, median: 7 },
    }) })
    renderAt()

    expect(await screen.findByText('Examenul nu are dată de încheiere. Setează „Disponibil până la” în setările examenului; după ce trece, poți publica. Nota pentru clasă rămâne aici până atunci.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Setează data de încheiere' })).toHaveAttribute('href', '/examiner/exams/4')
    expect(screen.getByRole('button', { name: 'Publică rezultatele pentru 2 candidați' })).toBeDisabled()
  })

  it('shows an empty queue', async () => {
    mockApi({ ...base, 'GET /exams/4/grading': json(200, { ...queue, answers: [], items: [], counts: { total: 0, graded: 0, to_grade: 0, recheck: 0 }, exam: { ...queue.exam, submissions: 0 } }) })
    renderAt()

    expect(await screen.findByRole('heading', { level: 2, name: 'Încă nu există predări' })).toBeInTheDocument()
  })

  it('offers to try again when the queue does not load', async () => {
    mockApi({ ...base, 'GET /exams/4/grading': json(500, {}) })
    renderAt()

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut încărca răspunsurile.')
    mockApi(base)
    fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare Unitatea 3' })).toBeInTheDocument()
  })
})
