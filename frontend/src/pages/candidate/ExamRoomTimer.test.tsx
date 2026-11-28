import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnswerValue, Attempt } from '../../api/attempts'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { candidate, json, mockApi } from '../../test/mockApi'
import ExamRoomPage from './ExamRoomPage'

// DS-004 · timer and submit (P7c): the countdown runs on the server's clock (D-004, D-021), the
// notices at 5 and 1 minute, the dialog, submitting at 0, the end screens (D-019: no score).
const SERVER = Date.parse('2026-11-25T10:05:00Z')
const at = (ms: number) => new Date(SERVER + ms).toISOString()
const saved = (value: AnswerValue, version = 1, marked = false) => ({ value, version, marked_for_review: marked, saved_at: at(0) })

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 12, exam: { id: 4, title: 'Evaluare Unitatea 3', max_attempts: 1 }, status: 'in_progress', attempt_number: 1,
    started_at: at(-5 * 60_000), expires_at: at(45 * 60_000), server_time: at(0), submitted_at: null, auto_submitted: false,
    items: [
      { position: 1, section: 'subject_1', type: 'single_choice', points: 5, statement: 'Alege 48.', options: ['32', '48'], answer: saved(2) },
      { position: 2, section: 'subject_1', type: 'short_answer', points: 5, statement: 'Cât face 7 + 10?', options: [], answer: null },
      { position: 3, section: 'subject_1', type: 'multiple_choice', points: 5, statement: 'Care?', options: ['21', '14'], answer: null },
      { position: 4, section: 'subject_1', type: 'dual_choice', points: 5, statement: 'Adevărat?', options: [], answer: saved(null, 1, true) },
      { position: 5, section: 'subject_2', type: 'structured_problem', points: 30, statement: 'Rezolvă.', options: [], answer: null },
    ],
    ...overrides,
  }
}

function api(read: Attempt, { putFails = () => false, afterSubmit }: { putFails?: () => boolean; afterSubmit?: Partial<Attempt> } = {}) {
  const calls: string[] = []
  const routes: Parameters<typeof mockApi>[0] = {
    'GET /user': json(200, { user: candidate }),
    'GET /attempts/12': () => json(200, { attempt: read }),
    'POST /attempts/12/submit': () => {
      calls.push('submit')
      return json(200, { attempt: attempt({ status: 'submitted', submitted_at: at(60_000), ...afterSubmit }) })
    },
  }
  for (const position of [1, 2, 3, 4, 5]) {
    routes[`PUT /attempts/12/items/${position}/answer`] = (init: RequestInit) => {
      const body = JSON.parse(String(init.body))
      calls.push(`put ${position} ${JSON.stringify(body.answer)}`)
      if (putFails()) return json(500, {})
      return json(200, { answer: saved(body.answer, body.version, body.marked_for_review), applied: true, status: 'in_progress' })
    }
  }
  mockApi(routes)
  return calls
}

function renderRoom(item = 1) {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={[`/candidate/attempts/12?item=${item}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/candidate/attempts/:id" element={<ExamRoomPage />} />
          <Route path="/candidate" element={<p>dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const timer = () => screen.getByRole('timer')

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(SERVER + 10 * 60_000) // the device clock is 10 minutes ahead
})
afterEach(() => {
  vi.useRealTimers()
})

describe('ExamRoomPage timer (P7c)', () => {
  it('counts down on the server clock and shows the attempt in the header', async () => {
    api(attempt())
    renderRoom()

    expect(await screen.findByText('Încercarea 1 din 1 · 5 itemi · 50 puncte + 10 puncte din oficiu')).toBeInTheDocument()
    expect(timer()).toHaveTextContent('45:00')
    expect(timer()).toHaveAccessibleName('Timp rămas: 45:00')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows hours from an hour', async () => {
    api(attempt({ expires_at: at(75 * 60_000) }))
    renderRoom()

    await screen.findByRole('article')
    expect(timer()).toHaveTextContent('1:15:00')
  })

  it.each([
    [4 * 60_000, '04:00', 'Mai sunt sub 5 minute.'],
    [50_000, '00:50', 'Mai este 1 minut.'],
  ])('warns at %i ms left', async (left, shown, notice) => {
    api(attempt({ expires_at: at(left) }))
    renderRoom()

    await screen.findByRole('article')
    expect(timer()).toHaveTextContent(shown)
    expect(timer()).toHaveClass('text-warning')
    expect(screen.getByRole('alert')).toHaveTextContent(notice)
  })

  it('hides the timer, keeps the notices, and remembers it after a reload', async () => {
    api(attempt({ expires_at: at(4 * 60_000) }))
    const { unmount } = renderRoom()

    fireEvent.click(await screen.findByRole('button', { name: 'Ascunde cronometrul' }))
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByText('Cronometrul este ascuns.', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Mai sunt sub 5 minute.')

    unmount()
    renderRoom()
    expect(await screen.findByRole('button', { name: 'Arată cronometrul' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Arată cronometrul' }))
    expect(timer()).toHaveTextContent('04:00')
  })

  it('at 0 sends the waiting answer, submits, and shows the time-up screen', async () => {
    const calls = api(attempt({ expires_at: at(1_500) }), { afterSubmit: { submitted_at: at(1_500) } })
    vi.setSystemTime(SERVER)
    renderRoom(2)

    fireEvent.change(await screen.findByLabelText('Răspunsul tău'), { target: { value: '17' } })
    act(() => vi.setSystemTime(SERVER + 2_000))

    expect(await screen.findByRole('heading', { name: 'Timpul s-a încheiat' }, { timeout: 3000 })).toBeInTheDocument()
    expect(calls).toEqual(['put 2 "17"', 'submit'])
    expect(screen.getByText(/a fost predat automat la \d\d:\d\d/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mergi la panou' })).toHaveAttribute('href', '/candidate')
  })
})

describe('ExamRoomPage submit (P7c)', () => {
  it('lists unanswered and marked items, goes back, then submits and shows "Examen predat"', async () => {
    const calls = api(attempt())
    renderRoom()

    fireEvent.click(await screen.findByRole('button', { name: 'Predă examenul' }))
    const dialog = screen.getByRole('dialog', { name: 'Predai examenul?' })
    expect(dialog).toHaveTextContent('Ai răspuns la 1 din 5 itemi.')
    expect(dialog).toHaveTextContent('4 itemi fără răspuns: 2, 3, 4, 5')
    expect(dialog).toHaveTextContent('1 item marcat pentru revizuire: 4')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Înapoi la examen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Predă examenul' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Predă examenul' }))

    expect(await screen.findByRole('heading', { name: 'Examen predat' })).toBeInTheDocument()
    expect(calls).toEqual(['submit'])
    expect(screen.getByText(/Ai predat examenul „Evaluare Unitatea 3” la \d\d:\d\d\. Răspunsurile tale au ajuns pe server \(1 din 5 itemi cu răspuns\)\./)).toBeInTheDocument()
    expect(screen.getByText('Rezultatele apar în panou după ce examinatorul le publică.')).toBeInTheDocument()
  })

  it('sends the typed answer first and does not submit while one is unsaved', async () => {
    let fail = true
    const calls = api(attempt(), { putFails: () => fail })
    renderRoom(2)

    fireEvent.change(await screen.findByLabelText('Răspunsul tău'), { target: { value: '17' } })
    fireEvent.click(screen.getByRole('button', { name: 'Predă examenul' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Predă examenul' }))

    const dialog = screen.getByRole('dialog')
    expect(await within(dialog).findByText('Răspunsul la itemul 2 nu s-a salvat încă.', { exact: false })).toBeInTheDocument()
    expect(calls).toEqual(['put 2 "17"'])

    fail = false
    fireEvent.click(within(dialog).getByRole('button', { name: 'Încearcă din nou' }))
    await waitFor(() => expect(calls).toEqual(['put 2 "17"', 'put 2 "17"']))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Predă examenul' }))
    expect(await screen.findByRole('heading', { name: 'Examen predat' })).toBeInTheDocument()
    expect(calls.at(-1)).toBe('submit')
  })

  it.each([
    [false, 'Examen predat'],
    [true, 'Timpul s-a încheiat'],
  ])('opens a submitted Attempt (auto_submitted %s) on its end screen', async (auto, heading) => {
    api(attempt({ status: 'submitted', submitted_at: at(-60_000), auto_submitted: auto }))
    renderRoom()

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('shows the time-up screen when a save is refused as too late', async () => {
    let read = attempt()
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /attempts/12': () => json(200, { attempt: read }),
      'PUT /attempts/12/items/1/answer': () => {
        read = attempt({ status: 'submitted', submitted_at: at(45 * 60_000), auto_submitted: true })
        return json(409, { code: 'time_up', message: 'x' })
      },
    })
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'a) 32' }))

    expect(await screen.findByRole('heading', { name: 'Timpul s-a încheiat' })).toBeInTheDocument()
  })
})
