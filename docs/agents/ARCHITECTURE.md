# Architecture — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
exam-platform-web is an online mathematics assessment platform administering examinations across grade levels (with 6th-grade mathematics as the reference pool and pilot dataset), featuring question pools, parameterized numerical questions, authoritative server timers, autosave resilience, manual grading workflows, and item psychometric analytics.

```text
[Browser / Candidate & Examiner UI]
           │
           ▼
[React 19 + Vite SPA (frontend/)]
           │ (HTTP / JSON REST API + Sanctum Auth)
           ▼
[Laravel 13 REST API Application (backend/)]
           │ (Sandboxed Math Parser / Scheduler)
           ▼
[PostgreSQL 16 Relational Database (Docker Compose)]
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Frontend SPA | `frontend/` | React + Vite Single Page Application for Candidates, Examiners, and Administrators; renders exam room, question drawer, timer, and dashboards | Backend REST API |
| Backend REST API | `backend/` | Laravel 13 headless API; handles authentication (Sanctum), business logic, validation, state machine transitions, sandboxed math parsing, and background jobs | Frontend SPA, PostgreSQL, Local Storage |
| Relational Database | `docker-compose.yml` (PostgreSQL 16) | Persists users, classes, competences, the question bank and pools, exams and their blueprints, attempts with their drawn questions and snapshots, answers, photos metadata and grading, with versioned Eloquent migrations | Backend REST API |

## Data flow
1. **Authentication:** A Candidate self-registers (optionally with a class code, D-053) or logs in; Examiners and Administrators are created with `php artisan app:create-user` (D-020). Laravel Sanctum issues a bearer token that the SPA keeps in localStorage (D-050); routes check `auth:sanctum`, `active` and `role:<role>`. Endpoints: [docs/API.md](../API.md) (C-001).
2. **Attempt Initialization:** Candidate launches an exam attempt. The backend validates availability, instantiates a state machine (`started` → `in_progress`), snapshots concrete evaluated parameters for that attempt, and initializes the authoritative server timer.
3. **Interactive Taking & Autosave:** As the candidate answers Subject 1 and Subject 2 items, the React client fires idempotent autosave requests with versioning to persist progress and survive connection drops or page refreshes.
4. **Subject 2 Solution Submission:** For complex mathematical problems and proofs in Subject 2, the candidate submits step-by-step reasoning and optionally uploads photos/images of their handwritten work.
5. **Authoritative Submission & Auto-sealing:** The candidate explicitly submits, or a scheduled Laravel background task (`php artisan schedule:run`) automatically seals and submits expired attempts once `duration + 30s grace` has elapsed.
6. **Grading & Feedback Delivery:** Subject 1 items are evaluated automatically (binary 0 or full points). Subject 2 items enter the Examiner's manual grading queue for partial credit assignment. Once all submissions are scored, the Examiner publishes a global cohort review note and individual candidate feedback all at once.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| User credentials & roles | PostgreSQL (`users` table) | Backend | `first_name` and `last_name` (the API also returns `name`, "Prenume Nume"; P2b); hashed passwords; `role` (candidate, examiner, administrator; CHECK constraint, not mass-assignable) and `is_active` |
| Competences | PostgreSQL (`competences`) | Backend | Each Examiner's own list: code unique per Examiner, description (D-039) |
| Classes & memberships | PostgreSQL (`classes`, `class_memberships`) | Backend | Unique join code per class; membership status pending / accepted / rejected, one row per Candidate and class (D-015, D-028) |
| Question bank | PostgreSQL (`questions`, `pools`, `pool_question`, `topics`, `barem_steps`) | Backend | Each Examiner's bank, pools and topics (one topic per question, D-058); Draft/Ready and other rules as CHECK constraints (D-031, D-040, D-041, D-059), the rest of D-059 in `Support/Questions/Readiness`; API C-004; library entries are frozen copies (`published_to_library_at`, `copied_from_id`); JSON answer key and parameters |
| Exams & blueprints | PostgreSQL (`exams`, `class_exam`, `exam_items`) | Backend | A draft (unpublished) until published; attempt limit and score policy (D-012), availability window (D-021), publication to classes (D-015), results release and cohort note (D-019); Items fix section, points, pool, competence and difficulty, plus a type and a topic (null = any) (D-057); `Support/Exams/Blueprint` lists each Item's eligible questions and gives every Item its own question by bipartite matching, shuffled by a seed (publish check, preview, and P6's draw); `Support/Exams/PublishChecks`; API C-005. Baseline 10 points are a constant (D-005) |
| Attempts & drawn questions | PostgreSQL (`attempts`, `attempt_items`) | Backend | State (`started`, `in_progress`, `submitted`, `graded`; transitions in P6), deadline fixed at start (D-021), seed, auto-submitted flag, scores within D-005's limits; per Item the drawn question (never repeated in an Attempt), drawn values, expected answer and a snapshot with the shuffled options (D-006, D-057, D-045), written by `Support/Attempts/Starter`, whose `snapshot(exam, seed)` rebuilds them exactly; API C-006. Grace Period from config (D-004) |
| Candidate answers & uploads | PostgreSQL (`answers`, `answer_images`, `answer_barem_scores`) & photo files: S3-compatible object storage in production, local disk in development (D-048) | Backend | Answer JSON with an autosave `version`, marked-for-review flag; up to 3 photos per Subject II answer (D-026); grading: awarded points, adjustment, private comment, re-check flag, barem step scores (D-019, D-031) |
| Feedback & psychometrics | PostgreSQL (`exams.cohort_note`, `exams.results_published_at`, `answers.comment`; Item Analysis computed or cached in P10) | Backend | Cohort note and its publication time on the exam, private per-problem comments on each response (D-019), difficulty/discrimination metrics |
| Client UI state | React State & LocalStorage cache | Frontend SPA | Active question index, local autosave retry queues, theme preference |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | `frontend/.env` | Frontend SPA | Target Laravel API base endpoint |
| `APP_KEY`, `APP_ENV` | `backend/.env` (local, generated on first run); Render dashboard (production) | Backend API | Laravel application encryption key and environment; never committed |
| `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE` | `backend/.env`, `docker-compose.yml` | Backend API & DB | PostgreSQL connection settings; tests use `exam_platform_test` (`backend/phpunit.xml`) |
| `DB_URL` | Render (from the managed database) | Backend API | Production connection string (`render.yaml`) |
| `PORT` | Render | Backend API | Port Apache listens on in production (`backend/docker/entrypoint.sh`) |
| `FRONTEND_URL` | `backend/.env` (default `http://localhost:5173`); `render.yaml` (production) | Backend API | The only origin CORS allows (`config/cors.php`); no cookie sessions (D-050) |

## Build, deploy, runtime
- **Local Dev:** `docker compose up -d` starts PostgreSQL 16 (with a second database, `exam_platform_test`, from `docker/postgres/init-test-db.sql`) and the `api` service (`backend/Dockerfile`, `dev` stage, code mounted, `php artisan serve --no-reload` on port 8000, so the container's `DB_HOST` wins over `.env`). Its entrypoint installs Composer packages, creates `backend/.env` with a fresh key and migrates on first run. Frontend runs on the host via `npm install && npm run dev`.
- **Testing:** `docker compose exec api ./vendor/bin/pest` (backend, against PostgreSQL), `npm run test` (frontend Vitest), `npx playwright test` (E2E & visual screenshots, from P2). CI: `.github/workflows/ci.yml` runs Pest, the frontend lint/test/build and ledger-lint on every push (D-037).
- **Production Runtime:** Render (D-014), described in `render.yaml`: managed PostgreSQL 16, the Laravel 13 API from the Dockerfile's `prod` stage (Apache, production dependencies, migrations on start), and a static site for the React 19 + Vite SPA (`/* → /index.html`).

## Boundaries
- **Client / Server Boundary:** The React SPA is untrusted; all total scores, timers, and formula validations are calculated strictly on the Laravel backend. Requests received after `duration + 30s grace` are rejected.
- **Formula Evaluation Sandbox:** Formulas of named values (D-057) are checked against a whitelist (whole numbers, the question's names, + − · : and parentheses; Q-052) in `backend/app/Support/Math/Expression.php` before they reach `nxp/math-executor`, which parses them without `eval()` (D-013). `ValueDefinitions` checks a question's values (problem codes), `ValueDrawer` draws them from a seed with `Random\Randomizer` (Mt19937) so a draw is reproducible (D-006), and `AnswerMatcher` applies D-017.
