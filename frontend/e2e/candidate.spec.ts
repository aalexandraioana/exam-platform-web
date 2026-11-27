import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

// DS-003 screenshots (P7a) with the mock's sample data, compared by eye with
// docs/design/mocks/DS-003.html.
const me = { id: 7, first_name: 'Andrei', last_name: 'Ionescu', name: 'Andrei Ionescu', email: 'andrei@exemplu.ro', role: 'candidate', is_active: true, must_change_password: false }
const struct = { item_counts: { subject_1: 6, subject_2: 3 }, results_published: false, grade: null, open_attempt_id: null, open_attempt: null }
const at = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()

function exams() {
  return [
    { ...struct, id: 1, title: 'Evaluare Unitatea 3: Rapoarte și proporții', description: null, duration_minutes: 50, available_from: at(-60), available_until: at(240),
      max_attempts: 1, attempts_used: 1, state: 'open', can_start: false, submitted: false, topics: ['Rapoarte'],
      open_attempt_id: 12, open_attempt: { id: 12, started_at: at(-21.25), expires_at: at(28.75) } },
    { ...struct, id: 2, title: 'Evaluare sumativă: Triunghiuri și unghiuri', description: 'Clasificarea triunghiurilor, suma unghiurilor, unghiul exterior și cazurile de congruență.',
      duration_minutes: 50, available_from: at(-60), available_until: '2026-11-24T12:00:00Z', max_attempts: 1, attempts_used: 0, state: 'open', can_start: true, submitted: false, topics: ['Triunghiuri', 'Unghiuri'] },
    { ...struct, id: 3, title: 'Exercițiu recapitulativ: Mulțimi de numere întregi', description: 'Operații cu numere întregi, modulul unui număr și relația de ordine.',
      duration_minutes: 40, available_from: '2026-12-02T06:00:00Z', available_until: null, max_attempts: 2, attempts_used: 0, state: 'upcoming', can_start: false, submitted: false, topics: ['Mulțimi de numere'] },
    { ...struct, id: 4, title: 'Evaluare de verificare: Unghiuri și triunghiuri', description: null, duration_minutes: 50, available_from: null, available_until: null,
      max_attempts: 1, attempts_used: 1, state: 'open', can_start: false, submitted: true, topics: ['Unghiuri'] },
    { ...struct, id: 5, title: 'Exersare: Rapoarte și proporții', description: null, duration_minutes: 30, available_from: at(-60), available_until: '2026-11-28T18:00:00Z',
      max_attempts: 3, attempts_used: 1, state: 'open', can_start: true, submitted: true, topics: ['Rapoarte', 'Proporții'] },
    // P8b: results published, with the counted grade.
    { ...struct, id: 6, title: 'Evaluare Unitatea 2: Fracții și procente', description: null, duration_minutes: 50, available_from: null, available_until: '2026-11-20T12:00:00Z',
      max_attempts: 1, attempts_used: 1, state: 'closed', can_start: false, submitted: true, results_published: true, grade: 7.9, topics: ['Rapoarte', 'Proporții'] },
  ]
}

async function mockApi(page: Page, classes: object, list: () => object[]) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/user')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: me }) })
    if (path.endsWith('/memberships')) {
      return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'x', errors: { class_code: ['not_found'] } }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ server_time: new Date().toISOString(), classes, exams: list() }) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

async function open(page: Page, theme: string, width: number, classes: object, list: () => object[]) {
  await mockApi(page, classes, list)
  await page.addInitScript((t) => {
    localStorage.setItem('auth_token', '1|e2e')
    localStorage.setItem('theme', t)
  }, theme)
  await page.setViewportSize({ width, height: 900 })
  await page.goto('/candidate')
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''

    test(`DS-003 ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, { accepted: 1, pending: 0 }, exams)
      await expect(page.getByRole('heading', { name: 'Examenele tale (5)' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-003.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-003 no class, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, { accepted: 0, pending: 0 }, () => [])
      await expect(page.getByRole('heading', { name: 'Nu ești încă într-o clasă' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-003.noclass.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-003 request waiting, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, { accepted: 0, pending: 1 }, () => [])
      await expect(page.getByRole('heading', { name: 'Cererea ta așteaptă examinatorul' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-003.waiting.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-003 join dialog with a wrong code, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, { accepted: 1, pending: 0 }, exams)
      await page.getByRole('button', { name: 'Am un cod de clasă' }).click()
      const dialog = page.getByRole('dialog', { name: 'Intră într-o clasă' })
      await dialog.getByLabel('Codul clasei').fill('k7q-4mz')
      await dialog.getByRole('button', { name: 'Trimite cererea' }).click()
      await expect(dialog.getByText('Nu există nicio clasă cu acest cod.', { exact: false })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-003.join.${theme}${suffix}.png`) })
    })
  }
}
