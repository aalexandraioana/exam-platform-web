import type { Page, Route } from '@playwright/test'

export type Role = 'candidate' | 'examiner' | 'administrator'

export function userWith(role: Role) {
  return { id: 7, first_name: 'Ana', last_name: 'Dumitru', name: 'Ana Dumitru', email: 'ana.dumitru@exemplu.ro', role, is_active: true, must_change_password: false }
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
  // Only the API's origin: '**/api/**' would also catch Vite's /src/api/*.ts modules.
  await page.route('http://localhost:8000/api/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const signedIn = Boolean(request.headers()['authorization'])
    if (request.method() === 'POST' && path.endsWith('/login')) return reply(route, 200, { token: '1|e2e', user })
    if (request.method() === 'POST' && path.endsWith('/register')) return reply(route, 201, { token: '1|e2e', user })
    if (request.method() === 'POST' && path.endsWith('/logout')) return reply(route, 204)
    if (path.endsWith('/user')) return signedIn ? reply(route, 200, { user }) : reply(route, 401, { message: 'Unauthenticated.' })
    if (path.endsWith('/classes') && request.method() === 'GET') return reply(route, 200, { classes: [] })
    if (path.endsWith('/admin/users') && request.method() === 'GET') return reply(route, 200, { users: [user] })
    return reply(route, 404, { message: 'Not found.' })
  })
}
