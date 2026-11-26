export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

const TOKEN_KEY = 'auth_token'

export interface Health {
  status: string
  service: string
}

export async function getHealth(): Promise<Health> {
  const response = await fetch(`${API_BASE_URL}/health`, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`)
  }
  return response.json()
}

// The Sanctum bearer token (D-050). Storage can be unavailable (private mode, blocked
// site data): then the user stays signed in for this page only.
let memoryToken: string | null = null

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return memoryToken
  }
}

export function setToken(token: string | null): void {
  memoryToken = token
  try {
    if (token === null) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // keep the in-memory copy only
  }
}

const unauthorizedListeners = new Set<() => void>()

/** Called after a 401 has cleared the token. Returns a function that stops listening. */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

/**
 * An API answer that is not 2xx (docs/API.md, "Errors"). `status` 0 with code "network"
 * means the server could not be reached. `fields` holds the 422 error codes per field.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fields: Record<string, string[]>
  /** The whole error body, for answers that carry more than codes (e.g. C-004 `problems`). */
  readonly body: Record<string, unknown>

  constructor(status: number, code?: string, fields: Record<string, string[]> = {}, body: Record<string, unknown> = {}) {
    super(`API request failed with status ${status}${code ? ` (${code})` : ''}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
    this.body = body
  }
}

interface ApiRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiFetch<T>(path: string, { method = 'GET', body }: ApiRequest = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'network')
  }

  if (response.status === 401) {
    setToken(null)
    unauthorizedListeners.forEach((listener) => listener())
    throw new ApiError(401)
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(response.status, data.code, data.errors ?? {}, data)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}
