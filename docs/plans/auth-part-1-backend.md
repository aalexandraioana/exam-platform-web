# Plan — Part 1: Backend Foundation & Authentication REST API

## Size
**M** — Scaffolds local PostgreSQL 16 (`docker-compose.yml`), backend Laravel 11 application (`backend/`), User model with roles, Sanctum API authentication, and Pest test suite.

## Approach
Implement the headless REST API authentication layer in `backend/` following [D-002](file:///home/alexa/Work/exam-platform-web/docs/agents/DECISIONS.md#D-002) and [D-009](file:///home/alexa/Work/exam-platform-web/docs/agents/DECISIONS.md#D-009). The User schema defines three roles (`candidate`, `examiner`, `administrator`) and an `is_active` flag. Candidate self-registers directly via `POST /api/register`; Examiner and Administrator accounts are seeded or provisioned with admin approval. Sanctum issues plain text bearer tokens on login and verifies authenticated requests with `auth:sanctum` and a dedicated `role:` middleware. All endpoints are verified with automated Pest tests before any frontend work begins.

## Files
| Action | Path | What |
|---|---|---|
| create | `docker-compose.yml` | PostgreSQL 16 container definition with persistent volume |
| create | `backend/database/migrations/0001_01_01_000000_create_users_table.php` | Schema with `role` enum (`candidate`, `examiner`, `administrator`) and `is_active` |
| create | `backend/app/Models/User.php` | User model with Sanctum `HasApiTokens` and role checks (`isCandidate()`, `isExaminer()`, `isAdministrator()`) |
| create | `backend/app/Http/Controllers/AuthController.php` | API endpoints: `register`, `login`, `logout`, `user` |
| create | `backend/app/Http/Requests/RegisterRequest.php` | Request validation for Candidate registration |
| create | `backend/app/Http/Requests/LoginRequest.php` | Request validation for credentials |
| create | `backend/app/Http/Middleware/EnsureUserHasRole.php` | Middleware restricting routes by role |
| create | `backend/routes/api.php` | Route definitions with middleware protection |
| create | `backend/database/seeders/UserSeeder.php` | Seed users for all 3 roles (admin, examiner, candidate) |
| create | `backend/tests/Feature/AuthTest.php` | Pest integration tests covering registration, login, logout, and RBAC |
| modify | `docs/agents/CONTRACTS.md` | Register provided contract C-001 for Auth API endpoints |

## Tests
| # | Behaviour | Test (file · kind) | Not automated? why |
|---|---|---|---|
| 1 | Candidate registration creates user with `candidate` role and returns token | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 2 | Registration fails when email already exists or password is short | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 3 | Login with valid credentials returns user profile & Sanctum token | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 4 | Inactive examiner account (`is_active = false`) is rejected with 403 | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 5 | Logout revokes token and invalidates subsequent requests | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 6 | Authenticated `GET /api/user` returns current user and role | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 7 | Role middleware returns 403 when candidate accesses examiner/admin endpoint | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |
| 8 | Role middleware allows authorized role to access protected endpoint | `backend/tests/Feature/AuthTest.php` · Pest integration | Automated |

## Design (UI only)
*None* — Part 1 is strictly backend API and persistence. Frontend screens (DS-001 and DS-002) are decoupled into Part 2 & Part 3.

## Sequencing
one builder (sequential: Docker PostgreSQL → Laravel scaffold → Migration & Model → AuthController & Middleware → Seeders → Pest Tests → CONTRACTS.md update).

## Risks
- Environment missing local PHP/Composer in runner: Docker-based execution or CLI runner availability.
  *Fallback:* Run Laravel commands and migrations inside a container or PHP CLI container if local host lacks PHP binary.

## Out of scope
- Frontend SPA client, AuthContext, and UI screens (deferred to Part 2 and Part 3).
- Password reset emails and SMTP mailers.

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-001 | Plan-then-build workflow | Mandates planning and test-first execution | confirm |
| D-002 | Laravel 11 REST API backend with React + Vite SPA | Governs backend framework and REST API architecture | confirm |
| D-003 | PostgreSQL 16 with local Docker Compose orchestration | Defines database engine and local containerization | confirm |
| D-008 | Pest PHP, Vitest, and Playwright as automated testing stack | Establishes Pest PHP as the backend test runner | confirm |
| D-009 | Two-folder monorepo layout (backend/ and frontend/) | Places backend code cleanly in `backend/` | confirm |
| C-001 | (New proposed) Auth REST endpoints (`/api/register`, `/api/login`, etc.) | Registers the API contract for consumer frontend | confirm |

### Considered, not applied
- D-007 (Visual design tokens) — Part 1 has no UI.
- D-004, D-005, D-006, D-010, D-011, D-012, D-013 — Exam-specific domain rules, deferred to subsequent features.

### Assumptions (no entry behind them)
- Candidates default to `is_active = true` upon registration. Seeded examiners and administrators are pre-activated.
