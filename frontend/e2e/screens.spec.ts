import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { mockAuthApi } from './mockApi.ts'

// Screenshots for docs/design/screens/, compared by eye with the mocks (DESIGN.md).
const screens = [
  { id: 'DS-001', path: '/login', heading: 'Intră în cont' },
  { id: 'DS-002', path: '/register', heading: 'Creează-ți cont de candidat' },
]
const widths = [
  { width: 1440, height: 900, suffix: '' },
  { width: 320, height: 640, suffix: '.320' },
]

function screenshotPath(name: string) {
  return fileURLToPath(new URL(`../../docs/design/screens/${name}`, import.meta.url))
}

for (const screen of screens) {
  for (const theme of ['light', 'dark']) {
    for (const { width, height, suffix } of widths) {
      test(`${screen.id} ${theme} at ${width} px`, async ({ page }) => {
        await mockAuthApi(page, 'candidate')
        await page.addInitScript((saved) => localStorage.setItem('theme', saved), theme)
        await page.setViewportSize({ width, height })
        await page.goto(screen.path)
        await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible()
        await page.evaluate('document.fonts.ready.then(() => true)')

        await page.screenshot({ path: screenshotPath(`${screen.id}.${theme}${suffix}.png`), fullPage: true })
      })
    }
  }
}
