import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SessionLoading from './SessionLoading'

afterEach(() => {
  vi.useRealTimers()
})

describe('SessionLoading (DS-016)', () => {
  it('shows the loading status, and the server-waking notice only after 5 s', () => {
    vi.useFakeTimers()
    render(<SessionLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Se încarcă contul tău…')
    expect(screen.queryByText(/Serverul pornește\./)).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(4999))
    expect(screen.queryByText(/Serverul pornește\./)).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Serverul pornește. După o pauză, prima conectare durează până la un minut. Nu închide pagina.',
    )
  })
})
