import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { bodyOf, examiner, json, mockApi } from '../../test/mockApi'
import QuestionBankPage from './QuestionBankPage'

const competence = { id: 3, code: 'C3', description: 'Recunoaște unghiuri opuse la vârf' }
const topic = { id: 5, name: 'Unghiuri' }
const pool = { id: 2, name: 'Unghiuri – ușor' }

const summary = {
  id: 12, code: 'M6-UG-012', section: 'subject_1', type: 'short_answer', status: 'ready', grade_level: 6, difficulty: 'easy',
  statement: 'Diagonalele paralelogramului …', competence: { id: 3, code: 'C3' }, topic, pools: [pool],
}
const question = {
  ...summary, competence, points: 5, explanation: null,
  answer_key: { kind: 'text', accepted: ['se înjumătățesc'] }, parameters: null,
  uses_barem: false, barem: [], copied_from: null, published: false, problems: [],
}
const draft = {
  ...question, id: 13, code: 'M6-MN-007', type: 'single_choice', status: 'draft', topic: null,
  answer_key: { options: ['5', '-5'], correct: 1 },
  problems: [{ code: 'required', field: 'topic' }],
}

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.search}</p>
}

function renderAt(search = '') {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={[`/examiner/questions${search}`]}>
      <AuthProvider>
        <QuestionBankPage />
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const base = {
  'GET /user': json(200, { user: examiner }),
  'GET /competences': json(200, { competences: [competence] }),
  'GET /topics': json(200, { topics: [topic] }),
  'GET /pools': json(200, { pools: [pool] }),
  'GET /questions': json(200, { questions: [summary, { ...summary, id: 13, code: 'M6-MN-007', status: 'draft', topic: null, pools: [] }] }),
  'GET /questions/12': json(200, { question }),
  'GET /questions/13': json(200, { question: draft }),
}

beforeEach(() => {
  localStorage.clear()
})

describe('QuestionBankPage (DS-007)', () => {
  it('lists the bank with counts, competence, topic and pools', async () => {
    mockApi(base)
    renderAt()

    expect(screen.getByRole('heading', { level: 1, name: 'Bancă de întrebări' })).toBeInTheDocument()
    expect(await screen.findByText('2 întrebări · 1 finalizate · 1 ciorne')).toBeInTheDocument()
    const row = screen.getByRole('button', { name: 'M6-UG-012' }).closest('tr')!
    expect(within(row).getByText('C3')).toBeInTheDocument()
    expect(within(row).getByText('Unghiuri')).toBeInTheDocument()
    expect(within(row).getByText('Unghiuri – ușor')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: 'M6-MN-007' }).closest('tr')!).getByText('Fără temă')).toBeInTheDocument()
    expect(screen.getByText('Alege o întrebare din listă ca s-o editezi.')).toBeInTheDocument()
  })

  it('filters on the server and opens a question in the URL', async () => {
    const fetchMock = mockApi(base)
    renderAt()
    await screen.findByRole('button', { name: 'M6-UG-012' })

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtru: dificultate' }), { target: { value: 'easy' } })
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/questions?difficulty=easy'))).toBe(true))

    fireEvent.click(screen.getByRole('button', { name: 'M6-UG-012' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'M6-UG-012' })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('?q=12')
  })

  it('edits and saves a question, with the topic and statement', async () => {
    const fetchMock = mockApi({ ...base, 'PATCH /questions/12': (init) => json(200, { question: { ...question, statement: JSON.parse(String(init.body)).statement } }) })
    renderAt('?q=12')

    const statement = await screen.findByLabelText('Enunț')
    expect(statement).toHaveValue('Diagonalele paralelogramului …')
    fireEvent.change(statement, { target: { value: 'Diagonalele paralelogramului se …' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvează' }))

    expect(await screen.findByText('Salvat.')).toBeInTheDocument()
    const body = bodyOf(fetchMock, 'PATCH /questions/12')
    expect(body).toMatchObject({ statement: 'Diagonalele paralelogramului se …', topic_id: 5, competence_id: 3, grade_level: 6, difficulty: 'easy', points: 5, pool_ids: [2] })
    expect(body.answer_key).toEqual({ kind: 'text', accepted: ['se înjumătățesc'] })
  })

  it('refuses a save that would leave a Ready question incomplete (Q-057)', async () => {
    mockApi({
      ...base,
      'PATCH /questions/12': json(422, { message: 'x', errors: { status: ['not_ready'] }, problems: [{ code: 'required', field: 'topic' }] }),
    })
    renderAt('?q=12')

    fireEvent.change(await screen.findByRole('combobox', { name: 'Temă' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvează' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am salvat modificările.')
    expect(screen.getByText('Tema lipsește.')).toBeInTheDocument()
  })

  it('shows what a draft still needs and marks it Ready after saving it', async () => {
    const fetchMock = mockApi({
      ...base,
      'PATCH /questions/13': json(200, { question: { ...draft, topic, problems: [] } }),
      'POST /questions/13/ready': json(200, { question: { ...draft, topic, status: 'ready', problems: [] } }),
    })
    renderAt('?q=13')

    expect(await screen.findByText('Ce lipsește pentru „Finalizat”')).toBeInTheDocument()
    expect(screen.getAllByText('Tema lipsește.').length).toBeGreaterThan(0)

    fireEvent.change(screen.getByRole('combobox', { name: 'Temă' }), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Marchează ca finalizat' }))

    expect(await screen.findByRole('button', { name: 'Mută în ciorne' })).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'PATCH /questions/13')).toMatchObject({ topic_id: 5 })
  })

  it('edits single choice options and the correct one', async () => {
    const fetchMock = mockApi({ ...base, 'PATCH /questions/13': json(200, { question: draft }) })
    renderAt('?q=13')

    fireEvent.click(await screen.findByRole('radio', { name: 'Varianta b este corectă' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Adaugă variantă' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Varianta c' }), { target: { value: '11' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvează ciorna' }))

    await waitFor(() => expect(bodyOf(fetchMock, 'PATCH /questions/13').answer_key).toEqual({ options: ['5', '-5', '11'], correct: 2 }))
  })

  it('previews named values and tests an answer against a sample (D-057, P4a)', async () => {
    const fetchMock = mockApi({
      ...base,
      'POST /questions/preview': json(200, { problems: [], samples: [{ values: { p: 3 }, statement: '3', options: [], answer: 12 }] }),
      'POST /questions/check-answer': json(200, { accepted: true }),
    })
    renderAt('?q=12')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Valori diferite pentru fiecare candidat' }))
    fireEvent.change(screen.getByLabelText('Minim'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Maxim'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Formula răspunsului corect'), { target: { value: 'p · 4' } })

    expect(await screen.findByText('p = 3 · răspuns 12', {}, { timeout: 2000 })).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'POST /questions/preview').parameters).toEqual({ values: { p: { random: { min: 2, max: 5 } } }, answer: 'p · 4' })

    fireEvent.change(screen.getByLabelText('Testează un răspuns'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Testează' }))
    expect(await screen.findByText('Acceptat.')).toBeInTheDocument()
    expect(bodyOf(fetchMock, 'POST /questions/check-answer')).toEqual({ type: 'short_answer', answer_key: { kind: 'number' }, given: '12', expected: 12 })
  })

  it('creates a question from a code, checking it first (Q-054)', async () => {
    let taken = true
    const fetchMock = mockApi({
      ...base,
      'POST /questions': () => (taken ? ((taken = false), json(422, { message: 'x', errors: { code: ['taken'] } })) : json(201, { question: { ...draft, id: 14, code: 'M6-UG-031' } })),
      'GET /questions/14': json(200, { question: { ...draft, id: 14, code: 'M6-UG-031' } }),
    })
    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Întrebare nouă' }))
    const dialog = screen.getByRole('dialog', { name: 'Întrebare nouă' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează ciorna' }))
    expect(within(dialog).getByText('Scrie codul întrebării.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Cod'), { target: { value: 'M6-UG-031' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează ciorna' }))
    expect(await within(dialog).findByText('Ai deja o întrebare cu acest cod. Alege altul.')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Creează ciorna' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('?q=14'))
    expect(bodyOf(fetchMock, 'POST /questions')).toEqual({ code: 'M6-UG-031', section: 'subject_1', type: 'single_choice' })
  })

  it('creates a competence inline and picks it (Q-053)', async () => {
    const fetchMock = mockApi({
      ...base,
      'POST /competences': json(201, { competence: { id: 9, code: 'C5', description: 'Calculează unghiuri' } }),
    })
    renderAt('?q=12')

    fireEvent.change(await screen.findByRole('combobox', { name: 'Competență' }), { target: { value: '__new' } })
    const dialog = screen.getByRole('dialog', { name: 'Competență nouă' })
    fireEvent.change(within(dialog).getByLabelText('Cod'), { target: { value: 'C5' } })
    fireEvent.change(within(dialog).getByLabelText('Ce evaluează'), { target: { value: 'Calculează unghiuri' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Adaugă competența' }))

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Competență' })).toHaveValue('9'))
    expect(bodyOf(fetchMock, 'POST /competences')).toEqual({ code: 'C5', description: 'Calculează unghiuri' })
  })

  it('deletes after a confirmation, and explains when the question was drawn (Q-056)', async () => {
    let drawn = true
    const fetchMock = mockApi({
      ...base,
      'DELETE /questions/12': () => (drawn ? ((drawn = false), json(409, { code: 'question_drawn' })) : json(204)),
    })
    renderAt('?q=12')

    fireEvent.click(await screen.findByRole('button', { name: 'Șterge' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Ștergi întrebarea M6-UG-012?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Șterge întrebarea' }))
    expect(await within(dialog).findByText('Întrebarea a fost deja extrasă pentru un candidat și nu mai poate fi ștearsă.')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Șterge întrebarea' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(2)
    expect(screen.getByTestId('where')).toHaveTextContent('')
  })

  it('browses the library and copies an entry with a new code (D-040)', async () => {
    const entry = { id: 40, code: 'LIB-RP-044', section: 'subject_1', type: 'short_answer', grade_level: 6, difficulty: 'medium', statement: 'Un produs costă 240 de lei …', competence: { code: 'C2', description: 'Procente' }, topic: { name: 'Rapoarte și proporții' }, author: 'Ion Marin', copied_as: null }
    const fetchMock = mockApi({
      ...base,
      'GET /library': json(200, { entries: [entry, { ...entry, id: 41, code: 'LIB-TR-017', copied_as: 'M6-TR-011' }] }),
      'POST /library/40/copy': json(201, { question: { ...question, id: 15, code: 'M6-RP-044' } }),
      'GET /questions/15': json(200, { question: { ...question, id: 15, code: 'M6-RP-044' } }),
    })
    renderAt('?tab=library')

    expect(await screen.findByText('LIB-RP-044', {}, { timeout: 2000 })).toBeInTheDocument()
    expect(screen.getByText('Copiată · M6-TR-011')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Filtru: set' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copiază în banca mea' }))
    const dialog = screen.getByRole('dialog', { name: 'Copiază LIB-RP-044 în banca ta' })
    expect(within(dialog).getByLabelText('Codul copiei')).toHaveValue('RP-044')
    fireEvent.change(within(dialog).getByLabelText('Codul copiei'), { target: { value: 'M6-RP-044' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copiază' }))

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('?q=15'))
    expect(bodyOf(fetchMock, 'POST /library/40/copy')).toEqual({ code: 'M6-RP-044' })
  })

  it('shows the empty bank and offers to try again when loading fails', async () => {
    let calls = 0
    mockApi({
      ...base,
      'GET /questions': () => {
        calls += 1
        if (calls === 1) throw new TypeError('Failed to fetch')
        return json(200, { questions: [] })
      },
    })
    renderAt()

    const alert = await screen.findByRole('alert')
    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))

    expect(await screen.findByRole('heading', { name: 'Banca ta este goală' })).toBeInTheDocument()
  })
})
