import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import i18n from '.'

describe('i18n', () => {
  it('opens in Romanian (D-038)', () => {
    expect(i18n.language).toBe('ro')
    expect(i18n.t('app.name')).toBe('Platformă de examene')
  })

  it('changes the rendered text when the language switches to English', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(createElement(App))
    expect(screen.getByRole('heading', { name: 'Platformă de examene' })).toBeInTheDocument()

    await i18n.changeLanguage('en')

    expect(await screen.findByRole('heading', { name: 'Exam platform' })).toBeInTheDocument()
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
