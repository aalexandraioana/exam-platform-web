import { fileURLToPath } from 'node:url'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'

// The catalog's twist (P13), client side (P7d): refreshing, closing the tab and losing the
// connection lose nothing. The API is mocked with a server that remembers each saved answer and
// keeps only the highest version (as P6b does).
const me = { id: 7, first_name: 'Ana', last_name: 'Dumitru', name: 'Ana Dumitru', email: 'ana@exemplu.ro', role: 'candidate', is_active: true, must_change_password: false }

function server() {
  const saved: Record<number, { value: unknown; version: number; marked_for_review: boolean }> = {}
  const state = { offline: false, saved, puts: 0 }
  const item = (position: number, type: string, statement: string, options: string[] = []) => ({
    position, section: 'subject_1', type, points: 5, statement, options,
    answer: saved[position] ? { ...saved[position], saved_at: new Date().toISOString() } : null,
  })
  const attempt = () => ({
    id: 12, exam: { id: 4, title: 'Evaluare Unitatea 3', max_attempts: 1 }, status: 'in_progress', attempt_number: 1,
    started_at: new Date().toISOString(), expires_at: new Date(Date.now() + 40 * 60_000).toISOString(),
    accepts_answers_until: new Date(Date.now() + 40 * 60_000 + 30_000).toISOString(), server_time: new Date().toISOString(),
    submitted_at: null, auto_submitted: false,
    items: [
      item(1, 'single_choice', 'Trei sferturi din 48 reprezintă:', ['12', '36', '32', '64']),
      item(2, 'short_answer', 'Cât face 7 + 10?'),
      item(3, 'dual_choice', 'Orice număr întreg negativ este mai mic decât 0.'),
    ],
  })
  return { state, attempt }
}

async function connect(context: BrowserContext, backend: ReturnType<typeof server>) {
  await context.route('http://localhost:8000/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const reply = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (backend.state.offline) return route.abort('internetdisconnected')
    if (path.endsWith('/user')) return reply({ user: me })
    const save = /\/items\/(\d+)\/answer$/.exec(path)
    if (save && request.method() === 'PUT') {
      const body = request.postDataJSON()
      const position = Number(save[1])
      backend.state.puts += 1
      const current = backend.state.saved[position]
      const applied = !current || body.version > current.version
      if (applied) backend.state.saved[position] = { value: body.answer, version: body.version, marked_for_review: body.marked_for_review }
      return reply({ answer: { ...backend.state.saved[position], saved_at: new Date().toISOString() }, applied, status: 'in_progress' })
    }
    return reply({ attempt: backend.attempt() })
  })
  await context.addInitScript(() => localStorage.setItem('auth_token', '1|e2e'))
}

async function openRoom(page: Page, item: number) {
  await page.goto(`/candidate/attempts/12?item=${item}`)
  await expect(page.getByRole('article')).toBeVisible()
}

test('refreshing mid-exam loses nothing, even an answer still in its typing pause', async ({ context, page }) => {
  const backend = server()
  await connect(context, backend)
  await openRoom(page, 1)

  await page.getByRole('radio', { name: 'b) 36' }).check()
  await page.getByRole('button', { name: /Itemul 2/ }).click()
  await page.getByLabel('Răspunsul tău').fill('17')
  await page.reload() // within the 800 ms pause: '17' was never sent

  await expect(page).toHaveURL(/item=2$/)
  await expect(page.getByLabel('Răspunsul tău')).toHaveValue('17')
  await expect.poll(() => backend.state.saved[2]?.value).toBe('17')
  await page.getByRole('button', { name: /Itemul 1/ }).click()
  await expect(page.getByRole('radio', { name: 'b) 36' })).toBeChecked()
  expect(backend.state.saved[1]?.value).toBe(2)
})

test('closing the tab and opening the exam again loses nothing', async ({ context, page }) => {
  const backend = server()
  await connect(context, backend)
  await openRoom(page, 2)

  await page.getByLabel('Răspunsul tău').fill('2,5')
  await page.close() // straight away: the answer is only on the device

  const again = await context.newPage()
  await openRoom(again, 2)
  await expect(again.getByLabel('Răspunsul tău')).toHaveValue('2,5')
  await expect.poll(() => backend.state.saved[2]?.value).toBe('2,5')
})

test('losing the connection loses nothing: answers wait on the device and go when it is back', async ({ context, page }) => {
  const backend = server()
  await connect(context, backend)
  await openRoom(page, 1)

  backend.state.offline = true
  await context.setOffline(true)
  await page.getByRole('radio', { name: 'c) 32' }).check()
  await page.getByRole('button', { name: /Itemul 2/ }).click()
  await page.getByLabel('Răspunsul tău').fill('17')
  await page.getByRole('button', { name: /Itemul 3/ }).click()

  await expect(page.getByText('Fără conexiune · 2 răspunsuri în așteptare')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Conexiunea s-a întrerupt.')
  expect(backend.state.saved).toEqual({})

  backend.state.offline = false
  await context.setOffline(false)
  await expect(page.getByText(/^Salvat/)).toBeVisible()
  await expect(page.getByText(/Fără conexiune/)).toHaveCount(0)
  expect(backend.state.saved[1]?.value).toBe(3)
  expect(backend.state.saved[2]?.value).toBe('17')
})

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    test(`DS-004 offline, ${theme} at ${width} px`, async ({ context, page }) => {
      const backend = server()
      await connect(context, backend)
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
      await page.setViewportSize({ width, height: 900 })
      await openRoom(page, 1)
      backend.state.offline = true
      await context.setOffline(true)
      await page.getByRole('radio', { name: 'b) 36' }).check()
      await page.getByRole('button', { name: /Itemul 2/ }).click()
      await page.getByLabel('Răspunsul tău').fill('17')
      await page.getByRole('button', { name: /Itemul 1/ }).click()
      await expect(page.getByText('Fără conexiune · 2 răspunsuri în așteptare')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.offline.${theme}${width === 320 ? '.320' : ''}.png`), fullPage: true })
    })
  }
}
