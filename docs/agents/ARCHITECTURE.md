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
| Relational Database | `docker-compose.yml` (PostgreSQL 16) | Persists users, exams, questions, attempts, concrete variant snapshots, responses, and feedback with versioned Eloquent migrations | Backend REST API |

## Data flow
1. **Authentication & Session:** Candidate self-registers or logs in; Examiner logs into an admin-approved account. Laravel Sanctum issues auth tokens / stateful cookies.
2. **Attempt Initialization:** Candidate launches an exam attempt. The backend validates availability, instantiates a state machine (`started` → `in_progress`), snapshots concrete evaluated parameters for that attempt, and initializes the authoritative server timer.
3. **Interactive Taking & Autosave:** As the candidate answers Subject 1 and Subject 2 items, the React client fires idempotent autosave requests with versioning to persist progress and survive connection drops or page refreshes.
4. **Subject 2 Solution Submission:** For complex mathematical problems and proofs in Subject 2, the candidate submits step-by-step reasoning and optionally uploads photos/images of their handwritten work.
5. **Authoritative Submission & Auto-sealing:** The candidate explicitly submits, or a scheduled Laravel background task (`php artisan schedule:run`) automatically seals and submits expired attempts once `duration + 30s grace` has elapsed.
6. **Grading & Feedback Delivery:** Subject 1 items are evaluated automatically (binary 0 or full points). Subject 2 items enter the Examiner's manual grading queue for partial credit assignment. Once all submissions are scored, the Examiner publishes a global cohort review note and individual candidate feedback all at once.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| User credentials & roles | PostgreSQL (`users` table) | Backend | Hashed passwords; `role` (candidate, examiner, administrator; CHECK constraint, not mass-assignable) and `is_active` |
| Competences | PostgreSQL (`competences`) | Backend | Each Examiner's own list: code unique per Examiner, description (D-039) |
| Classes & memberships | PostgreSQL (`classes`, `class_memberships`) | Backend | Unique join code per class; membership status pending / accepted / rejected, one row per Candidate and class (D-015, D-028) |
| Question bank | PostgreSQL (`questions`, `pools`, `pool_question`, `topic_labels`, `question_topic_label`, `barem_steps`) | Backend | Each Examiner's bank, pools and topic labels; Draft/Ready and other rules as CHECK constraints (D-031, D-040, D-041, D-042); library entries are frozen copies (`published_to_library_at`, `copied_from_id`); JSON answer key and parameters |
| Exams & blueprints | PostgreSQL (`exams`, `class_exam`, `exam_items`) | Backend | Draft until published; attempt limit and score policy (D-012), availability window (D-021), publication to classes (D-015), results release and cohort note (D-019); Items fix section, competence, difficulty, points and the pool they draw from (D-043). Baseline 10 points are a constant (D-005) |
| Attempt state & parameters | PostgreSQL (`attempts`, `attempt_parameters`) | Backend | State machine (`started`, `in_progress`, `submitted`, `graded`), timer start, snapshot of concrete numbers |
| Candidate answers & uploads | PostgreSQL (planned in P1d) & photo files: S3-compatible object storage in production, local disk in development (D-048) | Backend | Selected options, numerical inputs, text steps; up to 3 solution photos per Subject II problem (D-026) |
| Feedback & psychometrics | PostgreSQL (`exams.cohort_feedback`, `exams.feedback_published_at`, `responses.examiner_comment`, `item_statistics`) | Backend | Cohort note and its publication time on the exam, private per-problem comments on each response (D-019), difficulty/discrimination metrics |
| Client UI state | React State & LocalStorage cache | Frontend SPA | Active question index, local autosave retry queues, theme preference |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | `frontend/.env` | Frontend SPA | Target Laravel API base endpoint |
| `APP_KEY`, `APP_ENV` | `backend/.env` (local, generated on first run); Render dashboard (production) | Backend API | Laravel application encryption key and environment; never committed |
| `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE` | `backend/.env`, `docker-compose.yml` | Backend API & DB | PostgreSQL connection settings; tests use `exam_platform_test` (`backend/phpunit.xml`) |
| `DB_URL` | Render (from the managed database) | Backend API | Production connection string (`render.yaml`) |
| `PORT` | Render | Backend API | Port Apache listens on in production (`backend/docker/entrypoint.sh`) |
| `SANCTUM_STATEFUL_DOMAINS` | `backend/.env` | Backend API | Allowed stateful client domains for Sanctum auth |

## Build, deploy, runtime
- **Local Dev:** `docker compose up -d` starts PostgreSQL 16 (with a second database, `exam_platform_test`, from `docker/postgres/init-test-db.sql`) and the `api` service (`backend/Dockerfile`, `dev` stage, code mounted, `php artisan serve` on port 8000). Its entrypoint installs Composer packages, creates `backend/.env` with a fresh key and migrates on first run. Frontend runs on the host via `npm install && npm run dev`.
- **Testing:** `docker compose exec api ./vendor/bin/pest` (backend, against PostgreSQL), `npm run test` (frontend Vitest), `npx playwright test` (E2E & visual screenshots, from P2). CI: `.github/workflows/ci.yml` runs Pest, the frontend lint/test/build and ledger-lint on every push (D-037).
- **Production Runtime:** Render (D-014), described in `render.yaml`: managed PostgreSQL 16, the Laravel 13 API from the Dockerfile's `prod` stage (Apache, production dependencies, migrations on start), and a static site for the React 19 + Vite SPA (`/* → /index.html`).

## Boundaries
- **Client / Server Boundary:** The React SPA is untrusted; all total scores, timers, and formula validations are calculated strictly on the Laravel backend. Requests received after `duration + 30s grace` are rejected.
- **Formula Evaluation Sandbox:** Parameterized question formulas are parsed exclusively via a sandboxed PHP mathematical expression library with an operation whitelist, strictly avoiding native `eval()`.
