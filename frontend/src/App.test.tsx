import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

function stubFetch(response: Promise<Response>) {
  const fetchMock = vi.fn().mockReturnValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('App placeholder', () => {
  it('shows that the API is connected when the health check answers', async () => {
    const fetchMock = stubFetch(
      Promise.resolve(
        new Response(JSON.stringify({ status: 'healthy', service: 'exam-platform-api' }), { status: 200 }),
      ),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Platformă de examene' })).toBeInTheDocument()
    expect(await screen.findByText('Conectat la server')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/health$/), expect.anything())
  })

  it('shows an error when the API does not answer', async () => {
    stubFetch(Promise.reject(new TypeError('Failed to fetch')))

    render(<App />)

    expect(await screen.findByText('Serverul nu răspunde')).toBeInTheDocument()
  })

  it('shows an error when the API answers with a server error', async () => {
    stubFetch(Promise.resolve(new Response('', { status: 500 })))

    render(<App />)

    expect(await screen.findByText('Serverul nu răspunde')).toBeInTheDocument()
  })
})
