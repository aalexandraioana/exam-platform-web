import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { userWith } from './mockApi.ts'

// DS-009 screenshots with the mock's sample data, compared by eye with docs/design/mocks/DS-009.html.
const names = ['Ana Dumitru', 'Bogdan Ilie', 'Carla Moldovan', 'Darius Pop', 'Elena-Alexandra Popescu-Vasilescu']
const positions = [7, 8, 9]
const codes: Record<number, string> = { 7: 'M6-UG-022', 8: 'M6-TR-004', 9: 'M6-RP-031' }

function queueWith(state: 'grading' | 'recheck' | 'wait' | 'noend' | 'done' | 'published' | 'empty') {
  const allGraded = !['grading', 'recheck'].includes(state)
  const answers = positions.flatMap((position) =>
    names.map((candidate, i) => {
      const graded = allGraded || position === 7 || i < 2
      const recheck = state === 'recheck' && position === 8 && i < 2
      return {
        attempt_item_id: position * 10 + i, attempt_id: 100 + i, candidate, number: i + 1, position, question_code: codes[position],
        photos: position === 8 ? 2 : 0, answered: true, status: recheck ? 'recheck' : graded ? 'graded' : 'to_grade', awarded_points: graded ? 12 + i : null,
      }
    }),
  )
  const count = (s: string) => answers.filter((a) => a.status === s).length
  const missing = state === 'grading' ? ['ungraded', 'window_open'] : state === 'recheck' ? ['ungraded', 'recheck', 'window_open']
    : state === 'wait' ? ['open_attempts', 'window_open'] : state === 'noend' ? ['window_open'] : []
  return {
    exam: {
      id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții', classes: ['Clasa a VI-a A', 'Clasa a VI-a B'],
      available_until: state === 'noend' ? null : '2026-11-30T12:00:00Z', submissions: state === 'empty' ? 0 : names.length,
      results_published_at: state === 'published' ? '2026-12-01T16:20:00Z' : null,
      cohort_note: state === 'published' ? 'Greșeala cea mai des întâlnită la Subiectul I: confuzia dintre mărimi direct și invers proporționale (itemul 4). La Subiectul II, nu uitați să scrieți concluzia fiecărei demonstrații.' : null,
    },
    items: state === 'empty' ? [] : positions.map((position, k) => ({
      position, competence: ['C3', 'C4', 'C2'][k], points: 20, graded: answers.filter((a) => a.position === position && a.status === 'graded').length, total: names.length,
    })),
    answers: state === 'empty' ? [] : answers,
    counts: state === 'empty' ? { total: 0, graded: 0, to_grade: 0, recheck: 0 } : { total: answers.length, graded: count('graded'), to_grade: count('to_grade'), recheck: count('recheck') },
    publish: { ready: state === 'done', missing, mean: allGraded ? 7.64 : null, median: allGraded ? 7.9 : null },
  }
}

const barem = [
  { id: 1, description: 'Triunghi isoscel ⇒ ∢B = ∢C', points: 3, modified: false },
  { id: 2, description: '∢B + ∢C = 140°', points: 3, modified: false },
  { id: 3, description: '∢B = 70°', points: 2, modified: false },
  { id: 4, description: 'Bisectoarea AD, triunghiurile ABD și ACD', points: 2, modified: false },
  { id: 5, description: '△ABD ≅ △ACD (LUL), cu justificare', points: 5, modified: false },
  { id: 6, description: 'BD = DC ⇒ AD mediană', points: 5, modified: false },
]
function itemWith(id: number, state: string) {
  const position = Math.floor(id / 10)
  const candidate = names[id % 10]
  const recheck = state === 'recheck'
  return {
    attempt_item_id: id, attempt_id: 100 + (id % 10), position, question_id: 31, question_code: codes[position], candidate, points: 20,
    statement: position === 8
      ? 'În triunghiul ABC, AB = AC și ∢A = 40°. a) Calculează ∢B. b) Arată că bisectoarea din A este și mediană.'
      : 'Unghiurile AOB și BOC sunt adiacente suplementare, iar ∢AOB = 3 · ∢BOC. Calculează măsurile celor două unghiuri.',
    text: position === 8 ? 'a) ABC isoscel ⇒ ∢B = ∢C. ∢B + ∢C = 180° − 40° = 140° ⇒ ∢B = 75°.\nb) AD bisectoare. △ABD și △ACD: AB = AC, ∢BAD = ∢CAD, AD comună ⇒ congruente.' : '∢AOB + ∢BOC = 180°, 4 · ∢BOC = 180°, ∢BOC = 45°, ∢AOB = 135°.',
    photos: position === 8 ? [{ id: 1, position: 1, name: 'pagina-1.jpg', size: 1 }, { id: 2, position: 2, name: 'pagina-2.jpg', size: 1 }] : [],
    uses_barem: state !== 'nobarem',
    barem: state === 'nobarem' ? [] : recheck ? barem.map((s) => (s.id >= 5 ? { ...s, modified: true } : s)) : barem,
    scores: recheck ? { 1: 3, 2: 3, 3: 0, 4: 2, 5: 4, 6: 0 } : {}, adjustment: recheck ? 0 : null,
    comment: recheck ? 'La a) ai greșit calculul: 140° : 2 = 70°. La b) lipsește concluzia BD = DC.' : null,
    awarded_points: recheck ? 12 : null, needs_recheck: recheck, graded_at: recheck ? '2026-12-01T10:00:00Z' : null,
  }
}

const photo = (n: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#fffdf8"/>${n === 1
  ? '<path d="M150 60 L40 330 L260 330 Z M150 60 L150 330" fill="none" stroke="#333" stroke-width="3"/><text x="140" y="50" font-size="24">A</text><text x="20" y="350" font-size="24">B</text><text x="265" y="350" font-size="24">C</text>'
  : [80, 130, 180, 230, 280].map((y, i) => `<line x1="30" y1="${y}" x2="${i % 2 ? 200 : 260}" y2="${y}" stroke="#555" stroke-width="3"/>`).join('')}</svg>`

async function mockGrading(page: Page, state: Parameters<typeof queueWith>[0], itemState = 'barem') {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    const image = path.match(/\/grading\/images\/(\d+)$/)
    if (image) return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: photo(Number(image[1])) })
    const one = path.match(/\/grading\/items\/(\d+)$/)
    const body = path === '/user' ? { user: { ...userWith('examiner'), name: 'Maria Popa' } }
      : one ? { item: itemWith(Number(one[1]), itemState) }
      : queueWith(state)
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

const heading = (p: Page) => expect(p.getByRole('heading', { level: 2, name: /itemul/ })).toBeVisible()
const states = [
  { name: '', state: 'grading', ready: heading },
  { name: 'candidate', state: 'grading', ready: async (p: Page) => { await heading(p); await p.getByRole('button', { name: 'Pe candidat' }).click(); await expect(p.getByRole('navigation', { name: 'Problemele candidatului' })).toBeVisible() } },
  { name: 'edit', state: 'grading', ready: async (p: Page) => { await heading(p); await p.getByRole('button', { name: 'Editează baremul' }).click(); await expect(p.getByRole('region', { name: 'Editează baremul' })).toBeVisible() } },
  { name: 'nobarem', state: 'grading', item: 'nobarem', ready: async (p: Page) => { await heading(p); await p.getByRole('combobox', { name: 'Item' }).selectOption('9'); await expect(p.getByText('Această întrebare se corectează fără barem', { exact: false })).toBeVisible() } },
  { name: 'anon', state: 'grading', ready: async (p: Page) => { await heading(p); await p.getByRole('checkbox', { name: 'Ascunde numele candidaților' }).check(); await expect(p.getByRole('heading', { level: 2, name: /Candidat #/ })).toBeVisible() } },
  { name: 'recheck', state: 'recheck', item: 'recheck', ready: async (p: Page) => { await heading(p); await expect(p.getByText('modificat').first()).toBeVisible() } },
  { name: 'wait', state: 'wait', ready: (p: Page) => expect(p.getByText('Poți publica după ce nu mai lucrează nimeni la examen', { exact: false }).first()).toBeVisible() },
  { name: 'noend', state: 'noend', ready: (p: Page) => expect(p.getByText('Examenul nu are dată de încheiere.', { exact: false })).toBeVisible() },
  { name: 'done', state: 'done', ready: (p: Page) => expect(p.getByRole('button', { name: 'Publică rezultatele pentru 5 candidați' })).toBeEnabled() },
  { name: 'published', state: 'published', ready: (p: Page) => expect(p.getByText('Rezultatele au fost publicate pe', { exact: false })).toBeVisible() },
  { name: 'empty', state: 'empty', ready: (p: Page) => expect(p.getByRole('heading', { name: 'Încă nu există predări' })).toBeVisible() },
] as const

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    for (const s of states) {
      test(`DS-009 ${s.name || 'grading'}, ${theme} at ${width} px`, async ({ page }) => {
        await mockGrading(page, s.state, 'item' in s ? s.item : 'barem')
        await page.addInitScript((t) => {
          localStorage.setItem('auth_token', '1|e2e')
          localStorage.setItem('theme', t)
        }, theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/examiner/exams/4/grading')
        await s.ready(page)
        const suffix = width === 320 ? '.320' : ''
        const name = s.name ? `.${s.name}` : ''
        await page.screenshot({ path: screenshotPath(`DS-009${name}.${theme}${suffix}.png`), fullPage: true })
      })
    }
  }
}
