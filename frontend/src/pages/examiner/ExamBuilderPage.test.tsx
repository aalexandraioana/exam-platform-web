import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { bodyOf, examiner, json, mockApi } from '../../test/mockApi'
import ExamBuilderPage from './ExamBuilderPage'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderAt(path = '/examiner/exams/4') {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/examiner/exams/:id" element={<ExamBuilderPage />} />
          <Route path="*" element={null} />
        </Routes>
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const pool = { id: 2, name: 'Proporții – mediu' }
const competence = { id: 3, code: 'C2', description: 'Folosește proporțiile directe' }
const item = (id: number, position: number, section: string, points: number, extra = {}) => ({
  id, position, section, points, pool, competence, difficulty: 'medium', type: null, topic: null, eligible: 3, ...extra,
})
const items = [
  ...[1, 2, 3, 4, 5, 6].map((n) => item(10 + n, n, 'subject_1', 5)),
  item(17, 7, 'subject_2', 30, { type: 'structured_problem' }),
  item(18, 8, 'subject_2', 30, { type: 'structured_problem' }),
]
const exam = {
  id: 4, title: 'Evaluare Unitatea 3', status: 'draft', grade_level: 6, published_at: null,
  available_from: '2026-11-30T06:00:00+00:00', available_until: '2026-11-30T12:00:00+00:00',
  classes: [{ id: 1, name: 'Clasa a VI-a A' }], item_count: 8, description: null, duration_minutes: 50,
  max_attempts: 1, score_policy: 'highest', class_ids: [1], items,
  checks: { totals: { subject_1: 30, subject_2: 60 }, problems: [], warnings: [{ code: 'competence_missing', competence: { id: 9, code: 'C4', description: 'Triunghiuri' } }] },
}
const base = {
  'GET /user': json(200, { user: examiner }),
  'GET /exams/4': json(200, { exam }),
  'GET /classes': json(200, { classes: [{ id: 1, name: 'Clasa a VI-a A' }, { id: 2, name: 'Clasa a VI-a B' }] }),
  'GET /pools': json(200, { pools: [pool] }),
  'GET /competences': json(200, { competences: [competence] }),
  'GET /topics': json(200, { topics: [{ id: 5, name: 'Rapoarte și proporții' }] }),
}

beforeEach(() => {
  localStorage.clear()
})

describe('ExamBuilderPage (DS-008)', () => {
  it('shows the checks, the coverage and the blueprint', async () => {
    mockApi(base)
    renderAt()

    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare Unitatea 3' })).toBeInTheDocument()
    expect(screen.getByText('Subiectul I: 30 / 30')).toBeInTheDocument()
    expect(screen.getByText('Subiectul II: 60 / 60')).toBeInTheDocument()
    expect(screen.getByText('Total: 100')).toBeInTheDocument()
    expect(screen.getByText('Fiecare item are o întrebare proprie')).toBeInTheDocument()
    const coverage = screen.getByRole('list', { name: 'Competențe acoperite' })
    expect(within(coverage).getByText('C2 · Folosește proporțiile directe')).toBeInTheDocument()
    expect(within(coverage).getByText('C4 · Triunghiuri — niciun item (avertisment)')).toBeInTheDocument()
    const first = screen.getByRole('article', { name: 'Itemul 1' })
    expect(within(first).getByText('Proporții – mediu')).toBeInTheDocument()
    expect(within(first).getByText('orice tip')).toBeInTheDocument()
    expect(within(first).getByText('3 întrebări finalizate se potrivesc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publică pentru clase' })).toBeEnabled()
  })

  it('saves settings automatically, including the classes', async () => {
    const fetchMock = mockApi({ ...base, 'PATCH /exams/4': json(200, { exam }) })
    renderAt()

    fireEvent.change(await screen.findByLabelText('Durată (minute)'), { target: { value: '45' } })
    fireEvent.click(screen.getByRole('button', { name: 'Clasa a VI-a B' }))

    expect(await screen.findByText('Salvat automat', {}, { timeout: 3000 })).toBeInTheDocument()
    const patches = fetchMock.mock.calls.filter(([url, init]) => String(url).endsWith('/exams/4') && init?.method === 'PATCH').map(([, init]) => JSON.parse(String(init?.body)))
    expect(Object.assign({}, ...patches)).toMatchObject({ duration_minutes: 45, class_ids: [1, 2] })
  })

  it('saves the title and the description automatically, never an empty title', async () => {
    const fetchMock = mockApi({ ...base, 'PATCH /exams/4': (init) => json(200, { exam: { ...exam, ...JSON.parse(String(init.body)) } }) })
    renderAt()

    const title = await screen.findByLabelText('Titlu')
    expect(title).toHaveValue('Evaluare Unitatea 3')
    fireEvent.change(title, { target: { value: '' } })
    expect(screen.getByText('Titlul lipsește.', { selector: '#exam-title-error' })).toBeInTheDocument()
    fireEvent.change(title, { target: { value: 'Evaluare finală' } })
    fireEvent.change(screen.getByLabelText('Descriere (opțional)'), { target: { value: 'Aveți nevoie de riglă.' } })

    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare finală' }, { timeout: 3000 })).toBeInTheDocument()
    const patches = fetchMock.mock.calls.filter(([url, init]) => String(url).endsWith('/exams/4') && init?.method === 'PATCH').map(([, init]) => JSON.parse(String(init?.body)))
    expect(patches.some((p) => p.title === '')).toBe(false)
    expect(Object.assign({}, ...patches)).toMatchObject({ title: 'Evaluare finală', description: 'Aveți nevoie de riglă.' })
  })

  it('adds an Item with a live count of matching questions', async () => {
    const fetchMock = mockApi({ ...base, 'POST /exams/4/match': json(200, { count: 4 }), 'POST /exams/4/items': json(201, { exam }) })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: '+ Adaugă item' }))
    const dialog = screen.getByRole('dialog', { name: 'Item nou' })
    fireEvent.change(within(dialog).getByLabelText('Puncte'), { target: { value: '5' } })
    fireEvent.change(within(dialog).getByLabelText('Set de întrebări'), { target: { value: '2' } })
    fireEvent.change(within(dialog).getByLabelText('Competență'), { target: { value: '3' } })
    fireEvent.change(within(dialog).getByLabelText('Dificultate'), { target: { value: 'easy' } })

    expect(await within(dialog).findByText('4 întrebări finalizate se potrivesc', { exact: false }, { timeout: 3000 })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvează itemul' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(bodyOf(fetchMock, 'POST /exams/4/items')).toEqual({ section: 'subject_1', points: 5, pool_id: 2, competence_id: 3, difficulty: 'easy', type: null, topic_id: null })
  })

  it('edits, moves and deletes an Item', async () => {
    const fetchMock = mockApi({
      ...base,
      'PATCH /exams/4/items/11': json(200, { exam }),
      'PUT /exams/4/items/order': json(200, { exam }),
      'DELETE /exams/4/items/11': json(200, { exam }),
    })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Mută itemul 1 mai jos' }))
    await waitFor(() => expect(bodyOf(fetchMock, 'PUT /exams/4/items/order')).toEqual({ item_ids: [12, 11, 13, 14, 15, 16, 17, 18] }))

    fireEvent.click(screen.getByRole('button', { name: 'Editează itemul 1' }))
    let dialog = screen.getByRole('dialog', { name: 'Itemul 1' })
    fireEvent.change(within(dialog).getByLabelText('Temă'), { target: { value: '5' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvează itemul' }))
    await waitFor(() => expect(bodyOf(fetchMock, 'PATCH /exams/4/items/11')).toMatchObject({ topic_id: 5, type: null }))

    fireEvent.click(screen.getByRole('button', { name: 'Editează itemul 1' }))
    dialog = screen.getByRole('dialog', { name: 'Itemul 1' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Șterge itemul' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/exams/4/items/11') && init?.method === 'DELETE')).toBe(true))
  })

  it('lists what blocks publishing and keeps the button disabled', async () => {
    const blocked = {
      ...exam,
      checks: {
        totals: { subject_1: 25, subject_2: 60 },
        problems: [
          { code: 'required', field: 'classes' },
          { code: 'subject_total', section: 'subject_1', sum: 25, expected: 30 },
          { code: 'item_incomplete', item: 3, field: 'pool' },
          { code: 'no_distinct_draw', items: [2, 3] },
        ],
        warnings: [],
      },
    }
    mockApi({ ...base, 'GET /exams/4': json(200, { exam: blocked }) })
    renderAt()

    expect(await screen.findByText('Subiectul I: 25 / 30')).toBeInTheDocument()
    expect(screen.getByText('Alege cel puțin o clasă.')).toBeInTheDocument()
    expect(screen.getByText('Itemul 3: setul lipsește.')).toBeInTheDocument()
    expect(screen.getByText('Itemii 2, 3 nu pot primi fiecare o întrebare proprie. Adaugă întrebări potrivite sau lărgește criteriile (de exemplu „orice temă”).')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publică pentru clase' })).toBeDisabled()
  })

  it('publishes after a confirmation, then locks everything but the end of the window (Q-060, Q-061)', async () => {
    const published = { ...exam, status: 'published', published_at: '2026-11-25T10:00:00+00:00' }
    const fetchMock = mockApi({ ...base, 'POST /exams/4/publish': json(200, { exam: published }) })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Publică pentru clase' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Publici „Evaluare Unitatea 3”?' })
    expect(dialog).toHaveTextContent('Candidații din Clasa a VI-a A îl vor vedea')
    expect(dialog).toHaveTextContent('nu mai poate fi retras')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publică examenul' }))

    expect(await screen.findByText('Examenul este publicat pentru Clasa a VI-a A.', { exact: false })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/exams/4/publish') && init?.method === 'POST')).toBe(true)
    expect(screen.getByLabelText('Durată (minute)')).toBeDisabled()
    expect(screen.getByLabelText('Titlu')).toBeEnabled()
    expect(screen.getByLabelText('Descriere (opțional)')).toBeEnabled()
    expect(screen.getByLabelText('Disponibil până la')).toBeEnabled()
    expect(screen.queryByRole('button', { name: '+ Adaugă item' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mută itemul 1 mai jos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publică pentru clase' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Șterge ciorna' })).not.toBeInTheDocument()
  })

  it('deletes a draft after a confirmation', async () => {
    mockApi({ ...base, 'DELETE /exams/4': json(204) })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Șterge ciorna' }))
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Ștergi ciorna „Evaluare Unitatea 3”?' })).getByRole('button', { name: 'Șterge ciorna' }))

    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/examiner/exams'))
  })

  it('previews a draw as a Candidate would see it', async () => {
    mockApi({
      ...base,
      'GET /exams/4/preview': json(200, { items: [
        { item_id: 11, position: 1, question_id: 7, code: 'M6-RP-014', competence: 'C2', eligible: 3, values: { p: 3, q: 5 }, statement: 'Numerele a și b sunt direct proporționale cu 3 și 5 …', options: [], answer: 12 },
        { item_id: 12, position: 2, question_id: 8, code: 'M6-RP-011', competence: 'C2', eligible: 2, values: {}, statement: 'Trei sferturi din 48 reprezintă …', options: ['12', '36'], answer: null },
      ] }),
    })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Previzualizează ca un candidat' }))

    expect(await screen.findByText('Numerele a și b sunt direct proporționale cu 3 și 5 …')).toBeInTheDocument()
    expect(screen.getByText('Întrebarea extrasă: M6-RP-014 (una din 3 potrivite)')).toBeInTheDocument()
    expect(screen.getByText('p = 3, q = 5 · răspuns așteptat 12')).toBeInTheDocument()
    expect(screen.getByText('36')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Închide previzualizarea' }))
    expect(await screen.findByText('Subiectul I: 30 / 30')).toBeInTheDocument()
  })

  it('creates a new exam once its title is written', async () => {
    const fetchMock = mockApi({ ...base, 'POST /exams': json(201, { exam: { ...exam, id: 9, title: 'Evaluare Unitatea 4' } }), 'GET /exams/9': json(200, { exam: { ...exam, id: 9, title: 'Evaluare Unitatea 4' } }) })
    renderAt('/examiner/exams/new')

    expect(await screen.findByRole('heading', { level: 1, name: 'Examen nou' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Titlul examenului'), { target: { value: 'Evaluare Unitatea 4' } })

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/examiner/exams/9'), { timeout: 3000 })
    expect(bodyOf(fetchMock, 'POST /exams')).toEqual({ title: 'Evaluare Unitatea 4' })
  })

  it('offers to try again when the exam cannot be loaded', async () => {
    let calls = 0
    mockApi({
      ...base,
      'GET /exams/4': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { exam })
      },
    })
    renderAt()

    fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare Unitatea 3' })).toBeInTheDocument()
  })
})
