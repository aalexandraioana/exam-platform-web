import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Attempt } from '../../api/attempts'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { candidate, json, mockApi } from '../../test/mockApi'
import ExamRoomPage from './ExamRoomPage'

// P6d · Subject II photos in the exam room (DS-004): up to 3, uploaded at once with progress,
// refusals, a confirmation before deleting, and a problem with only photos counts as answered.
class FakeUpload {
  static all: FakeUpload[] = []
  url = ''
  status = 0
  responseText = ''
  body: FormData | null = null
  upload: { onprogress: ((e: { loaded: number; total: number }) => void) | null } = { onprogress: null }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  open(_method: string, url: string) { this.url = url }
  setRequestHeader() {}
  send(body: FormData) { this.body = body; FakeUpload.all.push(this) }
  progress(loaded: number, total: number) { act(() => this.upload.onprogress?.({ loaded, total })) }
  respond(status: number, body: unknown) { this.status = status; this.responseText = JSON.stringify(body); act(() => this.onload?.()) }
  fail() { act(() => this.onerror?.()) }
}
const last = () => FakeUpload.all.at(-1)!

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  const now = Date.now()
  return {
    id: 12, exam: { id: 4, title: 'Evaluare', max_attempts: 1 }, status: 'in_progress', attempt_number: 1,
    started_at: new Date(now - 60_000).toISOString(), expires_at: new Date(now + 45 * 60_000).toISOString(),
    accepts_answers_until: new Date(now + 45 * 60_000 + 30_000).toISOString(), server_time: new Date(now).toISOString(),
    submitted_at: null, auto_submitted: false, photos_enabled: true,
    items: [
      { position: 1, section: 'subject_1', type: 'single_choice', points: 5, statement: 'Alege.', options: ['32', '48'], answer: null, images: null },
      { position: 2, section: 'subject_2', type: 'structured_problem', points: 30, statement: 'În triunghiul ABC, AB = AC.', options: [], answer: null,
        images: [{ id: 31, position: 1, name: 'IMG_2040.jpg', size: 2_516_582 }, { id: 32, position: 2, name: 'IMG_2042.jpg', size: 1_992_294 }] },
    ],
    ...overrides,
  }
}

function api(read: Attempt, extra: Parameters<typeof mockApi>[0] = {}) {
  const image = () => new Response(new Blob(['png'], { type: 'image/png' }), { status: 200 })
  return mockApi({
    'GET /user': json(200, { user: candidate }),
    'GET /attempts/12': () => json(200, { attempt: read }),
    'GET /attempts/12/images/31': image, 'GET /attempts/12/images/32': image, 'GET /attempts/12/images/33': image,
    ...extra,
  })
}

function renderRoom(item = 2) {
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

const choose = (file: File) => fireEvent.change(screen.getByLabelText('Adaugă o fotografie'), { target: { files: [file] } })
const file = (name: string, type: string, bytes = 1000) => new File([new Uint8Array(bytes)], name, { type })

beforeEach(() => {
  localStorage.clear()
  FakeUpload.all = []
  vi.stubGlobal('XMLHttpRequest', FakeUpload)
  URL.createObjectURL = vi.fn(() => 'blob:photo')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ExamRoomPage photos (P6d, DS-004)', () => {
  it('shows the uploaded photos with name and size, the count, the free slot and the limits', async () => {
    api(attempt())
    renderRoom()

    const tray = await screen.findByRole('group', { name: 'Fotografii cu rezolvarea scrisă de mână' })
    expect(within(tray).getByText('2 din 3')).toBeInTheDocument()
    expect(within(tray).getByText('IMG_2040.jpg · 2,4 MB')).toBeInTheDocument()
    expect(within(tray).getByText('IMG_2042.jpg · 1,9 MB')).toBeInTheDocument()
    expect(await within(tray).findByRole('img', { name: 'Fotografia 1' })).toHaveAttribute('src', 'blob:photo')
    expect(within(tray).getByRole('button', { name: 'Șterge fotografia 2' })).toHaveTextContent('Șterge')
    expect(within(tray).getByRole('button', { name: /Fotografiază sau alege/ })).toBeInTheDocument()
    expect(within(tray).getByText('Cel mult 3 fotografii pentru această problemă: JPG, PNG sau HEIC, până la 10 MB fiecare.')).toBeInTheDocument()
    expect(screen.getByText('Scrie pașii pe scurt. Desenul și calculele le poți fotografia mai jos.')).toBeInTheDocument()
  })

  it('uploads at once with progress, then shows the photo and the new count', async () => {
    api(attempt())
    renderRoom()
    await screen.findByText('2 din 3')

    choose(file('IMG_2043.jpg', 'image/jpeg'))
    expect(last().url).toMatch(/\/attempts\/12\/items\/2\/images$/)
    expect(last().body!.get('image')).toBeInstanceOf(File)
    last().progress(450, 1000)
    expect(screen.getByText('Se încarcă… 45%')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Fotografiază sau alege/ })).not.toBeInTheDocument()

    last().respond(201, { image: { id: 33, position: 3, name: 'IMG_2043.jpg', size: 1000 } })
    expect(await screen.findByText('3 din 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Șterge fotografia 3' })).toBeInTheDocument()
  })

  it('says a HEIC is being prepared once it has been sent', async () => {
    api(attempt())
    renderRoom()
    await screen.findByText('2 din 3')

    choose(file('IMG_2043.HEIC', 'image/heic'))
    last().progress(1000, 1000)

    expect(screen.getByText('Se pregătește imaginea…')).toBeInTheDocument()
  })

  it('refuses a photo over 10 MB without sending it, and a file the server refuses', async () => {
    api(attempt())
    renderRoom()
    await screen.findByText('2 din 3')

    const big = file('IMG_2077.JPG', 'image/jpeg')
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
    choose(big)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('IMG_2077.JPG are peste 10 MB. Fă o poză nouă sau alege una mai mică.')
    expect(within(alert).getByRole('button', { name: 'Alege altă fotografie' })).toBeInTheDocument()
    expect(FakeUpload.all).toHaveLength(0)

    choose(file('scan.jpg', 'image/jpeg'))
    last().respond(422, { code: 'image_type', message: 'x' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Fotografia nu a fost încărcată: trimite o imagine JPG, PNG sau HEIC.')
    expect(screen.getByText('2 din 3')).toBeInTheDocument()
  })

  it('offers to try again when the connection drops', async () => {
    api(attempt())
    renderRoom()
    await screen.findByText('2 din 3')

    choose(file('IMG_2043.jpg', 'image/jpeg'))
    last().fail()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Fotografia nu s-a încărcat. Verifică internetul și încearcă din nou.')

    fireEvent.click(within(alert).getByRole('button', { name: 'Încearcă din nou' }))
    expect(FakeUpload.all).toHaveLength(2)
    last().respond(201, { image: { id: 33, position: 3, name: 'IMG_2043.jpg', size: 1000 } })
    expect(await screen.findByText('3 din 3')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asks before deleting a photo', async () => {
    const fetchMock = api(attempt(), { 'DELETE /attempts/12/items/2/images/31': new Response(null, { status: 204 }) })
    renderRoom()

    fireEvent.click(await screen.findByRole('button', { name: 'Șterge fotografia 1' }))
    let dialog = screen.getByRole('alertdialog', { name: 'Ștergi fotografia 1?' })
    expect(dialog).toHaveTextContent('Fotografia se șterge din rezolvarea problemei 2. O poți face din nou oricând înainte de predare.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Anulează' }))
    expect(screen.getByText('2 din 3')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Șterge fotografia 1' }))
    dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Șterge fotografia' }))
    expect(await screen.findByText('1 din 3')).toBeInTheDocument()
    expect(screen.queryByText('IMG_2040.jpg · 2,4 MB')).not.toBeInTheDocument()
  })

  it('counts a problem with only photos as answered', async () => {
    api(attempt())
    renderRoom()

    const nav = await screen.findByRole('navigation', { name: 'Navigator itemi' })
    expect(within(nav).getByRole('button', { name: 'Item 2, cu răspuns, item curent' })).toBeInTheDocument()
    expect(within(nav).getByText('1 din 2 cu răspuns')).toBeInTheDocument()
  })

  it('hides the photos when the storage is not set up, with the text-only hint', async () => {
    api(attempt({ photos_enabled: false }))
    renderRoom()

    expect(await screen.findByLabelText('Pașii rezolvării')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Fotografii cu rezolvarea scrisă de mână' })).not.toBeInTheDocument()
    expect(screen.getByText('Scrie toți pașii: datele, calculele și răspunsul.')).toBeInTheDocument()
  })

  it('ends on the time-up screen when an upload is refused as too late', async () => {
    let read = attempt()
    api(read, {})
    mockApi({
      'GET /user': json(200, { user: candidate }),
      'GET /attempts/12': () => json(200, { attempt: read }),
      'GET /attempts/12/images/31': () => new Response(new Blob(['x'])), 'GET /attempts/12/images/32': () => new Response(new Blob(['x'])),
    })
    renderRoom()
    await screen.findByText('2 din 3')

    read = attempt({ status: 'submitted', auto_submitted: true, submitted_at: new Date().toISOString() })
    choose(file('IMG_2043.jpg', 'image/jpeg'))
    last().respond(409, { code: 'time_up', message: 'x' })

    expect(await screen.findByRole('heading', { name: 'Timpul s-a încheiat' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Fotografii cu rezolvarea scrisă de mână' })).not.toBeInTheDocument())
  })
})
