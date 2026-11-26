import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

// DS-004 screenshots (P7b) with the mock's sample data, compared by eye with
// docs/design/mocks/DS-004.html.
const me = { id: 7, first_name: 'Andrei', last_name: 'Ionescu', name: 'Andrei Ionescu', email: 'andrei@exemplu.ro', role: 'candidate', is_active: true, must_change_password: false }
const saved = (value: unknown, marked = false) => ({ value, version: 1, marked_for_review: marked, saved_at: '2026-11-25T10:01:00Z' })
const s1 = (position: number, type: string, statement: string, options: string[], answer: unknown = null) => ({ position, section: 'subject_1', type, points: 5, statement, options, answer })

// A photographed page of handwritten work, for the thumbnails.
const handwritten = (triangle: boolean) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" fill="#fffcf7"/>${
  triangle ? '<path d="M20 120 L60 30 L100 120 Z" fill="none" stroke="#5a5248" stroke-width="2"/><path d="M14 140 h60 M14 150 h80" stroke="#8a8073" stroke-width="2"/>'
    : '<path d="M14 24 h70 M14 40 h86 M14 56 h60 M14 72 h92 M14 88 h50 M14 104 h80" stroke="#5a5248" stroke-width="2"/>'}</svg>`

function attempt(status = 'in_progress', minutesLeft = 28.75, auto = false) {
  return {
    id: 12, exam: { id: 4, title: 'Evaluare Unitatea 3: Rapoarte și proporții', max_attempts: 1 }, status, attempt_number: 1,
    started_at: new Date().toISOString(), expires_at: new Date(Date.now() + minutesLeft * 60_000).toISOString(), server_time: new Date().toISOString(),
    submitted_at: status === 'submitted' ? new Date().toISOString() : null, auto_submitted: auto, photos_enabled: true,
    items: [
      s1(1, 'single_choice', 'Care este cel mai mare număr întreg negativ?', ['−1', '0', '−10', '1'], saved(1)),
      s1(2, 'short_answer', 'Calculează 25% din 80.', [], saved('20')),
      s1(3, 'single_choice', 'Alege răspunsul corect. Trei sferturi din numărul 48 reprezintă:', ['12', '36', '32', '64'], saved(2)),
      s1(4, 'short_answer', 'Completează spațiul punctat. Numerele a și b sunt direct proporționale cu 3 și 5, iar a + b = 64. Numărul a este egal cu …', [], saved('24', true)),
      s1(5, 'multiple_choice', 'Care dintre numerele de mai jos sunt divizibile cu 3?', ['21', '14', '30', '25', '12'], null),
      s1(6, 'dual_choice', 'Orice număr întreg negativ este mai mic decât 0.', [], saved(true)),
      { position: 7, section: 'subject_2', type: 'structured_problem', points: 20, statement: 'Un pătrat are latura de 6 cm.\na) Află perimetrul. (10 puncte)\nb) Află aria. (10 puncte)', options: [], answer: saved('a) P = 4 · 6 = 24 cm') },
      { position: 8, section: 'subject_2', type: 'structured_problem', points: 20, statement: 'În triunghiul ABC, AB = AC și ∢A = 40°.\na) Calculează măsura unghiului B. (8 puncte)\nb) Arată că bisectoarea unghiului A este și mediana laturii BC. (12 puncte)', options: [], answer: saved('a) ∢B = ∢C = 70°'),
        images: [{ id: 31, position: 1, name: 'IMG_2040.jpg', size: 2_516_582 }, { id: 32, position: 2, name: 'IMG_2042.jpg', size: 1_992_294 }] },
      { position: 9, section: 'subject_2', type: 'structured_problem', points: 20, statement: 'Un dreptunghi are lungimea de 3 ori mai mare decât lățimea, iar perimetrul de 64 cm.\na) Află dimensiunile dreptunghiului. (10 puncte)\nb) Calculează aria lui. (10 puncte)', options: [], answer: null },
    ],
  }
}

async function mockApi(page: Page, { status = 'in_progress', saveFails = false, hang = false, minutesLeft = 28.75, auto = false } = {}) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const reply = (code: number, body: unknown) => route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify(body) })
    if (path.endsWith('/user')) return reply(200, { user: me })
    if (/\/images\/\d+$/.test(path) && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: handwritten(path.endsWith('31')) })
    if (path.endsWith('/images') && request.method() === 'POST') return new Promise(() => {}) // stays uploading
    if (request.method() === 'PUT') {
      if (saveFails) return reply(500, { message: 'x' })
      const body = request.postDataJSON()
      return reply(200, { answer: { value: body.answer, version: body.version, marked_for_review: body.marked_for_review, saved_at: new Date().toISOString() }, applied: true, status: 'in_progress' })
    }
    if (hang) return new Promise(() => {})
    if (path.endsWith('/submit')) return reply(200, { attempt: attempt('submitted', minutesLeft, false) })
    return reply(200, { attempt: attempt(status, minutesLeft, auto) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

async function open(page: Page, theme: string, width: number, item: number, options = {}) {
  await mockApi(page, options)
  await page.addInitScript((t) => {
    localStorage.setItem('auth_token', '1|e2e')
    localStorage.setItem('theme', t)
  }, theme)
  await page.setViewportSize({ width, height: 900 })
  await page.goto(`/candidate/attempts/12?item=${item}`)
}

const states = [
  { name: 'DS-004', item: 3, ready: 'Trei sferturi' },
  { name: 'DS-004.short', item: 4, ready: 'Completează spațiul' },
  { name: 'DS-004.multiple', item: 5, ready: 'Care dintre numerele' },
  { name: 'DS-004.dual', item: 6, ready: 'Orice număr întreg' },
  { name: 'DS-004.text', item: 9, ready: 'Un dreptunghi' },
]

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''

    for (const state of states) {
      test(`${state.name} ${theme} at ${width} px`, async ({ page }) => {
        await open(page, theme, width, state.item)
        await expect(page.getByText(state.ready, { exact: false })).toBeVisible()
        await page.screenshot({ path: screenshotPath(`${state.name}.${theme}${suffix}.png`), fullPage: true })
      })
    }

    test(`DS-004 save failed, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 4, { saveFails: true })
      await page.getByLabel('Răspunsul tău').fill('25')
      await page.getByRole('button', { name: /Itemul 5/ }).click()
      await page.getByRole('button', { name: /Itemul 4/ }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.unsaved.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 loading, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 1, { hang: true })
      await expect(page.getByLabel('Se încarcă examenul')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.loading.${theme}${suffix}.png`), fullPage: true })
    })
  }

  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''

    test(`DS-004 under 5 minutes, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 3, { minutesLeft: 4.2 })
      await expect(page.getByRole('alert')).toContainText('Mai sunt sub 5 minute.')
      await page.screenshot({ path: screenshotPath(`DS-004.low.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 last minute, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 3, { minutesLeft: 0.8 })
      await expect(page.getByRole('alert')).toContainText('Mai este 1 minut.')
      await page.screenshot({ path: screenshotPath(`DS-004.oneminute.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 timer hidden, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 3)
      await page.getByRole('button', { name: 'Ascunde cronometrul' }).click()
      await expect(page.getByText('Cronometrul este ascuns.', { exact: false })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.hidden.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 submit dialog, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 3)
      await page.getByRole('button', { name: 'Predă examenul' }).click()
      await expect(page.getByRole('dialog', { name: 'Predai examenul?' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.submit.${theme}${suffix}.png`) })
    })

    test(`DS-004 submitted, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 3)
      await page.getByRole('button', { name: 'Predă examenul' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Predă examenul' }).click()
      await expect(page.getByRole('heading', { name: 'Examen predat' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.done.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 sealed, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 3, { status: 'submitted', auto: true })
      await expect(page.getByRole('heading', { name: 'Timpul s-a încheiat' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.sealed.${theme}${suffix}.png`), fullPage: true })
    })
  }

  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''

    test(`DS-004 photos, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 8)
      await expect(page.getByRole('img', { name: 'Fotografia 2' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.photos.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 photo uploading, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 8)
      await page.getByLabel('Adaugă o fotografie').setInputFiles({ name: 'IMG_2043.HEIC', mimeType: 'image/heic', buffer: Buffer.alloc(200_000) })
      await expect(page.getByRole('progressbar')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.photo-uploading.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 photo refused, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 8)
      await page.getByLabel('Adaugă o fotografie').setInputFiles({ name: 'IMG_2077.JPG', mimeType: 'image/jpeg', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) })
      await expect(page.getByRole('alert')).toContainText('are peste 10 MB')
      await page.screenshot({ path: screenshotPath(`DS-004.photo-refused.${theme}${suffix}.png`), fullPage: true })
    })

    test(`DS-004 photo delete, ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, 8)
      await page.getByRole('button', { name: 'Șterge fotografia 1' }).click()
      await expect(page.getByRole('alertdialog', { name: 'Ștergi fotografia 1?' })).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-004.photo-delete.${theme}${suffix}.png`) })
    })
  }

  test(`DS-004 navigator sheet, ${theme} on a phone`, async ({ page }) => {
    await open(page, theme, 320, 3)
    await page.getByRole('button', { name: /Itemi 7\/9/ }).click()
    await expect(page.getByRole('dialog', { name: 'Itemi' })).toBeVisible()
    await page.screenshot({ path: screenshotPath(`DS-004.navigator.${theme}.320.png`) })
  })
}
