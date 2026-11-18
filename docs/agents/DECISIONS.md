# Decisions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · Agentic plan-then-build workflow
- D-002 · Laravel 11 REST API backend with React + Vite SPA
- D-003 · PostgreSQL 16 with local Docker Compose orchestration
- D-004 · Authoritative server timer with 30-second expiration grace period
- D-005 · Two-part assessment scoring architecture with zero negative marking
- D-006 · Exact-match numeric tolerance with concrete parameter persistence
- D-007 · Visual design tokens and calm anxiety-reducing UI system
- D-008 · Pest PHP, Vitest, and Playwright as automated testing stack
- D-009 · Two-folder monorepo layout (backend/ and frontend/)
- D-010 · Two-step examiner feedback publication after full grading
- D-011 · Subject 2 handwritten solution photo upload alongside text
- D-012 · Configurable attempt limits and score aggregation policy
- D-013 · Sandboxed PHP mathematical expression library for formula evaluation

---

## D-001 · Agentic plan-then-build workflow
- **Status:** approved
- **Date:** 2026-11-12
- **Confirmed:** 2026-11-18
- **Rule:** Any non-trivial modification, architectural change, or feature implementation must start with an approved plan via `/plan` before building via `/build`.
- **Why:** Inferred — ensures changes are validated against requirements, tests are authored first, and architectural drift is minimized.
- **Rejected:** Ad-hoc unapproved code modifications without prior planning.
- **Evidence:** AGENTS.md:23
- **Source:** user · confidence high

## D-002 · Laravel 11 REST API backend with React + Vite SPA
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** The platform is built as a headless Laravel 11 REST API backend paired with a standalone React + Vite SPA frontend.
- **Why:** Delivers clean separation of concerns, native queuing/scheduling for automated submission sealing, and strictly complies with the catalog requirement for a documented REST API.
- **Rejected:** Monolithic Inertia.js without a standalone API; alternative language runtimes.
- **Evidence:** README.md:40
- **Source:** user · confidence high

## D-003 · PostgreSQL 16 with local Docker Compose orchestration
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** Relational persistence is provided by PostgreSQL 16 managed locally via Docker Compose (`docker compose up`), with schema changes governed by versioned Eloquent migrations.
- **Why:** Meets the catalog constraint for a relational database with containerized local setup and relational integrity across at least 6 core entities.
- **Rejected:** SQLite in production (forbidden by catalog); MySQL (user selected PostgreSQL).
- **Evidence:** README.md:44
- **Source:** user · confidence high

## D-004 · Authoritative server timer with 30-second expiration grace period
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** Exam duration is strictly enforced on the server, with a 30-second grace period buffer after timer expiration to accept in-flight submissions delayed by network latency before rejecting subsequent answers.
- **Why:** Eliminates client-side timer tampering while maintaining fairness for candidates on school or mobile networks.
- **Rejected:** Client-side only countdown timer; strict 0-second cutoff without latency tolerance.
- **Evidence:** README.md:32
- **Source:** user · confidence high

## D-005 · Two-part assessment scoring architecture with zero negative marking
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** The scoring engine enforces a two-part assessment model: 10 baseline points (din oficiu) + Subject 1 (30 pts, auto-graded, binary 0 or full points, no partial credit) + Subject 2 (60 pts, manual grading queue for the examiner with partial credit support). Negative marking is strictly disallowed across all question types.
- **Why:** Directly models the 6th-grade mathematics examination structure validated during the client interview.
- **Rejected:** Negative marking for incorrect answers; automated grading for Subject 2 proofs/multi-step reasoning.
- **Evidence:** README.md:26
- **Source:** user · confidence high

## D-006 · Exact-match numeric tolerance with concrete parameter persistence
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** Parameterized questions evaluate formulas with exact-match numeric tolerance (tolerance = 0), and each attempt permanently records its concrete generated parameter values.
- **Why:** Matches the precision needed for 6th-grade mathematics problems and guarantees exact auditability and problem reconstruction during grade contests.
- **Rejected:** Loose floating-point percentage tolerance; storing only random seeds without snapshotting evaluated parameters.
- **Evidence:** README.md:35
- **Source:** user · confidence high

## D-007 · Visual design tokens and calm anxiety-reducing UI system
- **Status:** approved
- **Date:** 2026-11-18
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: Muted Teal/Sage primary accent (`#0F766E` / `#2DD4BF`), midnight-tint dark theme (`#0B132B`), Plus Jakarta Sans for UI copy and headings, JetBrains Mono for formulas, equations, and timers, a 4px grid spacing scale, and subtle non-distracting elevation.
- **Why:** Delivers a calm, low-stress assessment environment for 6th-grade candidates, inspired by Coursera, Quizlet, and Notion, while guaranteeing WCAG AAA/AA contrast.
- **Rejected:** Flashy/overwhelming animations and high-saturation gamified colors; harsh pitch-black dark mode; raw uncurated monospace fonts.
- **Evidence:** docs/design/DESIGN.md:103
- **Source:** user · confidence high

## D-008 · Pest PHP, Vitest, and Playwright as automated testing stack
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** Backend tests are written with Pest PHP (`./vendor/bin/pest`); frontend unit and integration tests use Vitest (`npm run test`); E2E user flows and automated visual regression screenshots are run with Playwright (`npx playwright test`), saving outputs to `docs/design/screens/<DS-id>.<light|dark>.png`.
- **Why:** Pest PHP is the modern Laravel testing choice; Vitest integrates natively with Vite; Playwright covers E2E and screenshot verification, satisfying the catalog requirement of ≥10 tests and Definition of Done visual checks.
- **Rejected:** PHPUnit standalone (Pest wraps it and is more expressive); Jest (Vitest is Vite-native); Cypress (Playwright is preferred for multi-browser and screenshot automation).
- **Evidence:** AGENTS.md:sections 2 & 6, docs/agents/OPEN-QUESTIONS.md Q-002, Q-003
- **Source:** user · confidence high

## D-009 · Two-folder monorepo layout (backend/ and frontend/)
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** The repository uses a two-folder monorepo structure: `backend/` for the Laravel 11 REST API and `frontend/` for the React + Vite SPA, with a shared root `docker-compose.yml` for PostgreSQL and local services.
- **Why:** Provides clean separation of concerns between the API and the SPA, satisfies the catalog's decoupled REST API contract requirement, and ensures consistent agent navigation and CI path references.
- **Rejected:** Single-folder layout with Laravel serving frontend views; Inertia.js monolith; nested frontend inside Laravel's public directory.
- **Evidence:** AGENTS.md:sections 2 & 3, README.md:section 3
- **Source:** user · confidence high

## D-010 · Two-step examiner feedback publication after full grading
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** Feedback is published by the Examiner in two channels after full grading is complete: (1) a single global cohort note published all at once, visible to all candidates who took the exam; (2) private per-problem partial points and comments on each Subject 2 submission, released to each candidate only upon explicit publication by the Examiner.
- **Why:** Confirmed by client interview and repository owner; matches Romanian classroom grading practices where general feedback on common errors is shared with the entire cohort, while detailed per-item proof feedback is individual.
- **Rejected:** Real-time feedback before all submissions are graded; publishing partial grades piece-by-piece.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-005, INTERVIEW.md:Q16
- **Source:** user · confidence high

## D-011 · Subject 2 handwritten solution photo upload alongside text
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** Subject 2 solutions allow candidates to submit step-by-step reasoning text alongside uploaded photos/images of their handwritten work (geometric drawings and algebraic proofs), stored securely on server disk and presented in the Examiner's manual grading queue.
- **Why:** 6th-grade geometric proofs and complex calculations require natural handwritten sketches and intermediate steps that are impractical to type solely in text inputs.
- **Rejected:** Plain text-only submissions; mandatory LaTeX code entry for 6th-grade students.
- **Evidence:** README.md:84, docs/agents/ARCHITECTURE.md:24
- **Source:** user · confidence high

## D-012 · Configurable attempt limits and score aggregation policy
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-18
- **Rule:** The platform supports configurable attempt limits per Exam (single or multiple attempts) defined by the Examiner, with score aggregation policy (e.g., highest score or latest score).
- **Why:** Satisfies the catalog requirement for configurable attempts, providing flexibility for both summative graded exams (1 attempt) and formative practice modules.
- **Rejected:** Hardcoded single-attempt restriction across all exams.
- **Evidence:** README.md:37, catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-013 · Sandboxed PHP mathematical expression library for formula evaluation
- **Status:** approved
- **Date:** 2026-11-18
- **Rule:** Parameterized question formulas are evaluated on the backend using a dedicated sandboxed PHP mathematical expression library with an operation whitelist, strictly avoiding native PHP eval().
- **Why:** Meets the catalog security constraint requiring sandboxed formula parsing to prevent arbitrary code execution on dynamically evaluated expressions.
- **Rejected:** Native PHP `eval()`; executing formulas in shell or unverified external processes.
- **Evidence:** README.md:83, catalog-de-proiecte-web.md:905
- **Source:** user · confidence high
