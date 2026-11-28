import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { userWith } from './mockApi.ts'

// DS-008 screenshots with the mock's sample data, compared by eye with docs/design/mocks/DS-008.html.
const competences = [
  { id: 1, code: 'C1', description: 'Compară numere întregi' },
  { id: 2, code: 'C2', description: 'Folosește proporțiile directe' },
  { id: 3, code: 'C3', description: 'Recunoaște unghiuri opuse la vârf' },
  { id: 4, code: 'C4', description: 'Folosește proprietățile triunghiului isoscel' },
]
const pools = [{ id: 1, name: 'Numere întregi – ușor' }, { id: 2, name: 'Proporții – mediu' }, { id: 3, name: 'Unghiuri – probleme' }, { id: 4, name: 'Triunghiuri – probleme' }]
const topics = [{ id: 2, name: 'Rapoarte și proporții' }, { id: 4, name: 'Triunghiuri' }]
const classes = [{ id: 1, name: 'Clasa a VI-a A' }, { id: 2, name: 'Clasa a VI-a B' }, { id: 3, name: 'Clasa a V-a A' }]
const item = (id: number, position: number, section: string, points: number, pool: number, competence: number, difficulty: string, eligible: number, extra = {}) => ({
  id, position, section, points, pool: pools[pool - 1], competence: competences[competence - 1], difficulty, type: null, topic: null, eligible, ...extra,
})
const items = [
  item(1, 1, 'subject_1', 5, 1, 1, 'easy', 4),
  item(2, 2, 'subject_1', 5, 1, 1, 'easy', 4),
  item(3, 3, 'subject_1', 5, 2, 2, 'medium', 3, { type: 'short_answer', topic: topics[0] }),
  item(4, 4, 'subject_1', 5, 2, 2, 'medium', 3, { type: 'short_answer', topic: topics[0] }),
  item(5, 5, 'subject_1', 5, 1, 1, 'medium', 2),
  item(6, 6, 'subject_1', 5, 2, 2, 'easy', 6),
  item(7, 7, 'subject_2', 20, 3, 3, 'medium', 2, { type: 'structured_problem' }),
  item(8, 8, 'subject_2', 20, 4, 4, 'medium', 2, { type: 'structured_problem', topic: topics[1] }),
  item(9, 9, 'subject_2', 20, 2, 2, 'hard', 2, { type: 'structured_problem' }),
]
const exam = {
  id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții', status: 'draft', grade_level: 6, published_at: null,
  available_from: '2026-11-30T06:00:00Z', available_until: '2026-11-30T12:00:00Z',
  classes: classes.slice(0, 2), item_count: 9, description: null, duration_minutes: 50, max_attempts: 1, score_policy: 'highest', class_ids: [1, 2], items,
  checks: { totals: { subject_1: 30, subject_2: 60 }, problems: [], warnings: [] },
}
const errors = {
  ...exam, items: [...items.slice(0, 7), { ...items[8], position: 8, points: 25, topic: topics[0], eligible: 0 }],
  checks: {
    totals: { subject_1: 30, subject_2: 45 },
    problems: [{ code: 'subject_total', section: 'subject_2', sum: 45, expected: 60 }, { code: 'no_distinct_draw', items: [8] }],
    warnings: [{ code: 'competence_missing', competence: competences[3] }],
  },
}
const published = { ...exam, status: 'published', published_at: '2026-11-24T16:40:00Z' }
const results = { ...published, results_published_at: '2026-12-01T16:20:00Z' }
const list = [
  { ...exam, item_count: 9 },
  { id: 2, title: 'Test inițial · clasa a VI-a', status: 'published', grade_level: 6, available_from: '2026-09-15T05:00:00Z', available_until: '2026-09-20T17:00:00Z', published_at: '2026-09-14T10:00:00Z', classes: [classes[0]], item_count: 9 },
  { id: 3, title: 'Recapitulare pentru olimpiada de matematică · etapa pe școală, grupa de pregătire', status: 'draft', grade_level: 6, available_from: null, available_until: null, published_at: null, classes: [], item_count: 0 },
]
const preview = { items: [
  { item_id: 3, position: 3, question_id: 11, code: 'M6-RP-011', competence: 'C2', eligible: 4, values: {}, statement: 'Trei sferturi din numărul 48 reprezintă …', options: ['12', '36', '32', '64'], answer: null },
  { item_id: 4, position: 4, question_id: 14, code: 'M6-RP-014', competence: 'C2', eligible: 3, values: { k: 4, p: 3, q: 5, s: 32 }, statement: 'Numerele a și b sunt direct proporționale cu 3 și 5, iar a + b = 32. Numărul a este egal cu …', options: [], answer: 12 },
  { item_id: 7, position: 7, question_id: 22, code: 'M6-UG-022', competence: 'C3', eligible: 2, values: {}, statement: 'Unghiurile AOB și BOC sunt adiacente suplementare, iar ∢AOB = 3 · ∢BOC. Calculează măsurile celor două unghiuri.', options: [], answer: null },
] }

async function mockExams(page: Page, current: object, exams = list) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    const body =
      path === '/user' ? { user: { ...userWith('examiner'), name: 'Maria Popa' } }
      : path === '/exams' ? { exams }
      : path === '/classes' ? { classes: classes.map((c) => ({ ...c, join_code: 'K7Q-4MX', pending_count: 0, candidate_count: 24, published_exam_count: 1 })) }
      : path === '/pools' ? { pools }
      : path === '/competences' ? { competences }
      : path === '/topics' ? { topics }
      : path.endsWith('/match') ? { count: 3 }
      : path.endsWith('/preview') ? preview
      : path.endsWith('/grading') ? { counts: { total: 75, graded: 37, to_grade: 36, recheck: 2 } }
      : { exam: current }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

const states = [
  { name: 'list', path: '/examiner/exams', exam, ready: (p: Page) => expect(p.getByText('Test inițial · clasa a VI-a')).toBeVisible() },
  { name: 'empty', path: '/examiner/exams', exam, exams: [], ready: (p: Page) => expect(p.getByRole('heading', { name: 'Încă nu ai niciun examen' })).toBeVisible() },
  { name: 'new', path: '/examiner/exams/new', exam, ready: (p: Page) => expect(p.getByRole('button', { name: 'Creează examenul' })).toBeVisible() },
  { name: '', path: '/examiner/exams/4', exam, ready: (p: Page) => expect(p.getByText('Subiectul I: 30 / 30')).toBeVisible() },
  { name: 'errors', path: '/examiner/exams/4', exam: errors, ready: (p: Page) => expect(p.getByText('Subiectul II: 45 / 60')).toBeVisible() },
  { name: 'item', path: '/examiner/exams/4', exam, ready: async (p: Page) => { await p.getByRole('button', { name: 'Editează itemul 3' }).click(); await expect(p.getByRole('dialog').getByText('3 întrebări finalizate se potrivesc', { exact: false })).toBeVisible({ timeout: 5000 }) }, viewport: true },
  { name: 'published', path: '/examiner/exams/4', exam: published, ready: (p: Page) => expect(p.getByText('Examenul este publicat pentru', { exact: false })).toBeVisible() },
  { name: 'results', path: '/examiner/exams/4', exam: results, ready: (p: Page) => expect(p.getByText('Rezultatele sunt publicate, așa că data de încheiere nu se mai poate schimba.')).toBeVisible() },
  { name: 'item2', path: '/examiner/exams/4', exam, ready: async (p: Page) => { await p.getByRole('button', { name: 'Editează itemul 8' }).click(); await expect(p.getByRole('dialog').getByText('La Subiectul II, fiecare problemă are 20 de puncte.')).toBeVisible() }, viewport: true },
  { name: 'preview', path: '/examiner/exams/4', exam, ready: async (p: Page) => { await p.getByRole('button', { name: 'Previzualizează ca un candidat' }).click(); await expect(p.getByText('M6-RP-014', { exact: false })).toBeVisible() } },
]

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    for (const state of states) {
      test(`DS-008 ${state.name || 'builder'}, ${theme} at ${width} px`, async ({ page }) => {
        await mockExams(page, state.exam, state.exams)
        await page.addInitScript((t) => {
          localStorage.setItem('auth_token', '1|e2e')
          localStorage.setItem('theme', t)
        }, theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto(state.path)
        await state.ready(page)
        const suffix = width === 320 ? '.320' : ''
        const name = state.name ? `.${state.name}` : ''
        await page.screenshot({ path: screenshotPath(`DS-008${name}.${theme}${suffix}.png`), fullPage: !state.viewport })
      })
    }
  }
}
