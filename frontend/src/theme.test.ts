import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initTheme, setTheme } from './theme'

function systemPrefersDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: dark && query === '(prefers-color-scheme: dark)', media: query })),
  )
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('theme', () => {
  it('follows the system preference when nothing is saved', () => {
    systemPrefersDark(true)

    expect(initTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('defaults to light when the system has no dark preference', () => {
    systemPrefersDark(false)

    expect(initTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('saves the chosen theme and uses it on the next start', () => {
    systemPrefersDark(false)

    setTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    delete document.documentElement.dataset.theme
    expect(initTheme()).toBe('dark')
  })

  it('still works when storage is not available', () => {
    systemPrefersDark(true)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })

    expect(initTheme()).toBe('dark')
    expect(() => setTheme('light')).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('light')

    vi.restoreAllMocks()
  })
})
