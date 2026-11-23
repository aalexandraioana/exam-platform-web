import { vi } from 'vitest'

type Handler = Response | ((init: RequestInit) => Response | Promise<Response>)

export const candidate = {
  id: 7,
  name: 'Ana Dumitru',
  email: 'ana.dumitru@exemplu.ro',
  role: 'candidate',
  is_active: true,
} as const

export const examiner = {
  id: 8,
  name: 'Maria Popa',
  email: 'maria.popa@exemplu.ro',
  role: 'examiner',
  is_active: true,
} as const

export function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Stubs fetch with one handler per "METHOD /path" (the path without the /api prefix).
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const path = new URL(input).pathname.replace(/^\/api/, '')
    const key = `${init.method ?? 'GET'} ${path}`
    const handler = routes[key]
    if (!handler) throw new Error(`Unmocked request: ${key}`)
    return typeof handler === 'function' ? handler(init) : handler.clone()
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The JSON body of a call, by its index or by its "METHOD /path" key (the last such call). */
export function bodyOf(fetchMock: ReturnType<typeof mockApi>, call: number | string = 0): Record<string, unknown> {
  const calls = fetchMock.mock.calls
  const index =
    typeof call === 'number'
      ? call
      : calls.findLastIndex(([input, init]) => `${init?.method ?? 'GET'} ${new URL(input).pathname.replace(/^\/api/, '')}` === call)
  return JSON.parse(String(calls[index][1]?.body))
}

export function headersOf(fetchMock: ReturnType<typeof mockApi>, call = 0): Headers {
  return new Headers(fetchMock.mock.calls[call][1]?.headers)
}
