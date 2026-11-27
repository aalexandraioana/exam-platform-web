import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { userWith } from './mockApi.ts'

// DS-010 screenshots with the mock's sample data, compared by eye with docs/design/mocks/DS-010.html.
const m = (p: number | null, r: number | null, flags: string[] = [], n = 14) => ({ n, p, r, flags, not_enough_data: p === null || r === null })
const opt = (option: number, label: string, count: number, n: number, correct = false) =>
  ({ option, label, correct, count, share: count / n, unused: !correct && count / n < 0.05 })
const variant = (id: number, code: string, type: string, measure: object, options: object[] | null = null) => ({ id, code, type, ...measure, options })

function analysisWith(state: 'data' | 'recheck' | 'one' | 'empty') {
  const competences = [
    {
      code: 'C1', description: 'Calculează fracții dintr-un număr', p: 0.74, weak: 1,
      items: [
        {
          position: 1, section: 'subject_1', points: 5, ...m(0.9286, 0.1203, ['too_easy', 'low_discrimination']),
          questions: [
            variant(31, 'M6-FR-001', 'single_choice', m(1, null, ['too_easy'], 8), [opt(1, '12', 0, 8), opt(2, '36', 8, 8, true), opt(3, '32', 0, 8), opt(4, '64', 0, 8)]),
            variant(32, 'M6-FR-002', 'short_answer', m(0.8333, 0.31, [], 6)),
          ],
        },
        { position: 2, section: 'subject_1', points: 5, ...m(0.6429, 0.48), questions: [variant(33, 'M6-FR-005', 'dual_choice', m(0.6429, 0.48), [opt(1, 'true', 9, 14, true), opt(2, 'false', 5, 14)])] },
        { position: 7, section: 'subject_2', points: 20, ...m(0.68, 0.71), questions: [variant(34, 'M6-PB-007', 'structured_problem', m(0.7, 0.69, [], 7)), variant(35, 'M6-PB-008', 'structured_problem', m(0.66, 0.74, [], 7))] },
      ],
    },
    {
      code: 'C2', description: 'Compară rapoarte și recunoaște proporții, inclusiv în probleme cu mărimi direct proporționale', p: 0.41, weak: 2,
      items: [
        {
          position: 3, section: 'subject_1', points: 5, ...m(0.3571, -0.18, ['low_discrimination', 'negative_discrimination']),
          questions: [variant(36, 'M6-RP-003', 'single_choice', m(0.3571, -0.18, ['low_discrimination', 'negative_discrimination']), [
            opt(1, '2 : 3', 2, 14), opt(2, '3 : 2', 5, 14, true), opt(3, '6 : 4 = 4 : 6, deoarece produsul mezilor este egal cu produsul extremilor', 7, 14), opt(4, '1 : 1', 0, 14),
          ])],
        },
        { position: 8, section: 'subject_2', points: 20, ...m(0.15, 0.44, ['too_hard']), questions: [variant(37, 'M6-PB-012', 'structured_problem', m(0.15, 0.44, ['too_hard']))] },
      ],
    },
  ]
  if (state === 'empty') return { exam, graded: 0, submissions: 6, recheck: 0, mean: null, median: null, competences: [] }
  if (state === 'one') {
    return { exam, graded: 1, submissions: 3, recheck: 0, mean: 8.5, median: 8.5, competences: competences.map((c) => ({ ...c, p: null, weak: 0, items: c.items.map((i) => ({ ...i, ...m(null, null, [], 1) })) })) }
  }
  return { exam, graded: 14, submissions: 14, recheck: state === 'recheck' ? 2 : 0, mean: 7.2, median: 7.5, competences }
}
const exam = { id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții' }

async function mockAnalysis(page: Page, state: Parameters<typeof analysisWith>[0] | 'error') {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    if (path === '/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { ...userWith('examiner'), name: 'Maria Popa' } }) })
    if (state === 'error') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server Error' }) })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(analysisWith(state)) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

const opened = async (p: Page) => {
  await p.getByText('Cum se citesc valorile').click()
  await p.getByRole('button', { name: '2 variante' }).first().click()
  await p.getByRole('row', { name: /Itemul 3/ }).getByRole('button', { name: '1 variantă' }).click()
  await expect(p.getByText('M6-RP-003')).toBeVisible()
}
const states = [
  { name: '', state: 'data', ready: opened },
  { name: 'recheck', state: 'recheck', ready: (p: Page) => expect(p.getByText('2 răspunsuri sunt marcate pentru reverificare', { exact: false })).toBeVisible() },
  { name: 'one', state: 'one', ready: (p: Page) => expect(p.getByText('Analiza are nevoie de cel puțin 2 încercări corectate', { exact: false })).toBeVisible() },
  { name: 'empty', state: 'empty', ready: (p: Page) => expect(p.getByRole('heading', { name: 'Încă nu există încercări corectate' })).toBeVisible() },
  { name: 'error', state: 'error', ready: (p: Page) => expect(p.getByRole('button', { name: 'Încearcă din nou' })).toBeVisible() },
] as const

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    for (const s of states) {
      test(`DS-010 ${s.name || 'data'}, ${theme} at ${width} px`, async ({ page }) => {
        await mockAnalysis(page, s.state)
        await page.addInitScript((t) => {
          localStorage.setItem('auth_token', '1|e2e')
          localStorage.setItem('theme', t)
        }, theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/examiner/exams/4/analysis')
        await s.ready(page)
        await page.evaluate('document.fonts.ready.then(() => true)')
        // The clicks scroll the page; the fixed header belongs at the top of a full-page shot.
        await page.mouse.move(0, 0)
        await page.evaluate('window.scrollTo(0, 0)')
        const suffix = width === 320 ? '.320' : ''
        const name = s.name ? `.${s.name}` : ''
        await page.screenshot({ path: screenshotPath(`DS-010${name}.${theme}${suffix}.png`), fullPage: true })
        expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(true)
      })
    }
  }
}
