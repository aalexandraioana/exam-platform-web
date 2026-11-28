import { expect, test } from '@playwright/test'
import { mockAuthApi, type Role } from './mockApi.ts'

const homes: Array<{ role: Role; path: string; heading: string }> = [
  { role: 'candidate', path: '/candidate', heading: 'Panou' },
  // P3: the Examiner's home is the classes screen (DS-013).
  { role: 'examiner', path: '/examiner', heading: 'Clase' },
  // P3b: the Administrator's home is the users screen (DS-011).
  { role: 'administrator', path: '/admin', heading: 'Utilizatori' },
]

for (const { role, path, heading } of homes) {
  test(`login as ${role} lands on ${path}`, async ({ page }) => {
    await mockAuthApi(page, role)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('Email', { exact: true }).fill('ana.dumitru@exemplu.ro')
    await page.getByLabel('Parola', { exact: true }).fill('lalea-verde-48')
    await page.getByRole('button', { name: 'Intră în cont' }).click()

    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  })
}

test('registration lands on the Candidate home', async ({ page }) => {
  await mockAuthApi(page, 'candidate')
  await page.goto('/register')

  await page.getByLabel('Prenume', { exact: true }).fill('Ana')
  await page.getByLabel('Nume', { exact: true }).fill('Dumitru')
  await page.getByLabel('Email', { exact: true }).fill('ana.dumitru@exemplu.ro')
  await page.getByLabel('Parola', { exact: true }).fill('lalea-verde-48')
  await page.getByLabel('Scrie parola din nou').fill('lalea-verde-48')
  await page.getByRole('button', { name: 'Creează contul' }).click()

  await expect(page).toHaveURL(/\/candidate$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Panou' })).toBeVisible()
})
