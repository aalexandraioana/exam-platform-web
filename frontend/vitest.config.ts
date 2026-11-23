import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

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
