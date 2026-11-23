# Plan — P2: accounts, login and registration

**Status:** approved 2026-11-23 · build day: Tue 24 Nov · next: [p3-classes.md](p3-classes.md)

## Size
M. One API area (register, login, logout, current user) with about 14 Pest tests, the
first SPA screens (DS-001, DS-002) with routing, auth state and shared form components,
and the Playwright setup for screenshots.

## Approach
**Backend.** Add Sanctum's `HasApiTokens` to `User`. An `AuthController` handles register,
login, logout and the current user, and issues bearer tokens (D-050). Registration
optionally takes a class code: a code that matches no class refuses the registration
(D-053), and a valid one creates the user and a pending membership in one transaction
(D-028), using the P1a `classes` and `class_memberships` tables. Two middlewares are added
here, because P3 and every later part need them. `active` refuses users with
`is_active = false`. `role:<role>` checks the role, as the P1a review asked. A `User`
model hook deletes a user's tokens when `is_active` turns false or the password changes.
`JoinCode::normalise()` (upper case, hyphen and spaces removed) is used to look the code
up; P3 adds its generator.

Examiners and the first Administrator are created with `php artisan app:create-user`,
which asks for the password interactively. DS-011 and its endpoint move to P11. CORS is
locked to `FRONTEND_URL`, and Render's proxy is trusted. The endpoints are documented in
`docs/API.md` (D-051), and `CONTRACTS.md` gets C-001 (auth API).

**Frontend.** Add `react-router`, as planned in the approved auth plan, Part 2 §1. It
was never built in P0. `api/client.ts` gains `apiFetch`, which adds the bearer token,
clears it on 401, and maps 422 field errors. An `AuthProvider` stores the token in
localStorage and loads the user from `GET /api/user` on start. `ProtectedRoute`
redirects by role to `/candidate`, `/examiner` or `/admin`, each a temporary placeholder
until its own part (P3 points `/examiner` to the classes screen). Shared components are
built from the mocks' classes: Button, TextField, PasswordField, Alert and AppHeader.
AppHeader has the brand and the language and theme toggles, plus log-out when signed in.
The theme toggle replaces the system-only theme in `main.tsx`, and `<html lang>` and the
title follow the language. Playwright drives the screens against a mocked API
(`page.route`) for the redirect tests and the screenshots.

**Rejected:** a cookie session (D-050); a hand-made router (react-router was already
planned); a UI kit (tokens-only Tailwind, PATTERN-003).

## Files
| Action | Path | What |
|---|---|---|
| modify | `backend/app/Models/User.php` | `HasApiTokens`; lower-case email; revoke tokens on deactivation or password change |
| create | `backend/app/Http/Controllers/AuthController.php` | register, login, logout, user |
| create | `backend/app/Http/Requests/RegisterRequest.php`, `LoginRequest.php` | validation; class code normalised and looked up |
| create | `backend/app/Http/Middleware/EnsureActive.php`, `EnsureRole.php` | `active`, `role:<role>` |
| create | `backend/app/Http/Resources/UserResource.php` | JSON shape in C-001 |
| create | `backend/app/Support/JoinCode.php` | `normalise()` (P3 adds generate and format) |
| create | `backend/app/Console/Commands/CreateUser.php` | `app:create-user` (examiner or administrator; password asked, never an argument) |
| modify | `backend/routes/api.php` | auth routes, `throttle` on login and register |
| modify | `backend/bootstrap/app.php` | middleware aliases, trusted proxies |
| create | `backend/config/cors.php` | allowed origin `FRONTEND_URL` |
| modify | `backend/database/seeders/DatabaseSeeder.php` | local-only demo users (factory passwords, no real ones) |
| modify | `render.yaml` | `FRONTEND_URL` on the API |
| create | `backend/tests/Feature/Auth/*Test.php`, `Console/CreateUserTest.php`, `Unit/JoinCodeTest.php` | Pest |
| modify | `frontend/package.json` | `react-router`, dev `@playwright/test` |
| modify | `frontend/src/api/client.ts` | `apiFetch`, `ApiError` |
| create | `frontend/src/api/auth.ts` | typed calls |
| create | `frontend/src/auth/AuthProvider.tsx`, `ProtectedRoute.tsx` | token, user, role redirects |
| create | `frontend/src/components/` (Button, TextField, PasswordField, Alert, AppHeader) | from mock.css |
| create | `frontend/src/theme.ts` | theme toggle, saved choice, system default |
| create | `frontend/src/pages/LoginPage.tsx` (DS-001), `RegisterPage.tsx` (DS-002), `PlaceholderHome.tsx` | screens |
| modify | `frontend/src/App.tsx`, `main.tsx`, `i18n/ro.json`, `en.json`, `i18n/index.ts` | routes; texts; `lang` and title follow language |
| create | `frontend/playwright.config.ts`, `frontend/e2e/auth.spec.ts`, `e2e/screens.spec.ts` | redirects, screenshots |
| create | `docs/API.md` | auth endpoints (D-051) |
| modify | `docs/agents/CONTRACTS.md` | C-001 auth API |
| modify | `docs/design/registry.yaml`, `docs/design/screens/` | DS-001/002 implemented; screenshots |
| modify | `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | auth is bearer only (remove "stateful cookies", `SANCTUM_STATEFUL_DOMAINS`); `FRONTEND_URL`; status |

## Tests
| # | Behaviour | Test (file · kind) | Not automated? why |
|---|---|---|---|
| 1 | Register creates an active Candidate and returns a token; `role` in the body is ignored | Auth/RegisterTest · Pest | |
| 2 | Register refuses: missing name, bad email, password < 8, confirmation mismatch, email taken (any case) | Auth/RegisterTest · Pest | |
| 3 | Register with a valid code (any case, with or without hyphen) creates a pending membership | Auth/RegisterTest · Pest | |
| 4 | Register with a code that matches no class: 422 on `class_code`, no user created (D-053) | Auth/RegisterTest · Pest | |
| 5 | Login returns a token and the user; email is case-insensitive | Auth/LoginTest · Pest | |
| 6 | Login with a wrong password or unknown email: the same 422 message | Auth/LoginTest · Pest | |
| 7 | Login of an inactive user: 403 `account_inactive`, no token | Auth/LoginTest · Pest | |
| 8 | Login is throttled after repeated failures (429) | Auth/LoginTest · Pest | |
| 9 | Logout revokes the current token; the next request is 401 | Auth/LogoutTest · Pest | |
| 10 | `GET /api/user` returns the user; 401 without a token | Auth/UserTest · Pest | |
| 11 | Deactivating a user deletes their tokens; an inactive user's old token gets 403 | Auth/DeactivationTest · Pest | |
| 12 | `role:examiner` refuses Candidates and Administrators (403); `active` refuses inactive users (test routes) | Auth/AccessTest · Pest | |
| 13 | `app:create-user` creates an Examiner or Administrator with a hashed password; refuses role `candidate` and a taken email | Console/CreateUserTest · Pest | |
| 14 | `JoinCode::normalise` | Unit/JoinCodeTest · Pest | |
| 15 | `apiFetch` adds the token, clears it on 401, maps 422 field errors | api/client.test.ts · Vitest | |
| 16 | AuthProvider: login stores the token, start-up loads the user, logout clears it | auth/AuthProvider.test.tsx · Vitest | |
| 17 | ProtectedRoute: redirects to `/login` without a user; a wrong role goes to its own home | auth/ProtectedRoute.test.tsx · Vitest | |
| 18 | Login page: field errors, wrong credentials, inactive, throttled, offline, server-waking banner after 5 s, forgot-password note | pages/LoginPage.test.tsx · Vitest | |
| 19 | Register page: client checks, 422 mapped to fields (email taken, wrong code) | pages/RegisterPage.test.tsx · Vitest | |
| 20 | Theme toggle saves the choice; language switch sets `<html lang>` and title | theme.test.ts, i18n.test.ts · Vitest | |
| 21 | Login per role lands on its home; register lands on Candidate home | e2e/auth.spec.ts · Playwright (mocked API) | |
| 22 | Screenshots DS-001, DS-002, light and dark, 320 px and 1440 px | e2e/screens.spec.ts · Playwright | compared by eye with the mocks |
| 23 | Live: register, login, CORS from the site's origin | | manual on Render after merge |

## Design
DS-001 ✅ and DS-002 ✅ (approved today). Tokens only, through the Tailwind theme
(PATTERN-003); Lucide icons (D-033). States as in the mocks: default, field errors,
loading, server waking, wrong credentials, inactive, offline, forgot password; for
registration: field errors, email taken, wrong code, loading, offline. Light and dark.
The three role homes are a temporary placeholder (heading and log-out) with no mock and
no screenshot, flagged as temporary.

## Sequencing
`docs/API.md` and C-001 are written first, from this plan. Then two builders in parallel:
**backend** (`backend/`, `render.yaml`) ∥ **frontend** (`frontend/`). The files don't
overlap, and the contract is fixed. Docs and the registry are updated last.

## Risks
- **Playwright's browser download** (about 150 MB) failed earlier today. The builder asks
  before running `npx playwright install chromium`. If it can't run, the screenshots are
  reported as not done; nothing else depends on them.
- **CORS or the proxy on Render** only shows up live. Test 23 checks it right after merge,
  and `FRONTEND_URL` is a dashboard value that's easy to fix.
- **Free-tier cold start** (up to a minute): covered by the "server waking" banner.
- **The token in localStorage** can be read by injected script. This was accepted with
  D-050, and React escapes output.
- Nothing here is hard to reverse. No schema change.

## Out of scope
Classes, join requests and the DS-013 screen (P3). DS-011 and the Administrator UI and
endpoints (P11; the artisan command covers the pilot). The Candidate dashboard (P7).
Changing your own password. Token expiry. Running Playwright in CI.

**Suggestions (not planned):** run the Playwright screenshots in CI; add "change my
password" for Candidates later.

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|

18 entries confirmed before, unchanged: D-001, D-003, D-008, D-009, D-014, D-020, D-022,
D-028, D-033, D-035, D-036, D-037, D-038, D-050, D-051, D-052, D-053, plus PATTERN-001.

Candidates used (not yet approved, followed as the current practice): PATTERN-003
tokens-only Tailwind.

### Considered, not applied
- D-015, D-049: class and Exam rules, applied in P3.
- PATTERN-002 styled select, PATTERN-004 constraints: no select and no schema change here.

### Assumptions (no entry behind them)
1. Examiners and the Administrator are created with `app:create-user`; DS-011 moves to P11 (your answer today). D-020 holds: the person running the command acts as Administrator.
2. Emails are stored lower case; login and the unique check ignore case.
3. Login and register are throttled (5 failed logins per minute per email and IP; a 429 shows the error banner with "Prea multe încercări. Așteaptă un minut.").
4. The "server waking" banner appears when login takes more than 5 seconds.
5. Role homes: Candidate `/candidate`, Examiner `/examiner`, Administrator `/admin`, placeholders until P3, P7 and P11.
6. Tokens don't expire; logout, deactivation and a password change revoke them.
