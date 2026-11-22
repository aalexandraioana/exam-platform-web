# Plan — P0 · Foundations & pipeline

**Status:** approved 2026-11-22 · branch `feat/p0-foundations` (from `main`)

## Size
**M** — Laravel skeleton in Docker, frontend scaffold, CI and Render blueprint. No domain
logic, but many config files and three environments (local, CI, Render).

## Approach
- **Backend skeleton:** generate the official Laravel 13 skeleton (D-036) into `backend/`
  with the Composer Docker image (no PHP on the host). Keep `backend/.env.example` values,
  the `/api/health` route and the JSON `routes/web.php`. `php artisan install:api` enables
  API routing and adds Sanctum (already required in `composer.json`).
- **Old migrations:** the 7 migrations from the outdated schema plan move to
  `docs/plans/legacy-migrations/` for P1 (Q-025). Nothing is deleted.
- **One Dockerfile:** `backend/Dockerfile` (`php:8.4-apache`, `pdo_pgsql`) with a `dev`
  target (dev dependencies, code mounted) for a new `api` service in `docker-compose.yml`,
  and a `prod` target (`--no-dev`) for Render (D-014). The container runs
  `migrate --force` on start (Render's free plan has no pre-deploy step).
- **Tests on Postgres:** Pest runs against a separate `exam_platform_test` database in the
  same Postgres container, never SQLite.
- **Frontend:** Vite React-TS template, React 19, Vitest + Testing Library. Tailwind 3.4,
  because DESIGN.md names `frontend/tailwind.config.js` as the token source (v4's CSS-first
  config would contradict it). Tokens become CSS variables in `src/index.css`, copied from
  `docs/design/mocks/shared/mock.css`, light and dark on `[data-theme]`.
- **Language setup (D-022, D-038):** `react-i18next`, Romanian by default. A hand-rolled
  `t()` was rejected: Romanian has three plural forms (one/few/other), which i18next handles.
- **Placeholder page:** shows the app name and whether the API answers; replaced in P2.
- **CI (D-037):** GitHub Actions runs Pest (Postgres service), Vitest, lint and build, and
  ledger-lint.
- **Render:** a `render.yaml` blueprint keeps the three services reviewable in the repo;
  dashboard-only setup was rejected because it can't be reviewed.

## Files
| Action | Path | What |
|---|---|---|
| move | `backend/database/migrations/{7 files}` → `docs/plans/legacy-migrations/` | Parked for P1 |
| create | `backend/` (official Laravel 13 skeleton) | `artisan`, `app/`, `config/`, `public/`, `tests/`, `phpunit.xml`, `.gitignore` |
| keep/merge | `backend/.env.example`, `routes/api.php`, `routes/web.php`, `bootstrap/app.php` | Keep values; remove `statefulApi()` for now (Q-026, decided in P2) |
| create | `backend/Dockerfile` | `dev` and `prod` targets, `php:8.4-apache`, document root `public/` |
| create | `backend/docker/entrypoint.sh` | `migrate --force`, then Apache |
| modify | `docker-compose.yml` | `api` service (target `dev`, code mounted, port 8000, waits for healthy `postgres`, `DB_HOST=postgres`) |
| create | `docker/postgres/init-test-db.sql` | Creates `exam_platform_test` |
| modify | `backend/phpunit.xml` | Tests use `pgsql` / `exam_platform_test` |
| create | `backend/tests/Feature/HealthTest.php` | Tests 1–2 |
| create | `frontend/` (Vite React-TS template) | React 19, TypeScript, ESLint |
| create | `frontend/tailwind.config.js`, `postcss.config.js`, `src/index.css` | Tokens as CSS variables, light and dark, fonts as in the mocks |
| create | `frontend/src/i18n/{index.ts,ro.json,en.json}` | i18next setup, Romanian default |
| create | `frontend/src/api/client.ts` | `getHealth()` against `VITE_API_BASE_URL`; P2 extends it |
| create | `frontend/src/App.tsx`, `App.test.tsx`, `src/i18n/i18n.test.ts`, `vitest.config.ts`, `src/test/setup.ts` | Placeholder and tests 3–5 |
| create | `frontend/.env.example`, `frontend/.nvmrc` | `VITE_API_BASE_URL`; Node 26 |
| create | `.github/workflows/ci.yml` | Jobs `backend`, `frontend`, `ledger` |
| create | `render.yaml` | Postgres 16, `api` web service (Docker `prod` target, health check `/up`), static site with `/* → /index.html` rewrite; secrets (`APP_KEY`) set in the dashboard (`sync: false`) |
| modify | `README.md`, `AGENTS.md` §2, `docs/agents/ARCHITECTURE.md` | Commands now run through Docker (`docker compose exec api ./vendor/bin/pest`) |

## Tests
| # | Behaviour | Test (file · kind) | Not automated? why |
|---|---|---|---|
| 1 | `GET /api/health` returns 200 `{status: healthy}` | `backend/tests/Feature/HealthTest.php` · Pest | — |
| 2 | Tests run on PostgreSQL, not SQLite | same · Pest (driver is `pgsql`) | — |
| 3 | Placeholder shows "connected" when the API answers, an error state when not | `frontend/src/App.test.tsx` · Vitest (mocked fetch) | — |
| 4 | Switching RO ↔ EN changes the rendered text | `frontend/src/i18n/i18n.test.ts` · Vitest | — |
| 5 | Romanian plural forms (1 / 2–19 / 20+) are right | same · Vitest | — |
| 6 | CI green on push | GitHub Actions run | Needs the user's go to push |
| 7 | Live: API `/up` 200 over HTTPS, static site loads | — | Manual after Render deploy (user's go and Render account) |

## Design
No DS screen touched. The placeholder isn't in the registry, isn't shown to real users and is
replaced in P2: no mock or screenshots. Tokens only.

## Sequencing
One builder: park migrations → backend skeleton + Docker → Pest green in the container →
frontend scaffold + tests → CI → `render.yaml` → docs.

## Risks
- Render free tier: Postgres expires after about 30 days; free web services sleep when idle
  (cold starts). Affects the pilot, the defense and P6's scheduled job. Confirm limits at setup.
- HEIC/Imagick moved to P6 (check the image first there).
- Nothing hard to reverse.

## Out of scope
Users, roles, auth (P2); schema (P1); Playwright (P2, first DS screen); Sanctum stateful vs
token (Q-026); HEIC (P6).

## Knowledge used
Confirmed: D-001, D-003, D-008, D-022, D-035, D-036, D-037, D-038, PATTERN-001, Q-025.
D-009 and D-014 were reworded to Laravel 13 after D-036 and await re-confirmation.
Open: Q-026 (P0 leaves `statefulApi()` out).
Considered, not applied: domain decisions D-004–D-006, D-011–D-013, D-015–D-033; PATTERN-002.
`docs/plans/auth-parts-2-and-3.md` Part 2 §1 (frontend scaffold) moved into this plan.
