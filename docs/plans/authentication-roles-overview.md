# Implementation Plan — Authentication with Roles (Candidate, Examiner, Administrator)

## Goal Description
Implement full-stack authentication and role-based access control (RBAC) across the headless Laravel 13 REST API (`backend/`) and React + Vite SPA (`frontend/`), enforcing three authorization tiers defined in `README.md` and `ARCHITECTURE.md`:
- **Candidate:** Self-registration (`POST /api/register`), email/password login, access to candidate dashboard (`DS-003`).
- **Examiner:** Login with admin-approved credentials, access to examiner dashboard (`DS-006`), blocked if deactivated (accounts are created by an Administrator, D-020).
- **Administrator:** Pre-seeded superuser login, platform oversight and user management access (`DS-011`).

## User Review Required
> [!IMPORTANT]
> - **Scaffolding prerequisite:** As `backend/` and `frontend/` directories do not yet exist, initial building will initialize the Laravel 13 project and React + Vite SPA skeletons strictly adhering to [D-036](../agents/decisions/platform-and-delivery.md) and [D-009](../agents/decisions/platform-and-delivery.md).
> - **Examiner accounts:** Candidate accounts are active immediately upon registration; Examiner accounts are created by an Administrator (no self-registration, no approval step), and `is_active = false` means a deactivated account ([D-020](../agents/DECISIONS.md)).

## Open Questions
- None blocking implementation. Candidate self-registers directly; initial Administrator and sample Examiner accounts will be provisioned via database seeders.

---

## Proposed Changes

### Backend REST API (`backend/`)
#### [NEW] `docker-compose.yml` (Root)
PostgreSQL 16 container definition with persistent volume and port mapping `5432:5432` per [D-003](../agents/decisions/platform-and-delivery.md).

#### [NEW] `backend/database/migrations/xxxx_create_users_table.php`
Schema migration defining:
- `id` (bigint/uuid)
- `name` (string)
- `email` (string, unique)
- `password` (hashed string)
- `role` (enum: `candidate`, `examiner`, `administrator`, default `candidate`)
- `is_active` (boolean, default true for candidates, false for self-registered examiners if enabled, true for seeded examiners)
- timestamps

#### [NEW] `backend/app/Models/User.php`
Eloquent User model with Laravel Sanctum `HasApiTokens`, fillable attributes, hidden password/remember_token, and role helper methods (`isCandidate()`, `isExaminer()`, `isAdministrator()`).

#### [NEW] `backend/app/Http/Controllers/AuthController.php`
- `register(RegisterRequest $request)`: Validates input, creates Candidate, issues Sanctum bearer token.
- `login(LoginRequest $request)`: Validates credentials, checks `is_active`, issues Sanctum bearer token and returns serialized user object.
- `logout(Request $request)`: Revokes active user token.
- `me(Request $request)`: Returns authenticated user profile and active role.

#### [NEW] `backend/app/Http/Middleware/EnsureUserHasRole.php`
Route middleware checking if `$request->user()->role` matches the route's allowed roles, aborting with `403 Forbidden` if unauthorized.

#### [NEW] `backend/routes/api.php`
Public auth routes (`POST /api/register`, `POST /api/login`) and protected routes (`POST /api/logout`, `GET /api/user`) protected by `auth:sanctum`.

#### [NEW] `backend/database/seeders/UserSeeder.php`
Seeds default users for testing and grading:
- Admin: `admin@examplatform.local`
- Examiner: `examiner@examplatform.local`
- Candidate: `candidate@examplatform.local`

---

### Frontend SPA (`frontend/`)
#### [NEW] `frontend/src/types/auth.ts`
TypeScript interfaces for `User`, `UserRole` (`'candidate' | 'examiner' | 'administrator'`), `AuthResponse`, and login/register payloads.

#### [NEW] `frontend/src/context/AuthContext.tsx`
React Context managing session state (`user`, `token`, `isAuthenticated`, `isLoading`), local token persistence, login, registration, and logout operations.

#### [NEW] `frontend/src/components/auth/ProtectedRoute.tsx`
Route guard redirecting unauthenticated users to `/login`, and checking authorized roles redirecting unauthorized roles to their respective dashboards.

#### [NEW] `frontend/src/pages/auth/LoginPage.tsx` (DS-001)
Login view adhering to `docs/design/DESIGN.md` tokens (Plus Jakarta Sans, fresh mint accent (D-035), calm low-stress layout, dark/light themes).

#### [NEW] `frontend/src/pages/auth/RegisterPage.tsx` (DS-002)
Candidate registration view adhering to design system tokens with real-time validation and accessible controls.

---

### Contracts & Ledgers (`docs/`)
#### [NEW] Contract C-001 in `docs/agents/CONTRACTS.md`
Registers REST contract for `/api/register`, `/api/login`, `/api/logout`, and `/api/user`.

---

## Verification Plan

### Automated Tests
- **Backend (Pest PHP):**
  ```bash
  cd backend && ./vendor/bin/pest tests/Feature/AuthTest.php
  ```
  - Registration succeeds for candidates and creates hashed password.
  - Registration rejects duplicate emails and invalid passwords.
  - Login succeeds with valid credentials and returns Sanctum token.
  - Inactive examiner accounts receive `403 Forbidden` upon login.
  - Logout revokes Sanctum tokens.
  - Role-protected routes return `403` for mismatched roles and `200` for allowed roles.
- **Frontend (Vitest):**
  ```bash
  cd frontend && npm run test src/components/auth/
  ```
  - `AuthContext` provides authenticated user state.
  - `ProtectedRoute` redirects unauthenticated users to `/login`.
  - `ProtectedRoute` denies access when role doesn't match.
- **Ledger Verification:**
  ```bash
  python3 docs/agents/tools/ledger-lint.py
  ```
