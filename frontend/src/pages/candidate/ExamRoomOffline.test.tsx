import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnswerValue, Attempt } from '../../api/attempts'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { candidate, json, mockApi } from '../../test/mockApi'
import ExamRoomPage from './ExamRoomPage'

// P7d · offline and resume: every answer is on the device until the server has it, retried by
// itself, and resumed after a refresh (the twist: refresh, closing the tab and losing the
// connection lose nothing).
const KEY = 'exam-answers-12'
const saved = (value: AnswerValue, version: number) => ({ value, version, marked_for_review: false, saved_at: '2026-11-25T10:01:00Z' })

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  const now = Date.now()
  return {
    id: 12, exam: { id: 4, title: 'Evaluare', max_attempts: 1 }, status: 'in_progress', attempt_number: 1,
    started_at: new Date(now - 60_000).toISOString(), expires_at: new Date(now + 45 * 60_000).toISOString(),
    accepts_answers_until: new Date(now + 45 * 60_000 + 30_000).toISOString(), server_time: new Date(now).toISOString(),
    submitted_at: null, auto_submitted: false,
    items: [
      { position: 1, section: 'subject_1', type: 'single_choice', points: 5, statement: 'Alege.', options: ['32', '48'], answer: null },
      { position: 2, section: 'subject_1', type: 'short_answer', points: 5, statement: 'Cât face 7 + 10?', options: [], answer: null },
    ],
    ...overrides,
  }
}

type Reply = 'ok' | 'network' | 'server'
function api(read: Attempt, reply: () => Reply = () => 'ok') {
  const puts: Array<{ position: number; answer: unknown; version: number }> = []
  const calls: string[] = []
  const routes: Parameters<typeof mockApi>[0] = {
    'GET /user': json(200, { user: candidate }),
    'GET /attempts/12': () => json(200, { attempt: read }),
    'POST /attempts/12/submit': () => {
      calls.push('submit')
      return json(200, { attempt: { ...read, status: 'submitted', submitted_at: read.expires_at, items: read.items.map((i) => ({ ...i, answer: saved('x', 9) })) } })
    },
  }
  for (const position of [1, 2]) {
    routes[`PUT /attempts/12/items/${position}/answer`] = (init: RequestInit) => {
      const body = JSON.parse(String(init.body))
      const how = reply()
      puts.push({ position, answer: body.answer, version: body.version })
      calls.push(`put ${position} ${how}`)
      if (how === 'network') throw new TypeError('Failed to fetch')
      if (how === 'server') return json(500, {})
      return json(200, { answer: saved(body.answer, body.version), applied: true, status: 'in_progress' })
    }
  }
  mockApi(routes)
  return { puts, calls }
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

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? '{}')

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExamRoomPage offline and resume (P7d)', () => {
  it('keeps each change on the device before sending it, and marks it sent when the server has it', async () => {
    let release: (() => void) | null = null
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /attempts/12': json(200, { attempt: attempt() }),
      'PUT /attempts/12/items/1/answer': (init: RequestInit) => new Promise((resolve) => {
        const body = JSON.parse(String(init.body))
        release = () => resolve(json(200, { answer: saved(body.answer, body.version), applied: true, status: 'in_progress' }))
      }),
    })
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'b) 48' }))
    expect(stored()[1]).toMatchObject({ value: 2, waiting: true })
    await waitFor(() => expect(release).not.toBeNull())
    await act(async () => release!())
    await waitFor(() => expect(stored()[1]).toMatchObject({ value: 2, version: 1, waiting: false }))
  })

  it('says it is offline, keeps the answers waiting, retries by itself and when back online', async () => {
    let down = true
    const { puts } = api(attempt(), () => (down ? 'network' : 'ok'))
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'b) 48' }))
    expect(await screen.findByText('Fără conexiune · 1 răspuns în așteptare')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Conexiunea s-a întrerupt.')
    await waitFor(() => expect(puts.length).toBeGreaterThanOrEqual(2), { timeout: 3000 }) // retried after ~1 s

    down = false
    act(() => void window.dispatchEvent(new Event('online')))
    expect(await screen.findByText(/^Salvat/)).toBeInTheDocument()
    expect(screen.queryByText(/Fără conexiune/)).not.toBeInTheDocument()
    expect(stored()[1]).toMatchObject({ value: 2, waiting: false })
    expect(puts.at(-1)!.version).toBeGreaterThan(puts[0].version)
  })

  it('keeps "Nesalvat" with a manual retry for a server error', async () => {
    api(attempt(), () => 'server')
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'b) 48' }))
    expect(await screen.findByText('Nesalvat')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Răspunsul la itemul 1 nu s-a salvat.')
    expect(screen.queryByText(/Fără conexiune/)).not.toBeInTheDocument()
  })

  it('resumes after a refresh: a newer waiting answer on the device wins and is sent', async () => {
    localStorage.setItem(KEY, JSON.stringify({ 2: { value: '17', marked: false, version: 5, waiting: true } }))
    const { puts } = api(attempt())
    renderRoom(2)

    expect(await screen.findByLabelText('Răspunsul tău')).toHaveValue('17')
    await waitFor(() => expect(puts).toEqual([{ position: 2, answer: '17', version: 5 }]))
  })

  it('drops a waiting answer on the device when the server has a newer one', async () => {
    localStorage.setItem(KEY, JSON.stringify({ 2: { value: '17', marked: false, version: 2, waiting: true } }))
    const read = attempt()
    read.items[1].answer = saved('20', 3)
    const { puts } = api(read)
    renderRoom(2)

    expect(await screen.findByLabelText('Răspunsul tău')).toHaveValue('20')
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(puts).toEqual([])
    expect(stored()[2]).toBeUndefined()
  })

  it('asks before the page closes while answers are waiting, not otherwise', async () => {
    let down = true
    api(attempt(), () => (down ? 'network' : 'ok'))
    renderRoom()
    await screen.findByRole('article')

    const unloadIdle = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unloadIdle)
    expect(unloadIdle.defaultPrevented).toBe(false)

    fireEvent.click(screen.getByRole('radio', { name: 'b) 48' }))
    await screen.findByText(/Fără conexiune/)
    const unloadWaiting = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unloadWaiting)
    expect(unloadWaiting.defaultPrevented).toBe(true)

    down = false
    act(() => void window.dispatchEvent(new Event('online')))
    await screen.findByText(/^Salvat/)
    const unloadSaved = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unloadSaved)
    expect(unloadSaved.defaultPrevented).toBe(false)
  })

  it('at 0 keeps sending the waiting answers within the grace, then submits and clears the device copy', async () => {
    const now = Date.now()
    let failures = 2
    const read = attempt({ expires_at: new Date(now + 1_200).toISOString(), accepts_answers_until: new Date(now + 6_000).toISOString() })
    const { calls } = api(read, () => (failures-- > 0 ? 'network' : 'ok'))
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'b) 48' }))

    expect(await screen.findByRole('heading', { name: 'Timpul s-a încheiat' }, { timeout: 8000 })).toBeInTheDocument()
    expect(calls.filter((c) => c === 'put 1 ok')).toHaveLength(1)
    expect(calls.at(-1)).toBe('submit')
    expect(localStorage.getItem(KEY)).toBeNull()
  }, 12_000)

  it('still saves when the device storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { puts } = api(attempt())
    renderRoom()

    fireEvent.click(await screen.findByRole('radio', { name: 'b) 48' }))
    await waitFor(() => expect(puts).toEqual([{ position: 1, answer: 2, version: 1 }]))
    expect(await screen.findByText(/^Salvat/)).toBeInTheDocument()
  })
})
