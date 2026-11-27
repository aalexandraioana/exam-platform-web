import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Dates render in the users' time zone, as in playwright.config.ts, so tests pass the same on
// a laptop in Romania and on CI in UTC. Set before the test workers start; they inherit it.
process.env.TZ = 'Europe/Bucharest'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // e2e/ holds the Playwright specs, run with `npx playwright test`.
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }),
)
