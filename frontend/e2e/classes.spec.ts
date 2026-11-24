import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { userWith } from './mockApi.ts'

// DS-013 screenshots with the mock's sample data, compared by eye with docs/design/mocks/DS-013.html.
const classes = [
  { id: 1, name: 'Clasa a VI-a A', join_code: 'K7Q-4MX', pending_count: 3, candidate_count: 24, published_exam_count: 2 },
  { id: 2, name: 'Clasa a VI-a B', join_code: 'PQR-7ST', pending_count: 0, candidate_count: 26, published_exam_count: 2 },
  { id: 3, name: 'Clasa a V-a A · grupa de pregătire pentru olimpiada de matematică', join_code: 'HJK-23M', pending_count: 0, candidate_count: 9, published_exam_count: 0 },
]
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
const detail = {
  class: classes[0],
  requests: [
    { id: 41, candidate: { id: 30, name: 'Matei Radu', email: 'matei.radu@exemplu.ro' }, requested_at: ago(10) },
    { id: 42, candidate: { id: 31, name: 'Ioana Georgescu', email: 'ioana.g@exemplu.ro' }, requested_at: ago(60 * 24) },
    { id: 43, candidate: { id: 32, name: 'Alex Necunoscut', email: 'xyz123@exemplu.com' }, requested_at: ago(60 * 48) },
  ],
  candidates: [
    { id: 9, name: 'Ana Dumitru', email: 'ana.d@exemplu.ro', joined_at: '2026-09-12T08:00:00Z' },
    { id: 10, name: 'Bogdan Ilie', email: 'bogdan.ilie@exemplu.ro', joined_at: '2026-09-12T08:00:00Z' },
    { id: 11, name: 'Elena-Alexandra Popescu-Vasilescu', email: 'elena.alexandra.popescu.vasilescu@exemplu.ro', joined_at: '2026-09-14T08:00:00Z' },
  ],
}

async function mockClassesApi(page: Page, list: typeof classes) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/user')
      ? { user: { ...userWith('examiner'), name: 'Maria Popa' } }
      : path.endsWith('/classes')
        ? { classes: list }
        : detail
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''
    test(`DS-013 ${theme} at ${width} px`, async ({ page }) => {
      await mockClassesApi(page, classes)
      await page.addInitScript((t) => {
        localStorage.setItem('auth_token', '1|e2e')
        localStorage.setItem('theme', t)
      }, theme)
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/examiner')
      await expect(page.getByRole('heading', { level: 2, name: 'Cereri în așteptare (3)' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-013.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-013 empty, ${theme} at ${width} px`, async ({ page }) => {
      await mockClassesApi(page, [])
      await page.addInitScript((t) => {
        localStorage.setItem('auth_token', '1|e2e')
        localStorage.setItem('theme', t)
      }, theme)
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/examiner')
      await expect(page.getByRole('heading', { name: 'Încă nu ai nicio clasă' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-013.empty.${theme}${suffix}.png`), fullPage: true })
    })
  }
}
