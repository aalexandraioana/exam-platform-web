# Decisions · Platform and delivery

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-001 · Agentic plan-then-build workflow
- **Status:** approved
- **Date:** 2026-11-12
- **Confirmed:** 2026-11-23
- **Rule:** Any non-trivial modification, architectural change, or feature implementation must start with an approved plan via `/plan` before building via `/build`.
- **Why:** Inferred — ensures changes are validated against requirements, tests are authored first, and architectural drift is minimized.
- **Rejected:** Ad-hoc unapproved code modifications without prior planning.
- **Evidence:** AGENTS.md:23
- **Source:** user · confidence high

## D-002 · Laravel 11 REST API backend with React + Vite SPA
- **Status:** superseded-by D-036
- **Date:** 2026-11-18
- **Rule:** The platform is built as a headless Laravel 11 REST API backend paired with a standalone React + Vite SPA frontend.
- **Why:** Delivers clean separation of concerns, native queuing/scheduling for automated submission sealing, and strictly complies with the catalog requirement for a documented REST API.
- **Rejected:** Monolithic Inertia.js without a standalone API; alternative language runtimes.
- **Evidence:** README.md:40
- **Source:** user · confidence high

## D-003 · PostgreSQL 16 with local Docker Compose orchestration
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-23
- **Rule:** Relational persistence is provided by PostgreSQL 16 managed locally via Docker Compose (`docker compose up`), with schema changes governed by versioned Eloquent migrations.
- **Why:** Meets the catalog constraint for a relational database with containerized local setup and relational integrity across at least 6 core entities.
- **Rejected:** SQLite in production (forbidden by catalog); MySQL (user selected PostgreSQL).
- **Evidence:** README.md:44
- **Source:** user · confidence high

## D-008 · Pest PHP, Vitest, and Playwright as automated testing stack
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-26
- **Rule:** Backend tests are written with Pest PHP (`./vendor/bin/pest`); frontend unit and integration tests use Vitest (`npm run test`); E2E user flows and automated visual regression screenshots are run with Playwright (`npx playwright test`), saving outputs to `docs/design/screens/<DS-id>.<light|dark>.png`.
- **Why:** Pest PHP is the modern Laravel testing choice; Vitest integrates natively with Vite; Playwright covers E2E and screenshot verification, satisfying the catalog requirement of ≥10 tests and Definition of Done visual checks.
- **Rejected:** PHPUnit standalone (Pest wraps it and is more expressive); Jest (Vitest is Vite-native); Cypress (Playwright is preferred for multi-browser and screenshot automation).
- **Evidence:** AGENTS.md:sections 2 & 6, docs/agents/OPEN-QUESTIONS.md Q-002, Q-003
- **Source:** user · confidence high

## D-009 · Two-folder monorepo layout (backend/ and frontend/)
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-23
- **Rule:** The repository uses a two-folder monorepo structure: `backend/` for the Laravel 13 REST API and `frontend/` for the React + Vite SPA, with a shared root `docker-compose.yml` for PostgreSQL and local services.
- **Why:** Provides clean separation of concerns between the API and the SPA, satisfies the catalog's decoupled REST API contract requirement, and ensures consistent agent navigation and CI path references.
- **Rejected:** Single-folder layout with Laravel serving frontend views; Inertia.js monolith; nested frontend inside Laravel's public directory.
- **Evidence:** AGENTS.md:sections 2 & 3, README.md:section 3
- **Source:** user · confidence high

## D-014 · Production deployment on Render cloud platform
- **Status:** approved
- **Date:** 2026-11-19
- **Confirmed:** 2026-11-26
- **Rule:** The application is deployed to Render with a managed PostgreSQL 16 database, a containerized Laravel 13 REST API web service, and a static web service for the React 19 + Vite SPA.
- **Why:** Delivers a reliable, production-ready HTTPS environment satisfying the course catalog requirement for public deployment and live pilot testing.
- **Rejected:** Self-hosted unmanaged VPS; Fly.io (Render was chosen by the user for managed PostgreSQL and web services).
- **Evidence:** User confirmation in plan gate 2026-11-19
- **Source:** user · confidence high

## D-036 · Laravel 13 REST API backend with React 19 + Vite SPA
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-23
- **Rule:** The platform is built as a headless Laravel 13 (PHP 8.4) REST API backend paired with a standalone React 19 + Vite SPA frontend. Pest stays the backend test runner (D-008).
- **Why:** Laravel 11 (D-002) is past its security-support window (March 2026); Laravel 13 is the current major. No backend code existed yet, so the switch cost nothing. The architecture reasons of D-002 still hold: clean API/SPA separation, native queues and scheduling for sealing expired Attempts, and the catalog's documented REST API.
- **Rejected:** Staying on Laravel 11 (out of support); Laravel 12 (shorter remaining support than 13); monolithic Inertia.js without a standalone API.
- **Evidence:** Packagist laravel/framework 13.43.0 (2026-11-17, requires PHP ^8.3); conversation 2026-11-22 (P0 plan gate)
- **Source:** user · confidence high

## D-037 · GitHub Actions CI on every push
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-23
- **Rule:** A GitHub Actions workflow runs on every push: backend Pest tests against PostgreSQL, frontend Vitest, lint and build, and `python3 docs/agents/tools/ledger-lint.py`. A red run blocks merging.
- **Why:** The catalog requires CI on GitHub Actions running the tests and the ledger lint on each push; the repo is already on GitHub.
- **Rejected:** No CI (fails the catalog); other CI services (the catalog names GitHub Actions).
- **Evidence:** catalog-de-proiecte-web.md:58; conversation 2026-11-22 (P0 plan gate, A1)
- **Source:** user · confidence high

## D-051 · The API is documented in a hand-written docs/API.md
- **Status:** approved
- **Date:** 2026-11-23
- **Confirmed:** 2026-11-26
- **Rule:** Every API endpoint has a section in `docs/API.md` with its method, path, auth and role, a request example, and response examples for success and for each error status. Each backend part updates it in the same change; C- entries link to the section.
- **Why:** The catalog accepts an API.md with examples; it needs no new dependency.
- **Rejected:** An OpenAPI spec with a generator such as Scribe (a new dependency).
- **Evidence:** docs/agents/questions/platform-and-delivery.md:Q-033
- **Source:** user · confidence high

## D-052 · No page may be indexed by search engines
- **Status:** approved
- **Date:** 2026-11-23
- **Confirmed:** 2026-11-23
- **Rule:** Every page, login and registration included, carries `noindex, nofollow`.
- **Why:** The platform is a pilot tool with no public landing page; pages behind login must stay out of indexes.
- **Rejected:** Letting the login and registration pages be indexed.
- **Evidence:** docs/agents/questions/platform-and-delivery.md:Q-034; frontend/index.html
- **Source:** user · confidence high

## D-063 · Develop locally in Docker; Render only for grouped releases and the pilot, deployed by hand
- **Status:** approved
- **Date:** 2026-11-27
- **Confirmed:** 2026-11-27
- **Rule:** Parts are built and tried locally (`docker compose up -d` for PostgreSQL and the API, `npm run dev` for the SPA) on their branches, each with its PR and CI. Finished parts wait on their branches and reach main together in one grouped merge (a release); nothing is merged to main during the pilot or a live exam window. Deploys are manual for now: both Render services set `autoDeployTrigger: off`, and after a grouped merge, once CI is green on main, the user deploys from the Render dashboard, the API first (it runs the migrations), then the site, so the site never calls endpoints the API doesn't have yet.
- **Why:** 31 deploys in 5 days (one per merge per touched service); a push with red CI still deployed (8be5d21, 3 deploys); an API deploy restarts the server, which would hit Candidates mid-exam in the pilot (user, 2026-11-27). Manual deploys (user, 2026-11-27, after the P8a + P8b release): with `checksPass` the site deployed by itself and the API didn't, leaving them out of step for about 11 minutes.
- **Rejected:** One merge per part (too many deploys); auto-deploy on every commit (deploys red builds); auto-deploy after CI checks pass (`checksPass`, the first version of this decision: the two services deployed out of step); explicit `buildFilter` paths (rootDir already filters; Render docs).
- **Evidence:** render.yaml; https://render.com/docs/blueprint-spec (`autoDeployTrigger`, `rootDir`); https://render.com/docs/deploys (checks); conversation 2026-11-27
- **Source:** user · confidence high
