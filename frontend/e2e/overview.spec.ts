import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

// DS-006 and DS-012 screenshots with the mocks' sample data, compared by eye with
// docs/design/mocks/DS-006.html and DS-012.html (P11).
const person = (id: number, first: string, last: string, role: string) => ({
  id, first_name: first, last_name: last, name: `${first} ${last}`, email: `${first.toLowerCase()}@exemplu.ro`, role, is_active: true, must_change_password: false,
})
const maria = person(8, 'Maria', 'Popa', 'examiner')
const radu = person(1, 'Radu', 'Ionescu', 'administrator')

const dashboard = {
  counts: { active_exams: 2, attempts_in_progress: 11, awaiting_grading: 7 },
  exams: [
    { id: 12, title: 'Evaluare Unitatea 3: Rapoarte și proporții', state: 'open', available_until: '2026-11-30T10:00:00+00:00', in_progress: 8, awaiting_grading: 3, results_published: false },
    { id: 9, title: 'Test de recapitulare la fracții zecimale și operații cu numere raționale pozitive, semestrul I', state: 'open', available_until: null, in_progress: 3, awaiting_grading: 0, results_published: false },
    { id: 7, title: 'Evaluare Unitatea 2: Unghiuri', state: 'closed', available_until: '2026-11-20T10:00:00+00:00', in_progress: 0, awaiting_grading: 4, results_published: false },
  ],
}
const idle = { counts: { active_exams: 0, attempts_in_progress: 0, awaiting_grading: 0 }, exams: [] }

const exam = (id: number, title: string, examiner: string, status: string, state: string | null, extra: object = {}) => ({
  id, title, examiner: { id: id + 100, name: examiner }, status, state,
  available_from: null, available_until: null, results_published_at: null, classes: [], attempts: { submitted: 0, graded: 0 }, ...extra,
})
const window = (from: string, until: string | null) => ({ available_from: from, available_until: until })
const allExams = [
  exam(6, 'Evaluare Unitatea 3: Rapoarte și proporții', 'Maria Popa', 'published', 'open', { ...window('2026-11-30T07:00:00+00:00', '2026-11-30T10:00:00+00:00'), classes: [{ id: 1, name: '6A' }, { id: 2, name: '6B' }], attempts: { submitted: 9, graded: 4 } }),
  exam(5, 'Test de recapitulare la fracții zecimale și operații cu numere raționale pozitive, semestrul I', 'Elena-Alexandra Popescu-Vasilescu', 'published', 'open', { ...window('2026-11-25T06:00:00+00:00', null), classes: [{ id: 3, name: '6C' }], attempts: { submitted: 2, graded: 0 } }),
  exam(4, 'Evaluare finală semestrul I', 'Maria Popa', 'published', 'upcoming', { ...window('2026-12-15T07:00:00+00:00', '2026-12-15T09:00:00+00:00'), classes: [{ id: 1, name: '6A' }, { id: 2, name: '6B' }, { id: 3, name: '6C' }] }),
  exam(3, 'Evaluare Unitatea 2: Unghiuri', 'Maria Popa', 'published', 'closed', { ...window('2026-11-20T07:00:00+00:00', '2026-11-20T10:00:00+00:00'), results_published_at: '2026-11-22T10:00:00+00:00', classes: [{ id: 1, name: '6A' }, { id: 2, name: '6B' }], attempts: { submitted: 24, graded: 24 } }),
  exam(2, 'Evaluare Unitatea 1: Numere naturale', 'Ion Rusu', 'published', 'closed', { ...window('2026-11-10T07:00:00+00:00', '2026-11-10T10:00:00+00:00'), classes: [{ id: 4, name: '5A' }], attempts: { submitted: 18, graded: 12 } }),
  exam(1, 'Fracții ordinare (în lucru)', 'Ion Rusu', 'draft', null),
]

async function mockApi(page: Page, user: object, data: { dashboard?: object; exams?: object[]; published?: boolean }) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/user') ? { user }
      : path.endsWith('/examiner/dashboard') ? data.dashboard
        : path.endsWith('/admin/exams') ? { exams: data.exams }
          : { exams: data.published ? [{ id: 1, status: 'published' }] : [] }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

async function open(page: Page, theme: string, width: number, path: string, user: object, data: Parameters<typeof mockApi>[2]) {
  await mockApi(page, user, data)
  await page.addInitScript((t) => {
    localStorage.setItem('auth_token', '1|e2e')
    localStorage.setItem('theme', t)
  }, theme)
  await page.setViewportSize({ width, height: 900 })
  await page.goto(path)
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''

    test(`DS-006 ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, '/examiner', maria, { dashboard })
      await expect(page.getByText('Evaluare Unitatea 2: Unghiuri')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-006.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-012 ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, '/admin/exams', radu, { exams: allExams })
      await expect(page.getByText('Fracții ordinare (în lucru)')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-012.${theme}${suffix}.png`), fullPage: true })
    })
  }

  test(`DS-006 nothing to do, ${theme}`, async ({ page }) => {
    await open(page, theme, 1440, '/examiner', maria, { dashboard: idle, published: true })
    await expect(page.getByRole('heading', { name: 'Nimic de făcut acum' })).toBeVisible()
    await page.screenshot({ path: screenshotPath(`DS-006.calm.${theme}.png`), fullPage: true })
  })

  test(`DS-006 no exam yet, ${theme}`, async ({ page }) => {
    await open(page, theme, 1440, '/examiner', maria, { dashboard: idle, published: false })
    await expect(page.getByRole('heading', { name: 'Încă nu ai publicat niciun examen' })).toBeVisible()
    await page.screenshot({ path: screenshotPath(`DS-006.empty.${theme}.png`), fullPage: true })
  })

  test(`DS-012 archived filter, ${theme}`, async ({ page }) => {
    await open(page, theme, 1440, '/admin/exams', radu, { exams: allExams })
    await page.getByLabel('Arată').selectOption('archived')
    await expect(page.getByText('Fracții ordinare (în lucru)')).toBeHidden()
    await page.screenshot({ path: screenshotPath(`DS-012.archived.${theme}.png`), fullPage: true })
  })
}
