import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { userWith } from './mockApi.ts'

// DS-007 screenshots with the mock's sample data, compared by eye with docs/design/mocks/DS-007.html.
const competences = [
  { id: 1, code: 'C1', description: 'Compară numere întregi' },
  { id: 2, code: 'C2', description: 'Folosește proporțiile directe' },
  { id: 3, code: 'C3', description: 'Recunoaște unghiuri opuse la vârf' },
  { id: 4, code: 'C4', description: 'Folosește proprietățile triunghiului isoscel' },
]
const topics = [
  { id: 1, name: 'Mulțimi de numere întregi' }, { id: 2, name: 'Rapoarte și proporții' },
  { id: 3, name: 'Unghiuri' }, { id: 4, name: 'Triunghiuri' },
]
const pools = [{ id: 1, name: 'Numere întregi – ușor' }, { id: 2, name: 'Proporții – mediu' }, { id: 3, name: 'Triunghiuri – probleme' }, { id: 4, name: 'Unghiuri – ușor' }]

const row = (id: number, code: string, statement: string, c: number, t: number | null, status: string, poolIds: number[], extra = {}) => ({
  id, code, section: 'subject_1', type: 'short_answer', status, grade_level: 6, difficulty: 'easy', statement,
  competence: { id: c, code: `C${c}` }, topic: t ? topics[t - 1] : null, pools: pools.filter((p) => poolIds.includes(p.id)), ...extra,
})
const questions = [
  row(12, 'M6-UG-012', 'Diagonalele paralelogramului …', 3, 3, 'ready', [4]),
  row(14, 'M6-RP-014', 'Numerele a și b sunt direct proporționale cu {p} și {q}, iar a + b = {s}. Numărul a este egal cu …', 2, 2, 'ready', [2]),
  row(4, 'M6-TR-004', 'În triunghiul ABC, AB = AC și ∢A = 40°. a) Calculează ∢B. b) Arată că bisectoarea din A este și mediană.', 4, 4, 'ready', [3], { section: 'subject_2', type: 'structured_problem' }),
  row(25, 'M6-UG-025', 'Unghiurile AOB și BOC sunt opuse la vârf …', 3, null, 'draft', []),
  row(7, 'M6-MN-007', 'Cât face −3 + 8?', 1, 1, 'ready', [1], { type: 'single_choice' }),
]
const detail = (summary: (typeof questions)[number], extra: Record<string, unknown>) => ({
  ...summary, competence: competences[summary.competence.id - 1], points: 5, explanation: null, parameters: null,
  uses_barem: false, barem: [], copied_from: null, published: false, problems: [], ...extra,
})
const details: Record<string, unknown> = {
  12: detail(questions[0], { answer_key: { kind: 'text', accepted: ['se înjumătățesc', 'se taie în părți egale'] }, explanation: 'Diagonalele paralelogramului au același mijloc.' }),
  14: detail(questions[1], {
    difficulty: 'medium', answer_key: { kind: 'number' },
    parameters: { values: { p: { random: { min: 2, max: 5 } }, q: { random: { min: 3, max: 9, except: [6] } }, k: { fixed: 4 }, s: { calculated: '(p + q) · k' } }, conditions: ['p < q'], answer: 'p · k' },
  }),
  7: detail(questions[4], { answer_key: { options: ['5', '−5', '11', '−11'], correct: 1 } }),
}
const samples = [
  { values: { k: 4, p: 3, q: 5, s: 32 }, statement: '', options: [], answer: 12 },
  { values: { k: 4, p: 2, q: 7, s: 36 }, statement: '', options: [], answer: 8 },
  { values: { k: 4, p: 4, q: 9, s: 52 }, statement: '', options: [], answer: 16 },
]
const entries = [
  { id: 40, code: 'LIB-UG-102', section: 'subject_1', type: 'short_answer', grade_level: 6, difficulty: 'easy', statement: 'Măsura suplementului unghiului de 35° este …', competence: { code: 'C3', description: '' }, topic: { name: 'Unghiuri' }, author: 'Ion Marin', copied_as: null },
  { id: 41, code: 'LIB-RP-044', section: 'subject_1', type: 'short_answer', grade_level: 6, difficulty: 'medium', statement: 'Un produs costă 240 de lei. După o reducere de 15%, prețul devine …', competence: { code: 'C2', description: '' }, topic: { name: 'Rapoarte și proporții' }, author: 'Ion Marin', copied_as: null },
  { id: 42, code: 'LIB-TR-017', section: 'subject_2', type: 'structured_problem', grade_level: 6, difficulty: 'hard', statement: 'Arătați că în orice triunghi isoscel, mediana din vârf este și înălțime.', competence: { code: 'C4', description: '' }, topic: { name: 'Triunghiuri' }, author: 'Ana Rusu', copied_as: 'M6-TR-011' },
]

async function mockBank(page: Page, bank = questions, patch?: { status: number; body: (id: string) => object }) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    if (patch && route.request().method() === 'PATCH') {
      return route.fulfill({ status: patch.status, contentType: 'application/json', body: JSON.stringify(patch.body(path.split('/')[2])) })
    }
    const body =
      path === '/user' ? { user: { ...userWith('examiner'), name: 'Maria Popa' } }
      : path === '/competences' ? { competences }
      : path === '/topics' ? { topics }
      : path === '/pools' ? { pools }
      : path === '/questions' ? { questions: bank }
      : path === '/questions/preview' ? { problems: [], samples }
      : path === '/library' ? { entries }
      : { question: details[path.split('/')[2]] }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

const corrections = [
  { corrected_at: '2026-11-27T12:20:00Z', examiner: 'Maria Popa', answers: 14 },
  { corrected_at: '2026-11-26T07:05:00Z', examiner: 'Maria Popa', answers: 3 },
]

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

const states = [
  { name: 'short', search: '?q=12', ready: (page: Page) => expect(page.getByLabel('Răspuns acceptat 1')).toBeVisible() },
  { name: 'param', search: '?q=14', ready: (page: Page) => expect(page.getByText('p = 3, q = 5, s = 32 · răspuns 12', { exact: false })).toBeVisible({ timeout: 5000 }) },
  { name: 'choice', search: '?q=7', ready: (page: Page) => expect(page.getByRole('radio', { name: 'Varianta a este corectă' })).toBeChecked() },
  { name: 'library', search: '?tab=library', ready: (page: Page) => expect(page.getByText('LIB-RP-044')).toBeVisible() },
  { name: 'empty', search: '', ready: (page: Page) => expect(page.getByRole('heading', { name: 'Banca ta este goală' })).toBeVisible() },
  // P8c (D-046, Q-087–Q-090): after saving a corrected key, and the refusals once drawn.
  { name: 'corrected', search: '?q=7', patch: { status: 200, body: (id: string) => ({ question: { ...(details[id] as object), key_corrections: corrections }, regraded: { answers: 14, flagged: 0 } }) },
    ready: async (page: Page) => { await page.getByRole('button', { name: 'Salvează' }).click(); await expect(page.getByRole('list', { name: 'Corecturi ale răspunsului corect' })).toBeVisible() } },
  { name: 'optlocked', search: '?q=7', patch: { status: 422, body: () => ({ message: 'x', errors: { answer_key: ['options_locked'] } }) },
    ready: async (page: Page) => { await page.getByRole('button', { name: 'Salvează' }).click(); await expect(page.getByRole('alert')).toBeVisible() } },
  { name: 'typelocked', search: '?q=7', patch: { status: 422, body: () => ({ message: 'x', errors: { type: ['type_locked'] } }) },
    ready: async (page: Page) => { await page.getByRole('button', { name: 'Salvează' }).click(); await expect(page.getByRole('alert')).toBeVisible() } },
  { name: 'paramlocked', search: '?q=14', patch: { status: 422, body: () => ({ message: 'x', errors: { parameters: ['parameters_locked'] } }) },
    ready: async (page: Page) => { await page.getByRole('button', { name: 'Salvează' }).click(); await expect(page.getByRole('alert')).toBeVisible() } },
]

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    for (const state of states) {
      test(`DS-007 ${state.name}, ${theme} at ${width} px`, async ({ page }) => {
        await mockBank(page, state.name === 'empty' ? [] : questions, 'patch' in state ? state.patch : undefined)
        await page.addInitScript((t) => {
          localStorage.setItem('auth_token', '1|e2e')
          localStorage.setItem('theme', t)
        }, theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/examiner/questions${state.search}`)
        await state.ready(page)
        await page.evaluate('window.scrollTo(0, 0)') // a click may have scrolled; full-page shots start at the top
        const suffix = width === 320 ? '.320' : ''
        const name = state.name === 'short' ? '' : `.${state.name}`
        await page.screenshot({ path: screenshotPath(`DS-007${name}.${theme}${suffix}.png`), fullPage: true })
      })
    }
  }
}
