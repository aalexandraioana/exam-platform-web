import { beforeEach, describe, expect, it, vi } from 'vitest'
import { headersOf, json, mockApi } from '../test/mockApi'
import { ApiError, apiFetch, getHealth, getToken, onUnauthorized, setToken } from './client'

beforeEach(() => {
  localStorage.clear()
})

describe('getHealth', () => {
  it('returns the health answer of the API', async () => {
    const fetchMock = mockApi({ 'GET /health': json(200, { status: 'healthy', service: 'exam-platform-api' }) })

    await expect(getHealth()).resolves.toEqual({ status: 'healthy', service: 'exam-platform-api' })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/health$/), expect.anything())
  })

  it('fails when the API answers with a server error', async () => {
    mockApi({ 'GET /health': json(500) })

    await expect(getHealth()).rejects.toThrow()
  })
})

describe('apiFetch', () => {
  it('sends the stored token as a bearer token and asks for JSON', async () => {
    setToken('12|abc')
    const fetchMock = mockApi({ 'GET /user': json(200, { user: { id: 7 } }) })

    await expect(apiFetch('/user')).resolves.toEqual({ user: { id: 7 } })

    const headers = headersOf(fetchMock)
    expect(headers.get('Authorization')).toBe('Bearer 12|abc')
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('sends no Authorization header without a token', async () => {
    const fetchMock = mockApi({ 'GET /user': json(200, {}) })

    await apiFetch('/user')

    expect(headersOf(fetchMock).has('Authorization')).toBe(false)
  })

  it('sends a body as JSON', async () => {
    const fetchMock = mockApi({ 'POST /login': json(200, {}) })

    await apiFetch('/login', { method: 'POST', body: { email: 'a@b.ro' } })

    expect(headersOf(fetchMock).get('Content-Type')).toBe('application/json')
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"email":"a@b.ro"}')
  })

  it('returns nothing for 204 No Content', async () => {
    mockApi({ 'POST /logout': json(204) })

    await expect(apiFetch('/logout', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('clears the token and notifies the auth layer on 401', async () => {
    setToken('12|revoked')
    const listener = vi.fn()
    const stop = onUnauthorized(listener)
    mockApi({ 'GET /user': json(401, { message: 'Unauthenticated.' }) })

    const error = await apiFetch('/user').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
    expect(getToken()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    stop()
  })

  it('maps 422 field errors to their codes', async () => {
    mockApi({
      'POST /register': json(422, {
        message: 'The given data was invalid.',
        errors: { email: ['taken'], class_code: ['not_found'] },
      }),
    })

    const error = (await apiFetch('/register', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({ email: ['taken'], class_code: ['not_found'] })
  })

  it('keeps the code of a 403 answer', async () => {
    mockApi({ 'POST /login': json(403, { code: 'account_inactive', message: 'This account is deactivated.' }) })

    const error = (await apiFetch('/login', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(403)
    expect(error.code).toBe('account_inactive')
  })

  it('reports a network failure as status 0 with the code "network"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = (await apiFetch('/login').catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.code).toBe('network')
  })
})
