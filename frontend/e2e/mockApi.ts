import type { Page, Route } from '@playwright/test'

export type Role = 'candidate' | 'examiner' | 'administrator'

export function userWith(role: Role) {
  return { id: 7, name: 'Ana Dumitru', email: 'ana.dumitru@exemplu.ro', role, is_active: true }
}

function reply(route: Route, status: number, body?: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: body === undefined ? '' : JSON.stringify(body),
  })
}

// Mocks the auth endpoints of C-001 (docs/API.md) for a user with the given role.
export async function mockAuthApi(page: Page, role: Role) {
  const user = userWith(role)
  await page.route('**/api/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const signedIn = Boolean(request.headers()['authorization'])
    if (request.method() === 'POST' && path.endsWith('/login')) return reply(route, 200, { token: '1|e2e', user })
    if (request.method() === 'POST' && path.endsWith('/register')) return reply(route, 201, { token: '1|e2e', user })
    if (request.method() === 'POST' && path.endsWith('/logout')) return reply(route, 204)
    if (path.endsWith('/user')) return signedIn ? reply(route, 200, { user }) : reply(route, 401, { message: 'Unauthenticated.' })
    return reply(route, 404, { message: 'Not found.' })
  })
}
