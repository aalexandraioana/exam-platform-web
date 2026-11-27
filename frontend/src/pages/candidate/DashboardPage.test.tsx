import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CandidateExam } from '../../api/attempts'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { bodyOf, candidate, json, mockApi } from '../../test/mockApi'
import DashboardPage from './DashboardPage'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderPage() {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={['/candidate']}>
      <AuthProvider>
        <Routes>
          <Route path="/candidate" element={<DashboardPage />} />
          <Route path="*" element={null} />
        </Routes>
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const SERVER = '2026-11-25T10:00:00Z'

function exam(id: number, overrides: Partial<CandidateExam> = {}): CandidateExam {
  return {
    id, title: `Examen ${id}`, description: null, duration_minutes: 50,
    available_from: '2026-11-25T06:00:00Z', available_until: '2026-11-25T12:00:00Z',
    max_attempts: 1, attempts_used: 0, state: 'open', open_attempt_id: null, open_attempt: null,
    can_start: true, submitted: false, results_published: false, grade: null, topics: [],
    item_counts: { subject_1: 6, subject_2: 2 }, ...overrides,
  }
}

function list(exams: CandidateExam[], classes = { accepted: 1, pending: 0 }) {
  return json(200, { server_time: SERVER, classes, exams })
}

const card = (title: string) => screen.getByRole('heading', { level: 3, name: title }).closest('article')!

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('DashboardPage (DS-003, P7a)', () => {
  it('shows the in-progress Attempt with the time left by the server clock, and resumes it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T10:10:00Z')) // the device clock is 10 minutes off
    const ongoing = exam(3, {
      title: 'Evaluare Unitatea 3: Rapoarte și proporții', can_start: false, open_attempt_id: 12, attempts_used: 1,
      open_attempt: { id: 12, started_at: '2026-11-25T09:38:45Z', expires_at: '2026-11-25T10:28:45Z' },
    })
    mockApi({ 'GET /user': json(200, { user: candidate }), 'GET /candidate/exams': list([ongoing]) })
    renderPage()

    const banner = (await screen.findByText('Încercare în desfășurare')).closest('section')!
    expect(within(banner).getByRole('heading', { name: 'Evaluare Unitatea 3: Rapoarte și proporții' })).toBeInTheDocument()
    expect(within(banner).getByText('28:45')).toBeInTheDocument()
    expect(within(banner).getByText(/Subiectul I \(6 itemi\) \+ Subiectul II \(2 probleme\) · început la \d\d:\d\d/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Evaluare Unitatea 3: Rapoarte și proporții' })).not.toBeInTheDocument()

    fireEvent.click(within(banner).getByRole('link', { name: /Reia examenul/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('/candidate/attempts/12')
  })

  it('shows the grade and the way to the results once they are published (P8b, D-019)', async () => {
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': list([
        exam(5, { title: 'Publicat', state: 'closed', can_start: false, submitted: true, attempts_used: 1, results_published: true, grade: 7.9 }),
        exam(6, { title: 'Se corectează', state: 'closed', can_start: false, submitted: true, attempts_used: 1 }),
      ]),
    })
    renderPage()

    await screen.findByRole('heading', { level: 3, name: 'Publicat' })
    const done = card('Publicat')
    expect(within(done).getByText('Rezultate publicate')).toBeInTheDocument()
    expect(within(done).getByText(/^Nota/)).toHaveTextContent('Nota 7,90')
    expect(within(done).getByRole('link', { name: 'Vezi rezultatele' })).toHaveAttribute('href', '/candidate/exams/5/results')
    expect(within(done).queryByText('Rezultatul apare aici după ce examinatorul îl publică.')).not.toBeInTheDocument()
    expect(within(card('Se corectează')).getByText('Rezultatul apare aici după ce examinatorul îl publică.')).toBeInTheDocument()
  })

  it('shows each card by its state, with the description and topic chips', async () => {
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': list([
        exam(1, { title: 'Deschis', description: 'Unghiuri și triunghiuri.', topics: ['Triunghiuri', 'Unghiuri'], max_attempts: 2 }),
        exam(2, { title: 'Urmează', state: 'upcoming', can_start: false, available_from: '2026-12-02T06:00:00Z', available_until: null }),
        exam(3, { title: 'Predat', submitted: true, attempts_used: 1, can_start: false }),
        exam(4, { title: 'Din nou', submitted: true, attempts_used: 1, max_attempts: 3 }),
        exam(5, { title: 'Închis, neînceput', state: 'closed', can_start: false }),
        exam(6, { title: 'Închis, predat', state: 'closed', can_start: false, submitted: true, attempts_used: 1 }),
      ]),
    })
    renderPage()

    expect(await screen.findByRole('heading', { level: 2, name: 'Examenele tale (5)' })).toBeInTheDocument()
    const open = card('Deschis')
    expect(within(open).getByText('Unghiuri și triunghiuri.')).toBeInTheDocument()
    expect(within(open).getByText('Triunghiuri')).toBeInTheDocument()
    expect(within(open).getByText('Unghiuri')).toBeInTheDocument()
    expect(within(open).getByText('50 de minute, din momentul în care începi')).toBeInTheDocument()
    expect(within(open).getByText('Subiectul I (30 p) + Subiectul II (60 p) + 10 p din oficiu')).toBeInTheDocument()
    expect(within(open).getByText(/^Poți începe până pe .+, ora \d\d:\d\d · 2 încercări$/)).toBeInTheDocument()
    expect(within(open).getByRole('button', { name: 'Începe examenul' })).toBeInTheDocument()

    const upcoming = card('Urmează')
    expect(within(upcoming).getByText(/^Se deschide pe .+, ora \d\d:\d\d$/)).toBeInTheDocument()
    expect(within(upcoming).queryByRole('button')).not.toBeInTheDocument()

    const done = card('Predat')
    expect(within(done).getByText('Predat · se corectează')).toBeInTheDocument()
    expect(within(done).getByText('Rezultatul apare aici după ce examinatorul îl publică.')).toBeInTheDocument()
    expect(within(done).queryByRole('button')).not.toBeInTheDocument()

    const again = card('Din nou')
    expect(within(again).getByText('Predat · se corectează')).toBeInTheDocument()
    expect(within(again).getByText(/încercarea 2 din 3$/)).toBeInTheDocument()
    expect(within(again).getByRole('button', { name: 'Începe din nou' })).toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: 'Închis, neînceput' })).not.toBeInTheDocument()
    expect(within(card('Închis, predat')).getByText('Predat · se corectează')).toBeInTheDocument()
  })

  it('starts an Attempt and opens it', async () => {
    const fetchMock = mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': list([exam(4, { title: 'Evaluare' })]),
      'POST /candidate/exams/4/attempts': json(201, { attempt: { id: 31 } }),
    })
    renderPage()

    fireEvent.click(within(await screen.findByRole('article')).getByRole('button', { name: 'Începe examenul' }))

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/candidate/attempts/31'))
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(true)
  })

  it('opens the already open Attempt when the start answers attempt_open', async () => {
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': list([exam(4, { title: 'Evaluare' })]),
      'POST /candidate/exams/4/attempts': json(409, { code: 'attempt_open', message: 'x', attempt_id: 29 }),
    })
    renderPage()

    fireEvent.click(within(await screen.findByRole('article')).getByRole('button', { name: 'Începe examenul' }))

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/candidate/attempts/29'))
  })

  it.each([
    ['no_attempts_left', 'Nu mai ai încercări pentru acest examen.'],
    ['not_available', 'Examenul nu se mai poate începe acum.'],
  ])('says why a start was refused (%s) and reloads the list', async (code, message) => {
    let loads = 0
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': () => { loads += 1; return list([exam(4, { title: 'Evaluare' })]) },
      'POST /candidate/exams/4/attempts': json(409, { code, message: 'x' }),
    })
    renderPage()

    fireEvent.click(within(await screen.findByRole('article')).getByRole('button', { name: 'Începe examenul' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    await waitFor(() => expect(loads).toBe(2))
    expect(screen.getByTestId('where')).toHaveTextContent('/candidate')
  })

  it.each([
    [{ accepted: 0, pending: 0 }, 'Nu ești încă într-o clasă', 'Am un cod de clasă'],
    [{ accepted: 0, pending: 1 }, 'Cererea ta așteaptă examinatorul', 'Am alt cod de clasă'],
    [{ accepted: 1, pending: 0 }, 'Niciun examen disponibil', null],
  ])('shows the empty state for %o', async (classes, title, button) => {
    mockApi({ 'GET /user': json(200, { user: candidate }), 'GET /candidate/exams': list([], classes) })
    renderPage()

    const empty = (await screen.findByRole('heading', { level: 2, name: title })).parentElement!
    expect(screen.getByText('Nu ai niciun examen programat acum.')).toBeInTheDocument()
    if (button) expect(within(empty).getByRole('button', { name: button })).toBeInTheDocument()
    else expect(within(empty).queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows loading, then an error with retry', async () => {
    let calls = 0
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': () => { calls += 1; return calls === 1 ? json(500, {}) : list([exam(1, { title: 'Evaluare' })]) },
    })
    renderPage()

    expect(screen.getByLabelText('Se încarcă tabloul de bord')).toBeInTheDocument()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Nu am putut încărca examenele.')
    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByRole('heading', { level: 3, name: 'Evaluare' })).toBeInTheDocument()
  })

  it('keeps a long title whole', async () => {
    const title = 'Evaluare semestrială extinsă de geometrie: triunghiuri, mediatoare, bisectoare și alte linii importante în triunghi'
    mockApi({ 'GET /user': json(200, { user: candidate }), 'GET /candidate/exams': list([exam(1, { title })]) })
    renderPage()

    expect(await screen.findByRole('heading', { level: 3, name: title })).toHaveClass('[overflow-wrap:anywhere]')
  })
})

describe('JoinClassDialog (DS-003, D-028)', () => {
  async function openDialog(post: Parameters<typeof mockApi>[0][string], classes = { accepted: 0, pending: 0 }) {
    let loads = 0
    const fetchMock = mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /candidate/exams': () => { loads += 1; return list([], classes) },
      'POST /memberships': post,
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Am un cod de clasă' }))
    const dialog = screen.getByRole('dialog', { name: 'Intră într-o clasă' })
    return { dialog, fetchMock, loads: () => loads }
  }

  it('sends the request, closes and says the Examiner has to accept it', async () => {
    const { dialog, fetchMock, loads } = await openDialog(json(201, { membership: { id: 41, status: 'pending', class: { id: 3, name: 'Clasa a VI-a A' } } }))

    fireEvent.change(within(dialog).getByLabelText('Codul clasei'), { target: { value: ' k7q-4mx ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Trimite cererea' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Cererea pentru Clasa a VI-a A a fost trimisă.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bodyOf(fetchMock, 'POST /memberships')).toEqual({ class_code: 'k7q-4mx' })
    await waitFor(() => expect(loads()).toBe(2))
  })

  it('says when the Candidate is already in the class', async () => {
    const { dialog } = await openDialog(json(200, { membership: { id: 41, status: 'accepted', class: { id: 3, name: 'Clasa a VI-a A' } } }))

    fireEvent.change(within(dialog).getByLabelText('Codul clasei'), { target: { value: 'k7q-4mx' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Trimite cererea' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Ești deja în Clasa a VI-a A.')
  })

  it.each([
    ['', null, 'Scrie codul clasei.'],
    ['k7q-4mz', json(422, { message: 'x', errors: { class_code: ['not_found'] } }), 'Nu există nicio clasă cu acest cod. Verifică-l și încearcă din nou.'],
    ['k7q-4mx', json(409, { code: 'already_decided', message: 'x' }), 'Examinatorul ți-a refuzat cererea pentru această clasă. Vorbește cu el dacă e o greșeală.'],
  ])('shows the field error for "%s"', async (code, reply, message) => {
    const { dialog } = await openDialog(reply ?? json(500, {}))

    fireEvent.change(within(dialog).getByLabelText('Codul clasei'), { target: { value: code } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Trimite cererea' }))

    expect(await within(dialog).findByText(message)).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Codul clasei')).toHaveAttribute('aria-invalid', 'true')
  })

  it('closes on Anulează without sending', async () => {
    const { dialog, fetchMock } = await openDialog(json(500, {}))

    fireEvent.click(within(dialog).getByRole('button', { name: 'Anulează' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([path]) => String(path).endsWith('/memberships'))).toBe(false)
  })
})
