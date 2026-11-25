import { defineConfig, devices } from '@playwright/test'

// Drives the SPA in Chromium against a mocked API (page.route in each spec).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    // As the teachers' browsers: Romanian formats (date fields) and Romania's time zone.
    locale: 'ro-RO',
    timezoneId: 'Europe/Bucharest',
    // Native date fields follow Chromium's own interface language, not the page locale.
    launchOptions: { args: ['--lang=ro-RO'] },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
