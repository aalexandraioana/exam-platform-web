import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

// DS-011 and DS-018 screenshots with the mocks' sample data, compared by eye with
// docs/design/mocks/DS-011.html and DS-018.html.
const person = (id: number, first: string, last: string, email: string, role: string, is_active = true) => ({
  id, first_name: first, last_name: last, name: `${first} ${last}`, email, role, is_active, must_change_password: false,
})
const me = person(1, 'Radu', 'Ionescu', 'radu.ionescu@exemplu.ro', 'administrator')
const users = [
  person(9, 'Ana', 'Dumitru', 'ana.d@exemplu.ro', 'candidate'),
  person(10, 'Bogdan', 'Ilie', 'bogdan.ilie@exemplu.ro', 'candidate'),
  me,
  person(2, 'Ioana', 'Marin', 'ioana.marin@exemplu.ro', 'administrator'),
  person(8, 'Maria', 'Popa', 'maria.popa@exemplu.ro', 'examiner'),
  person(11, 'Elena-Alexandra', 'Popescu-Vasilescu', 'elena.alexandra.popescu.vasilescu@exemplu.ro', 'candidate', false),
]

async function mockApi(page: Page, user: object) {
  await page.route('http://localhost:8000/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/user') ? { user } : { users }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

async function open(page: Page, theme: string, width: number, path: string, user: object) {
  await mockApi(page, user)
  await page.addInitScript((t) => {
    localStorage.setItem('auth_token', '1|e2e')
    localStorage.setItem('theme', t)
  }, theme)
  await page.setViewportSize({ width, height: 900 })
  await page.goto(path)
}

const dialogs = [
  { state: 'password', button: 'Parolă temporară pentru Bogdan Ilie', name: 'Parolă temporară pentru Bogdan Ilie', role: 'dialog' as const },
  { state: 'examiner', button: 'Examinator nou', name: 'Examinator nou', role: 'dialog' as const },
  { state: 'deactivate', button: 'Dezactivează contul lui Bogdan Ilie', name: 'Dezactivezi contul lui Bogdan Ilie?', role: 'alertdialog' as const },
]

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 320]) {
    const suffix = width === 320 ? '.320' : ''

    test(`DS-011 ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, '/admin', me)
      await expect(page.getByText('Ana Dumitru')).toBeVisible()
      await page.screenshot({ path: screenshotPath(`DS-011.${theme}${suffix}.png`), fullPage: true })
    })

    for (const dialog of dialogs) {
      test(`DS-011 ${dialog.state} dialog, ${theme} at ${width} px`, async ({ page }) => {
        await open(page, theme, width, '/admin', me)
        await page.getByRole('button', { name: dialog.button }).click()
        await expect(page.getByRole(dialog.role, { name: dialog.name })).toBeVisible()
        await page.screenshot({ path: screenshotPath(`DS-011.${dialog.state}.${theme}${suffix}.png`) })
      })
    }

    test(`DS-018 ${theme} at ${width} px`, async ({ page }) => {
      await open(page, theme, width, '/candidate', { ...users[0], must_change_password: true })
      await expect(page.getByRole('heading', { level: 1, name: 'Alege-ți o parolă nouă' })).toBeVisible()
      await expect(page).toHaveURL(/\/change-password$/)
      await page.screenshot({ path: screenshotPath(`DS-018.${theme}${suffix}.png`), fullPage: true })
    })
  }
}
