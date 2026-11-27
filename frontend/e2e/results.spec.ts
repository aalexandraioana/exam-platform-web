import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

// DS-005 screenshots (P8b) with the mock's sample data, compared by eye with docs/design/mocks/DS-005.html.
const me = { id: 7, first_name: 'Andrei', last_name: 'Ionescu', name: 'Andrei Ionescu', email: 'andrei@exemplu.ro', role: 'candidate', is_active: true, must_change_password: false }
const s1 = [
  { position: 1, section: 'subject_1', type: 'single_choice', points: 5, statement: 'Trei sferturi din 48 reprezintă …', options: ['12', '36', '32', '64'],
    answer: 2, awarded_points: 5, correct: 2, explanation: 'Un sfert din 48 este 12, deci trei sferturi sunt 36.' },
  { position: 4, section: 'subject_1', type: 'short_answer', points: 5, options: [], answer: '20', awarded_points: 0, correct: '12', explanation: null,
    statement: 'Numerele a și b sunt direct proporționale cu 3 și 5, iar a + b = 32. Numărul a este egal cu …' },
  { position: 5, section: 'subject_1', type: 'dual_choice', points: 5, statement: 'Orice număr întreg negativ este mai mic decât 0.', options: [], answer: null, awarded_points: 0, correct: true, explanation: null },
]
const barem = [
  ['Triunghi isoscel ⇒ ∢B = ∢C', 3, 3], ['∢B + ∢C = 140°', 3, 3], ['∢B = 70°', 2, 2], ['Bisectoarea AD, triunghiurile ABD și ACD', 2, 2],
  ['△ABD ≅ △ACD (LUL), cu justificare', 5, 3], ['BD = DC ⇒ AD mediană', 5, 0],
].map(([description, points, earned]) => ({ description, points, earned }))
const s2 = [
  { position: 7, section: 'subject_2', type: 'structured_problem', points: 20, options: [], awarded_points: 14, adjustment: 1, uses_barem: true, barem,
    statement: 'În triunghiul ABC, AB = AC și ∢A = 40°. a) Calculează ∢B. b) Arată că bisectoarea din A este și mediană.',
    answer: 'a) ABC isoscel ⇒ ∢B = ∢C. ∢B + ∢C = 180° − 40° = 140° ⇒ ∢B = 70°.\nb) AD bisectoare. △ABD și △ACD: AB = AC, ∢BAD = ∢CAD, AD comună ⇒ congruente.',
    images: [{ id: 1, position: 1, name: 'pagina-1.jpg', size: 1 }, { id: 2, position: 2, name: 'pagina-2.jpg', size: 1 }],
    comment: 'La b) lipsește concluzia BD = DC; justificarea congruenței e incompletă.' },
  { position: 8, section: 'subject_2', type: 'structured_problem', points: 20, options: [], awarded_points: 16, adjustment: null, uses_barem: false, barem: [], images: [],
    statement: 'Unghiurile AOB și BOC sunt adiacente suplementare, iar ∢AOB = 3 · ∢BOC. Calculează măsurile celor două unghiuri.',
    answer: '∢AOB + ∢BOC = 180°, 4 · ∢BOC = 180°, ∢BOC = 45°, ∢AOB = 135°.', comment: 'Corect, dar explică de ce suma este 180°.' },
  { position: 9, section: 'subject_2', type: 'structured_problem', points: 20, options: [], awarded_points: 0, adjustment: null, uses_barem: false, barem: [], images: [],
    statement: 'Un produs costă 120 de lei. După o reducere de 15%, cât costă produsul?', answer: null, comment: null },
]
const attempt = (id: number, number: number, grade: number, counted: boolean, scores = [25, 44]) => ({
  id, attempt_number: number, submitted_at: '2026-11-30T07:48:00Z', auto_submitted: false, subject_1_score: scores[0], subject_2_score: scores[1],
  total_score: Math.round(grade * 10), grade, counted, items: [...s1, ...s2],
})
const title = (long: boolean) => long
  ? 'Evaluare națională pregătitoare interdisciplinară de matematică aplicată și raționament logic pentru clasa a VI-a'
  : 'Evaluare Unitatea 3: Rapoarte și proporții'
const results = (many: boolean, long = false) => ({
  exam: { id: 4, title: title(long), score_policy: 'highest', results_published_at: '2026-12-01T16:20:00Z',
    cohort_note: 'Greșeala cea mai des întâlnită la Subiectul I: confuzia dintre mărimi direct și invers proporționale (itemul 4). La Subiectul II, nu uitați să scrieți concluzia fiecărei demonstrații.' },
  attempts: many ? [attempt(50, 1, 6.4, false, [20, 34]), attempt(51, 2, 7.9, true)] : [attempt(51, 1, 7.9, true)],
})
const photo = (n: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#fffdf8"/>${n === 1
  ? '<path d="M150 60 L40 330 L260 330 Z M150 60 L150 330" fill="none" stroke="#333" stroke-width="3"/>'
  : [80, 130, 180, 230].map((y, i) => `<line x1="30" y1="${y}" x2="${i % 2 ? 200 : 260}" y2="${y}" stroke="#555" stroke-width="3"/>`).join('')}</svg>`

async function mockResults(page: Page, status: number, body: object) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    const image = path.match(/\/images\/(\d+)$/)
    if (image) return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: photo(Number(image[1])) })
    if (path === '/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: me }) })
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

const graded = (p: Page) => expect(p.getByTestId('grade')).toBeVisible()
const states = [
  { name: '', status: 200, body: results(false), ready: graded },
  { name: 'many', status: 200, body: results(true), ready: graded },
  { name: 'long', status: 200, body: results(false, true), ready: graded },
  { name: 'notyet', status: 409, body: { code: 'results_not_published' }, ready: (p: Page) => expect(p.getByRole('heading', { name: 'Rezultatele nu sunt publicate încă' })).toBeVisible() },
  { name: 'error', status: 500, body: {}, ready: (p: Page) => expect(p.getByRole('alert')).toBeVisible() },
]

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    for (const s of states) {
      test(`DS-005 ${s.name || 'results'}, ${theme} at ${width} px`, async ({ page }) => {
        await mockResults(page, s.status, s.body)
        await page.addInitScript((t) => {
          localStorage.setItem('auth_token', '1|e2e')
          localStorage.setItem('theme', t)
        }, theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/candidate/exams/4/results')
        await s.ready(page)
        const suffix = width === 320 ? '.320' : ''
        const name = s.name ? `.${s.name}` : ''
        await page.screenshot({ path: screenshotPath(`DS-005${name}.${theme}${suffix}.png`), fullPage: true })
      })
    }
  }
}
