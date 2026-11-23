import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getToken, setToken } from '../api/client'
import { AuthProvider } from '../auth/AuthProvider'
import i18n from '../i18n'
import { candidate, json, mockApi } from '../test/mockApi'
import AppHeader from './AppHeader'

function renderHeader() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppHeader />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  document.documentElement.dataset.theme = 'light'
})

describe('AppHeader', () => {
  it('shows the brand and no log-out when signed out', () => {
    mockApi({})
    renderHeader()

    expect(screen.getByRole('link', { name: 'Evaluare Digitală' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ieși din cont' })).not.toBeInTheDocument()
  })

  it('switches the theme and saves the choice', () => {
    mockApi({})
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Schimbă tema' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('switches the language', async () => {
    mockApi({})
    renderHeader()
    expect(screen.getByRole('button', { name: 'RO' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(await screen.findByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(i18n.language).toBe('en')
  })

  it('logs out a signed-in user', async () => {
    setToken('12|abc')
    mockApi({ 'GET /user': json(200, { user: candidate }), 'POST /logout': json(204) })
    renderHeader()

    fireEvent.click(await screen.findByRole('button', { name: 'Ieși din cont' }))

    expect(await screen.findByRole('link', { name: 'Evaluare Digitală' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ieși din cont' })).not.toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})
