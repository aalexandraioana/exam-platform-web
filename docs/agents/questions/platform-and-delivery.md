# Open questions · Platform and delivery

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-001 · What web framework and technology stack should be used?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** Laravel 11 for the backend REST API, React + Vite for the frontend SPA, and PostgreSQL for the relational database.

## Q-002 · What testing framework and test runner should be configured?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** Pest PHP for backend tests, Vitest for frontend unit/integration tests, and Playwright for E2E user flows.

## Q-003 · What screenshot mechanism should be used for visual regression testing?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** Playwright screenshot automation (`npx playwright test`) executing automated visual regression checks against `docs/design/screens/`.

## Q-025 · What happens to the uncommitted backend/ scaffold, and where does Laravel run locally?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Generate a fresh official Laravel skeleton into `backend/`, keeping `docker-compose.yml`, `backend/.env.example` and the `/api/health` route; the 7 migrations from the outdated schema plan move to `docs/plans/legacy-migrations/` for P1 to consult (nothing deleted). Laravel runs in Docker: one `backend/Dockerfile` serves both an `api` service in docker-compose and Render.

## Q-033 · In which format is the API documented?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P2 onward (each backend part adds a C- contract with a link to the docs)
- **Context:** The catalog accepts OpenAPI/Swagger or an API.md with request/response examples.
- **Answer:** A hand-written `docs/API.md` with a request and response example for each endpoint; C- entries link to its sections. No OpenAPI generator (no new dependency) (D-051). (Answered 2026-11-23.)

## Q-034 · Which pages, if any, may search engines index?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P2 (first public screens)
- **Context:** Raised by the P0 SEO review. Everything is `noindex, nofollow` for now (frontend/index.html). Pages behind login (exams, attempts, grading, results) should stay out of indexes; open is whether any public page (e.g. login or a landing page) should be indexable.
- **Answer:** None. Every page stays `noindex, nofollow`, login and registration included: the platform is a pilot tool with no public landing page (D-052). (Answered 2026-11-23.)

## Q-039 · Does the 30 Nov pilot include Subject 2?
- **Status:** answered
- **Date:** 2026-11-23
- **Blocks:** P4c (seeded questions), P8 (grading on 1 Dec), P12 (pilot)
- **Context:** Subject 1 alone, auto-graded, already gives the pilot the weak-item data Item Analysis needs. Subject 2 adds photo uploads and Examiner grading with a barem to the pilot.
- **Answer:** Yes. The pilot Exam has 6 Subject 1 Items and 3 Subject 2 problems of 20 points (D-062), each with a barem, graded by the Examiner on 1 Dec. (Answered 2026-11-23; 3 problems instead of 2 since 2026-11-26.)

## Q-073 · Does the delivered app move from Render to AWS?
- **Status:** open
- **Date:** 2026-11-26
- **Blocks:** P12 (delivery: the live URL on 3 Dec)
- **Context:** The user's professor requires AWS for the delivered app (live on AWS for the 3 Dec delivery; the 30 Nov pilot may stay on Render). The user chose their own new AWS account and "an AWS server with Cloudflare R2". Drafted, not yet approved: a PROPOSAL superseding D-014 (a new decision, not numbered yet): one EC2 server (Frankfurt) with Docker Compose (the production API image, PostgreSQL 16 with a nightly backup to R2, Caddy serving the SPA and HTTPS), deploys from GitHub Actions, data moved from Render on 1 Dec. Two choices open: HTTPS through CloudFront, a bought domain or a free IP-name domain; the sealing cron on the server (updating D-044) or cron-job.org. Parked by the user on 2026-11-26 to finish the build first.
