import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import LoginPage from '../pages/LoginPage'
import i18n from '.'

describe('i18n', () => {
  it('opens in Romanian (D-038)', () => {
    expect(i18n.language).toBe('ro')
    expect(i18n.t('app.name')).toBe('Evaluare Digitală')
  })

  it('changes the rendered text when the language switches to English', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(createElement(MemoryRouter, null, createElement(AuthProvider, null, createElement(LoginPage))))
    expect(screen.getByRole('heading', { name: 'Intră în cont' })).toBeInTheDocument()

    await i18n.changeLanguage('en')

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('sets <html lang> and the page title from the language', async () => {
    expect(document.documentElement.lang).toBe('ro')
    expect(document.title).toBe('Evaluare Digitală')

    await i18n.changeLanguage('en')

    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('Digital Assessment')
  })

  it('uses the three Romanian plural forms', () => {
    expect(i18n.t('duration.minutes', { count: 1 })).toBe('1 minut')
    expect(i18n.t('duration.minutes', { count: 5 })).toBe('5 minute')
    expect(i18n.t('duration.minutes', { count: 19 })).toBe('19 minute')
    expect(i18n.t('duration.minutes', { count: 20 })).toBe('20 de minute')
    expect(i18n.t('duration.minutes', { count: 50 })).toBe('50 de minute')
    expect(i18n.t('duration.minutes', { count: 101 })).toBe('101 minute')
  })

  it('uses the English plural forms', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('duration.minutes', { count: 1 })).toBe('1 minute')
    expect(i18n.t('duration.minutes', { count: 50 })).toBe('50 minutes')
  })
})
