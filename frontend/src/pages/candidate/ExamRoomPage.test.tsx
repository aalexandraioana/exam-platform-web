import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnswerValue, Attempt } from '../../api/attempts'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { candidate, json, mockApi } from '../../test/mockApi'
import ExamRoomPage from './ExamRoomPage'

// DS-004 · the exam room, reading and answering (P7b, Q-072 one item per screen, D-061 maths).
function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
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
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const saved = (value: AnswerValue, version: number, marked = false) => ({ value, version, marked_for_review: marked, saved_at: '2026-11-25T10:01:00Z' })

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 12, exam: { id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții' }, status: 'in_progress', attempt_number: 1,
    started_at: '2026-11-25T10:00:00Z', expires_at: '2026-11-25T10:50:00Z', server_time: '2026-11-25T10:05:00Z',
    submitted_at: null, auto_submitted: false,
    items: [
      { position: 1, section: 'subject_1', type: 'single_choice', points: 5, statement: 'Trei sferturi din numărul 48 reprezintă:', options: ['32', '12', '64', '36'], answer: saved(2, 3) },
      { position: 2, section: 'subject_1', type: 'short_answer', points: 5, statement: 'Cât face 7 + 10?', options: [], answer: null },
      { position: 3, section: 'subject_1', type: 'multiple_choice', points: 5, statement: 'Care sunt divizibile cu 3?', options: ['21', '14', '30'], answer: null },
      { position: 4, section: 'subject_1', type: 'dual_choice', points: 5, statement: 'Orice număr întreg negativ este mai mic decât 0.', options: [], answer: saved(null, 1, true) },
      { position: 5, section: 'subject_2', type: 'structured_problem', points: 30, statement: 'Un dreptunghi are perimetrul 64 cm.\na) Află lățimea.', options: [], answer: null },
    ],
    ...overrides,
  }
}

type Put = { answer: unknown; marked_for_review: boolean; version: number }
function api(read = json(200, { attempt: attempt() }), put?: (body: Put, position: number) => Response | Promise<Response>) {
  const puts: Array<Put & { position: number }> = []
  const routes: Parameters<typeof mockApi>[0] = { 'GET /user': json(200, { user: candidate }), 'GET /attempts/12': read }
  for (const position of [1, 2, 3, 4, 5]) {
    routes[`PUT /attempts/12/items/${position}/answer`] = (init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Put
      puts.push({ ...body, position })
      return put ? put(body, position) : json(200, { answer: saved(body.answer as AnswerValue, body.version, body.marked_for_review), applied: true, status: 'in_progress' })
    }
  }
  mockApi(routes)
  return puts
}

beforeEach(() => {
  localStorage.clear()
})

describe('ExamRoomPage (DS-004, P7b)', () => {
  it('shows the exam header and the current item with its saved answer, maths in JetBrains Mono', async () => {
    api()
    renderRoom()

    expect(await screen.findByText('Evaluare Unitatea 3: Rapoarte și proporții')).toBeInTheDocument()
    expect(screen.getByText('5 itemi · 50 puncte + 10 puncte din oficiu')).toBeInTheDocument()
    expect(screen.getByText('Subiectul I · 30 de puncte')).toBeInTheDocument()
    const item = screen.getByRole('article')
    expect(within(item).getByText('5 puncte')).toBeInTheDocument()
    expect(within(item).getByText('48')).toHaveClass('font-mono')
    expect(within(item).getByText('Trei sferturi din numărul', { exact: false })).not.toHaveClass('font-mono')
    expect(within(item).getByRole('radio', { name: 'b) 12' })).toBeChecked()
    expect(screen.queryByRole('banner')).toBeInTheDocument()
  })

  it('saves a single choice at once, as the shown position with the next version', async () => {
    const puts = api()
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'c) 64' }))

    await waitFor(() => expect(puts).toEqual([{ position: 1, answer: 3, marked_for_review: false, version: 4 }]))
    expect(await screen.findByText(/^Salvat/)).toBeInTheDocument()
  })

  it('sends one save per item at a time, then only the latest', async () => {
    let release: (() => void) | null = null
    const puts = api(undefined, (body) => new Promise((resolve) => {
      release = () => resolve(json(200, { answer: saved(body.answer as AnswerValue, body.version), applied: true, status: 'in_progress' }))
    }))
    renderRoom(3)

    fireEvent.click(await screen.findByRole('checkbox', { name: 'a) 21' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'b) 14' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'c) 30' }))
    expect(screen.getByText('Se salvează…')).toBeInTheDocument()
    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]).toMatchObject({ answer: [1], version: 1 })

    await act(async () => release!())
    await waitFor(() => expect(puts).toHaveLength(2))
    expect(puts[1]).toMatchObject({ answer: [1, 2, 3], version: 2 })
    await act(async () => release!())

    fireEvent.click(screen.getByRole('checkbox', { name: 'a) 21' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'b) 14' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'c) 30' }))
    await waitFor(() => expect(puts).toHaveLength(3))
    await act(async () => release!())
    await waitFor(() => expect(puts).toHaveLength(4))
    expect(puts[3]).toMatchObject({ answer: null, version: 4 }) // nothing chosen is a cleared answer
  })

  it('sends typed text after a pause, or at once when leaving the item; empty is cleared', async () => {
    const puts = api()
    renderRoom(2)

    const box = await screen.findByLabelText('Răspunsul tău')
    expect(screen.getByText('Poți scrie zecimalele cu virgulă sau cu punct (2,5 sau 2.5).')).toBeInTheDocument()
    fireEvent.change(box, { target: { value: '1' } })
    fireEvent.change(box, { target: { value: '17' } })
    expect(puts).toHaveLength(0)
    await waitFor(() => expect(puts).toEqual([{ position: 2, answer: '17', marked_for_review: false, version: 1 }]), { timeout: 2000 })

    fireEvent.change(box, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Itemul 3/ }))
    await waitFor(() => expect(puts[1]).toEqual({ position: 2, answer: null, marked_for_review: false, version: 2 }))
    expect(screen.getByTestId('where')).toHaveTextContent('/candidate/attempts/12?item=3')
  })

  it('saves true/false as a boolean and Subject II steps as text', async () => {
    const puts = api()
    renderRoom(4)

    fireEvent.click(await screen.findByRole('radio', { name: 'Fals' }))
    await waitFor(() => expect(puts[0]).toEqual({ position: 4, answer: false, marked_for_review: true, version: 2 }))

    fireEvent.click(screen.getByRole('button', { name: /Itemul 5/ }))
    expect(await screen.findByText('Subiectul II · 60 de puncte · scrie rezolvările complete')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Pașii rezolvării'), { target: { value: 'a) 2(L + l) = 64' } })
    await waitFor(() => expect(puts[1]).toEqual({ position: 5, answer: 'a) 2(L + l) = 64', marked_for_review: false, version: 1 }), { timeout: 2000 })
    expect(screen.getByText('Scrie toți pașii: datele, calculele și răspunsul.')).toBeInTheDocument()
  })

  it('saves the review mark with the current answer and shows it in the navigator', async () => {
    const puts = api()
    renderRoom()

    fireEvent.click(await screen.findByRole('button', { name: 'Marchează pentru revizuire' }))

    await waitFor(() => expect(puts[0]).toEqual({ position: 1, answer: 2, marked_for_review: true, version: 4 }))
    expect(screen.getByRole('button', { name: 'Marcat pentru revizuire' })).toHaveAttribute('aria-pressed', 'true')
    const nav = screen.getByRole('navigation', { name: 'Navigator itemi' })
    expect(within(nav).getByRole('button', { name: 'Item 1, cu răspuns, marcat pentru revizuire, item curent' })).toBeInTheDocument()
  })

  it('shows the navigator with states, counts and filters, and jumps to an item', async () => {
    api()
    renderRoom()

    const nav = await screen.findByRole('navigation', { name: 'Navigator itemi' })
    expect(within(nav).getByText('1 din 5 cu răspuns')).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Item 1, cu răspuns, item curent' })).toHaveAttribute('aria-current', 'true')
    expect(within(nav).getByRole('button', { name: 'Item 4, fără răspuns, marcat pentru revizuire' })).toBeInTheDocument()

    fireEvent.click(within(nav).getByRole('button', { name: 'Fără răspuns (4)' }))
    expect(within(nav).queryByRole('button', { name: /^Item 1,/ })).not.toBeInTheDocument()
    expect(within(nav).getAllByRole('button', { name: /^Item \d,/ })).toHaveLength(4)
    fireEvent.click(within(nav).getByRole('button', { name: 'Marcați (1)' }))
    expect(within(nav).getAllByRole('button', { name: /^Item \d,/ }).map((b) => b.textContent)).toEqual(['4'])
    fireEvent.click(within(nav).getByRole('button', { name: 'Toți' }))

    fireEvent.click(within(nav).getByRole('button', { name: 'Item 5, fără răspuns' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/candidate/attempts/12?item=5')
    expect(screen.getByText('Subiectul II · 60 de puncte · scrie rezolvările complete')).toBeInTheDocument()
  })

  it('moves back and forward, with no button past the ends', async () => {
    api()
    renderRoom()

    await screen.findByRole('article')
    expect(screen.queryByRole('button', { name: /Itemul 0/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Itemul 2/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('?item=2')
    fireEvent.click(screen.getByRole('button', { name: /Itemul 1/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('?item=1')

    fireEvent.click(screen.getAllByRole('button', { name: 'Item 5, fără răspuns' })[0])
    expect(screen.queryByRole('button', { name: /Itemul 6/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Itemul 4/ })).toBeInTheDocument()
  })

  it('says when an answer was not saved and retries with the latest version', async () => {
    let fail = true
    const puts = api(undefined, (body) => (fail ? json(500, {}) : json(200, { answer: saved(body.answer as AnswerValue, body.version), applied: true, status: 'in_progress' })))
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'a) 32' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Răspunsul la itemul 1 nu s-a salvat.')
    expect(screen.getByText('Nesalvat')).toBeInTheDocument()

    fail = false
    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))
    await waitFor(() => expect(puts[1]).toEqual({ position: 1, answer: 1, marked_for_review: false, version: 5 }))
    expect(await screen.findByText(/^Salvat/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('locks the answers when the time is up', async () => {
    api(undefined, () => json(409, { code: 'time_up', message: 'x' }))
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'a) 32' }))

    const notice = await screen.findByText('Timpul s-a încheiat.', { exact: false })
    expect(notice.closest('[role="status"]')).toHaveTextContent('nu le mai poți modifica')
    expect(screen.getByRole('radio', { name: 'a) 32' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Mergi la tabloul de bord' })).toHaveAttribute('href', '/candidate')
  })

  it('opens a submitted Attempt locked', async () => {
    api(json(200, { attempt: attempt({ status: 'submitted', submitted_at: '2026-11-25T10:50:00Z', auto_submitted: true }) }))
    renderRoom()

    expect(await screen.findByText('Timpul s-a încheiat.', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'b) 12' })).toBeDisabled()
  })

  it('shows loading, and goes back to the dashboard for an unknown Attempt', async () => {
    api(json(404, { message: 'Not found.' }))
    renderRoom()

    expect(screen.getByLabelText('Se încarcă examenul')).toBeInTheDocument()
    expect(await screen.findByText('dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/candidate$/)
  })
})
