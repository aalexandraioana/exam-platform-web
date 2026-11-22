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
[Laravel 11 REST API Application (backend/)]
           │ (Sandboxed Math Parser / Scheduler)
           ▼
[PostgreSQL 16 Relational Database (Docker Compose)]
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Frontend SPA | `frontend/` | React + Vite Single Page Application for Candidates, Examiners, and Administrators; renders exam room, question drawer, timer, and dashboards | Backend REST API |
| Backend REST API | `backend/` | Laravel 11 headless API; handles authentication (Sanctum), business logic, validation, state machine transitions, sandboxed math parsing, and background jobs | Frontend SPA, PostgreSQL, Local Storage |
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
| User credentials & roles | PostgreSQL (`users` table) | Backend | Argon2id/bcrypt hashed passwords, RBAC (candidate, examiner, administrator) |
| Exam templates & question pools | PostgreSQL (`exams`, `questions`) | Backend | 60 questions pool with tags, difficulty, formula definitions |
| Attempt state & parameters | PostgreSQL (`attempts`, `attempt_parameters`) | Backend | State machine (`started`, `in_progress`, `submitted`, `graded`), timer start, snapshot of concrete numbers |
| Candidate responses & uploads | PostgreSQL (`responses`) & local disk (`storage/app/public`) | Backend | Selected options, numerical inputs, text steps, uploaded solution images |
| Feedback & psychometrics | PostgreSQL (`exams.cohort_feedback`, `exams.feedback_published_at`, `responses.examiner_comment`, `item_statistics`) | Backend | Cohort note and its publication time on the exam, private per-problem comments on each response (D-019), difficulty/discrimination metrics |
| Client UI state | React State & LocalStorage cache | Frontend SPA | Active question index, local autosave retry queues, theme preference |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | `frontend/.env` | Frontend SPA | Target Laravel API base endpoint |
| `APP_KEY`, `APP_ENV` | `backend/.env` | Backend API | Laravel application encryption key and environment |
| `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE` | `backend/.env`, `docker-compose.yml` | Backend API & DB | PostgreSQL connection settings |
| `SANCTUM_STATEFUL_DOMAINS` | `backend/.env` | Backend API | Allowed stateful client domains for Sanctum auth |

## Build, deploy, runtime
- **Local Dev:** `docker compose up -d` starts PostgreSQL 16. Backend runs via `composer install && php artisan migrate --seed && php artisan serve`. Frontend runs via `npm install && npm run dev`.
- **Testing:** `./vendor/bin/pest` (backend), `npm run test` (frontend Vitest), `npx playwright test` (E2E & visual screenshot regression).
- **Production Runtime:** Render (D-014): managed PostgreSQL 16, a containerized Laravel 11 API web service, and a static web service for the React 19 + Vite SPA.

## Boundaries
- **Client / Server Boundary:** The React SPA is untrusted; all total scores, timers, and formula validations are calculated strictly on the Laravel backend. Requests received after `duration + 30s grace` are rejected.
- **Formula Evaluation Sandbox:** Parameterized question formulas are parsed exclusively via a sandboxed PHP mathematical expression library with an operation whitelist, strictly avoiding native `eval()`.
