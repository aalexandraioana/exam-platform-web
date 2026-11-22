# Decisions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · Agentic plan-then-build workflow
- D-003 · PostgreSQL 16 with local Docker Compose orchestration
- D-004 · Authoritative server timer with 30-second expiration grace period
- D-005 · Two-part assessment scoring architecture with zero negative marking
- D-006 · Exact-match numeric tolerance with concrete parameter persistence
- D-008 · Pest PHP, Vitest, and Playwright as automated testing stack
- D-009 · Two-folder monorepo layout (backend/ and frontend/)
- D-012 · Configurable attempt limits and score aggregation policy
- D-013 · Sandboxed PHP mathematical expression library for formula evaluation
- D-014 · Production deployment on Render cloud platform
- D-015 · Classes and Exam publication to classes
- D-017 · Answer matching rules for numbers and text
- D-019 · Results and feedback released only on publication
- D-020 · Admin-created Examiner accounts and manual password reset
- D-021 · Full duration per Attempt regardless of end_time
- D-022 · Bilingual Romanian and English UI
- D-026 · Subject 2 photo upload limits
- D-027 · Private question pools with a shared library
- D-028 · Examiner-created classes with join code and approval
- D-029 · Database as question source, BANK.md as validation and pilot log
- D-031 · Optional barem for Subject 2 questions
- D-033 · Lucide as the only icon set
- D-035 · Warm, calm visual system with a fresh mint accent
- D-036 · Laravel 13 REST API backend with React 19 + Vite SPA
- D-037 · GitHub Actions CI on every push
- D-038 · Romanian as the default UI language
- D-039 · Examiner-defined competences and topic labels
- D-040 · Library entries are frozen copies
- D-041 · One bank per Examiner, organised in pools
- D-042 · Draft and Ready question status
- D-043 · Exam blueprint drawing from pools
- D-044 · Expired Attempts sealed on read and by a pinged scheduled job
- D-045 · Answer options shuffled per Attempt
- D-046 · Subject I answer-key corrections recalculate until publication
- D-047 · Weak-item thresholds
- D-048 · Subject II photos in object storage in production

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
- **Confirmed:** 2026-11-22
- **Rule:** The repository uses a two-folder monorepo structure: `backend/` for the Laravel 13 REST API and `frontend/` for the React + Vite SPA, with a shared root `docker-compose.yml` for PostgreSQL and local services.
- **Why:** Provides clean separation of concerns between the API and the SPA, satisfies the catalog's decoupled REST API contract requirement, and ensures consistent agent navigation and CI path references.
- **Rejected:** Single-folder layout with Laravel serving frontend views; Inertia.js monolith; nested frontend inside Laravel's public directory.
- **Evidence:** AGENTS.md:sections 2 & 3, README.md:section 3
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
- **Confirmed:** 2026-11-19
- **Rule:** Parameterized question formulas are evaluated on the backend using a dedicated sandboxed PHP mathematical expression library with an operation whitelist, strictly avoiding native PHP eval().
- **Why:** Meets the catalog security constraint requiring sandboxed formula parsing to prevent arbitrary code execution on dynamically evaluated expressions.
- **Rejected:** Native PHP `eval()`; executing formulas in shell or unverified external processes.
- **Evidence:** README.md:83, catalog-de-proiecte-web.md:905
- **Source:** user · confidence high

## D-014 · Production deployment on Render cloud platform
- **Status:** approved
- **Date:** 2026-11-19
- **Confirmed:** 2026-11-22
- **Rule:** The application is deployed to Render with a managed PostgreSQL 16 database, a containerized Laravel 13 REST API web service, and a static web service for the React 19 + Vite SPA.
- **Why:** Delivers a reliable, production-ready HTTPS environment satisfying the course catalog requirement for public deployment and live pilot testing.
- **Rejected:** Self-hosted unmanaged VPS; Fly.io (Render was chosen by the user for managed PostgreSQL and web services).
- **Evidence:** User confirmation in plan gate 2026-11-19
- **Source:** user · confidence high

## D-015 · Classes and Exam publication to classes
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Candidates belong to classes. An Exam is published to one or more classes, and only Candidates of those classes see it. The cohort for feedback (D-019) is the Candidates of the classes the Exam was published to.
- **Why:** Matches the classroom reality from the interview and the approved DS-003 mock ("Clasa a VI-a B", "pentru clasa ta").
- **Rejected:** Published Exams visible to every Candidate; grade level as the only filter.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-007
- **Source:** user · confidence high

## D-017 · Answer matching rules for numbers and text
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Numeric answers accept both decimal separators ("2,5" and "2.5"); a fraction answer must be in the form the Examiner expects (an equal value in another form is wrong). Text answers are compared after ignoring case, extra whitespace and diacritics, against an Examiner-defined list of accepted answers. D-006 (tolerance 0) still holds.
- **Why:** Romanian notation uses the decimal comma, and 6th-grade ratio work often expects a specific fraction form; short answers such as "se înjumătățesc" are often typed without diacritics.
- **Rejected:** Accepting any equal-valued fraction; strict exact text matching; numeric-only short answers.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-008, Q-010; INTERVIEW.md:Q13
- **Source:** user · confidence high

## D-019 · Results and feedback released only on publication
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** After full grading the Examiner publishes, in two channels: (1) one cohort note, visible to the whole cohort (D-015); (2) private per-problem partial points and comments on each Subject 2 answer. No score, Subject 1 included, is visible to a Candidate before publication; until then the Candidate sees "submitted, awaiting grading".
- **Why:** Keeps D-010's classroom practice and closes the gap about the instantly auto-graded Subject 1 score.
- **Rejected:** Showing the Subject 1 score at Submission; publishing grades piece by piece.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-005, Q-009; INTERVIEW.md:Q16
- **Source:** user · confidence high

## D-020 · Admin-created Examiner accounts and manual password reset
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Only an Administrator creates Examiner accounts; there is no Examiner self-registration and no pending-approval state. There is no email password reset: an Administrator, or the Examiner for Candidates in their class, sets a new password.
- **Why:** Keeps account control with the school and avoids a mail service.
- **Rejected:** Examiner self-registration with approval; email reset links.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-012, Q-013
- **Source:** user · confidence high

## D-021 · Full duration per Attempt regardless of end_time
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Every Attempt gets the Exam's full duration from its own start, plus the Grace Period (D-004). The Exam's `end_time` only stops new Attempts from starting.
- **Why:** The interview asks for the timer to start per device when the Candidate connects, for fairness.
- **Rejected:** Cutting Attempts at `end_time`.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-014; INTERVIEW.md:Q14
- **Source:** user · confidence high

## D-022 · Bilingual Romanian and English UI
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** The UI is available in Romanian and English with a language toggle. CONTEXT.md holds the Romanian and English word for each term (words: Q-017).
- **Why:** Romanian classroom users plus English project documentation and review.
- **Rejected:** Romanian-only or English-only UI.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-015
- **Source:** user · confidence high

## D-026 · Subject 2 photo upload limits
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** A Candidate can upload up to 3 images per Subject 2 problem, 10 MB each, in JPG, PNG or HEIC. HEIC is converted to JPG on the server so the Examiner's browser can display it. D-011 still holds.
- **Why:** Multi-page handwritten solutions from phones (often HEIC on iPhones) must reach the Examiner readable.
- **Rejected:** 5 images per problem; 5 MB JPG/PNG only without HEIC conversion; 1 image per problem.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-018
- **Source:** user · confidence high

## D-027 · Private question pools with a shared library
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Each Examiner's questions are private to them. An Examiner can publish a question to a shared library; other Examiners copy it into their own bank, and the copy is theirs to edit.
- **Why:** Keeps each Examiner in control of their questions while making it easier to fill blueprint Items with Variants.
- **Rejected:** One shared pool where only the author edits; one shared pool anyone edits; fully private pools.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-019
- **Source:** user · confidence high

## D-028 · Examiner-created classes with join code and approval
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Examiners create their classes; each class has a short join code. A Candidate enters the code at registration or later from the dashboard and stays pending until the Examiner accepts them. D-015 still holds.
- **Why:** Self-registered Candidates need a way into a class, and approval blocks strangers who got the code.
- **Rejected:** Join code without approval; Examiner adds Candidates by email; Administrator-managed classes.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-021
- **Source:** user · confidence high

## D-029 · Database as question source, BANK.md as validation and pilot log
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** The database is the source of truth for questions. The initial pool is loaded by an insert-only seeder keyed on a stable, unique question code; it never updates or deletes, so questions added or edited in the UI are safe. BANK.md holds no question text: it is the validation and pilot log (per validated question: code, competence, the 2+ colleagues who validated it, when, what they corrected; plus the results of the pilot with 10+ Candidates).
- **Why:** Avoids two sources of truth while meeting the catalog requirement to record peer validation and pilot results in BANK.md.
- **Rejected:** BANK.md as the re-seeded question source; generating the question list into BANK.md.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-022; catalog-de-proiecte-web.md:882, 916
- **Source:** user · confidence high

## D-031 · Optional barem for Subject 2 questions
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** A Subject 2 question may have a barem; the Examiner chooses per question whether to use one. A barem is an ordered list of steps, each with a short description and points, summing to the question's points (each Variant has its own). With a barem, the Examiner ticks the steps a Candidate earned or gives part of a step's points (never more than the step is worth); the score is the sum plus an optional manual adjustment, kept between 0 and the question's points (D-005), with a private comment (D-019). The ticked steps and points are stored per answer. Without a barem, the Examiner enters one score between 0 and the question's points, plus the comment. A barem can be edited while grading: scores already given on that question are recalculated from their ticked steps (partial points capped at a step's new maximum, with the affected answers flagged for re-check). Once results are published, the barem is locked.
- **Why:** Matches Romanian barem grading practice and makes grading consistent across Candidates, while leaving Examiners free to grade holistically when a barem does not fit.
- **Rejected:** Mandatory barem for every Subject 2 question; locking the barem at the first graded answer; recalculating after publication.
- **Evidence:** Conversation 2026-11-22; docs/design/research-quiz-platforms.md S-8
- **Source:** user · confidence high

## D-033 · Lucide as the only icon set
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** All UI icons come from Lucide (`lucide-react` in the frontend, imported per icon), 2px stroke, at 16, 20 or 24 px. No Unicode symbols or emoji are used as icons. Icon-only controls keep an accessible name (DESIGN.md).
- **Why:** Mixed hand-copied SVGs and Unicode glyphs render differently per device; Lucide matches the existing outline style (Feather), is free (ISC) and tree-shaken.
- **Rejected:** Heroicons (smaller set), Phosphor (multiple weights invite drift), Tabler Icons (more technical look).
- **Evidence:** docs/design/design-review-2026-11-22.md M6; conversation 2026-11-22
- **Source:** user · confidence high

## D-035 · Warm, calm visual system with a fresh mint accent
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: a fresh mint primary accent (`#1F7A4F` light / `#7EE2A8` dark, hover `#17603D` / `#AFF0C9`, tint `#E3F2E8` / `#1C3A28`); warm neutrals in both themes, a cream light theme (canvas `#F5F1EA`, surface `#FFFCF7`) and an espresso dark theme (canvas `#1A1612`, surface `#241F1A`); Plus Jakarta Sans for UI copy and headings; JetBrains Mono for formulas, equations and timers; a 4px grid spacing scale; soft rounded shapes (radius 10/16 px) and subtle, warm-tinted elevation.
- **Why:** The user preferred mint green to teal. In light mode the mint is deep enough to carry white text (5.31:1) and links on cream (4.72:1); the bright mint shows in dark mode. Status colors keep their meaning through icons and text, since the accent is close to the success green.
- **Rejected:** Teal accent (D-034); classic and soft sage-mint options; light mint in light mode (fails contrast).
- **Evidence:** docs/design/design-review-2026-11-22.md; conversation 2026-11-22
- **Source:** user · confidence high

## D-036 · Laravel 13 REST API backend with React 19 + Vite SPA
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** The platform is built as a headless Laravel 13 (PHP 8.4) REST API backend paired with a standalone React 19 + Vite SPA frontend. Pest stays the backend test runner (D-008).
- **Why:** Laravel 11 (D-002) is past its security-support window (March 2026); Laravel 13 is the current major. No backend code existed yet, so the switch cost nothing. The architecture reasons of D-002 still hold: clean API/SPA separation, native queues and scheduling for sealing expired Attempts, and the catalog's documented REST API.
- **Rejected:** Staying on Laravel 11 (out of support); Laravel 12 (shorter remaining support than 13); monolithic Inertia.js without a standalone API.
- **Evidence:** Packagist laravel/framework 13.43.0 (2026-11-17, requires PHP ^8.3); conversation 2026-11-22 (P0 plan gate)
- **Source:** user · confidence high

## D-037 · GitHub Actions CI on every push
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** A GitHub Actions workflow runs on every push: backend Pest tests against PostgreSQL, frontend Vitest, lint and build, and `python3 docs/agents/tools/ledger-lint.py`. A red run blocks merging.
- **Why:** The catalog requires CI on GitHub Actions running the tests and the ledger lint on each push; the repo is already on GitHub.
- **Rejected:** No CI (fails the catalog); other CI services (the catalog names GitHub Actions).
- **Evidence:** catalog-de-proiecte-web.md:58; conversation 2026-11-22 (P0 plan gate, A1)
- **Source:** user · confidence high

## D-038 · Romanian as the default UI language
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** The UI opens in Romanian; English is available through the language toggle (D-022). The backend default locale is `ro` with `en` as fallback.
- **Why:** The users are Romanian classrooms; the backend scaffold already set `APP_LOCALE=ro`, `APP_FALLBACK_LOCALE=en`.
- **Rejected:** English as the default.
- **Evidence:** backend/.env.example:7-8; conversation 2026-11-22 (P0 plan gate, A2)
- **Source:** user · confidence high

## D-039 · Examiner-defined competences and topic labels
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Each Examiner keeps their own list of competences: a short code (e.g. C1, unique for that Examiner) and a Romanian description of what is assessed (e.g. "knows that the angles of a triangle add up to 180°"). Questions and blueprint Items are tagged with one of the Examiner's competences, and Item Analysis groups by them. Topics are only descriptive labels from the Examiner's own list; a question can have several, and they don't structure anything. Questions and exams carry a grade level (5–8).
- **Why:** Competences are what the teacher decides to assess, not a fixed list; topics (chapters such as Mulțimi de numere întregi, Drepte, Unghiuri) only describe questions, and a bank may mix them.
- **Rejected:** A small fixed competence list (D-030); topics as a seeded curriculum structure that groups competences; competences tied to a topic.
- **Evidence:** Conversation 2026-11-22 (P1 plan gate); INTERVIEW.md Q1 ("competentele specifice din respectiva unitate")
- **Source:** user · confidence high

## D-040 · Library entries are frozen copies
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Only Ready questions can be published to the shared library (D-027). Publishing makes a frozen copy with its own code, author and publish date; later edits to the author's question don't change it. Copying a library entry into another Examiner's bank creates an independent question that remembers which entry it came from, and also copies its competence and topic labels into the copier's own lists.
- **Why:** Matches DS-007 (separate LIB- codes, "Copiată · M6-TR-011", "Doar întrebările finalizate pot fi publicate") and keeps every Examiner in control of their own questions.
- **Rejected:** The library showing the author's live question; copies without the competence (the copier picks one).
- **Evidence:** Conversation 2026-11-22 (P1 and P1b plan gates); docs/design/mocks/DS-007.html
- **Source:** user · confidence high

## D-041 · One bank per Examiner, organised in pools
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Each Examiner has one bank: all their questions, private to them (D-027). Inside it they can create named pools; a question can be in several pools or in none, and deleting a pool keeps its questions. Exam Items draw from pools (D-043).
- **Why:** The bank is the storage place; pools are the groups an Examiner builds for exams, as in the catalog's "8 întrebări din pool-ul A (ușor), 4 din B (greu)".
- **Rejected:** Several separate banks per Examiner; a question belonging to exactly one pool; pools only for organising.
- **Evidence:** Conversation 2026-11-22 (P1b plan gate); catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-042 · Draft and Ready question status
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Each question is Draft or Ready. A Draft needs only its Subject (I or II) and type. A question can be marked Ready only when its statement, points, competence, grade level and difficulty are set, plus an answer key for Subject I and a complete barem for Subject II if the Examiner chose to use one (D-031). Only Ready questions can be picked for an Attempt or published to the library (D-040); the Exam builder shows Draft questions as "not ready", and an Exam cannot be published unless D-043's publish check passes.
- **Why:** Random picks (D-043) must never hand a Candidate a half-written question, and grade level and difficulty are needed to match questions to Items and filter the bank.
- **Rejected:** Treating every saved question as usable; Ready without grade level and difficulty (D-032).
- **Evidence:** Conversation 2026-11-22 (P1b plan gate); docs/design/research-quiz-platforms.md S-12
- **Source:** user · confidence high

## D-043 · Exam blueprint drawing from pools
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** An Exam is a blueprint of ordered Items. Each Item fixes section, competence (the Examiner's own, D-039), difficulty and points, and draws from one of the Examiner's pools (D-041). When an Attempt starts, the server picks for each Item one random Ready question from that pool whose competence and difficulty match the Item's. No question appears twice in the same Attempt, also when several Items draw from the same pool. An Exam can be published only if every Item can get its own distinct eligible question. Questions are fixed by default; a question may also draw values per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`), which the Examiner previews before publishing. The picked question, any drawn values and the expected answer are stored per Attempt (D-006, D-013), so the Examiner sees which question each Candidate got. Item Analysis reports per question and per Item. "8 easy questions from pool A" = 8 Items on pool A.
- **Why:** Every Attempt covers all competences with the same difficulty curve (INTERVIEW.md Q2, Q12), similar questions go to different Candidates (Q13), and it delivers the catalog's "8 întrebări din pool-ul A (ușor), 4 din B (greu)".
- **Rejected:** Hand-listed Variants per Item (D-025); a blueprint row drawing N questions from a pool (weakens per-Item coverage); repeats within one Attempt.
- **Evidence:** Conversation 2026-11-22 (P1b plan gate); docs/agents/OPEN-QUESTIONS.md:Q-036, Q-037; catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-044 · Expired Attempts sealed on read and by a pinged scheduled job
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Any request that touches an Attempt, or lists Attempts, first seals those past their duration plus the Grace Period (D-004, D-021). A Laravel scheduled job seals the rest; a free external cron service triggers it every few minutes through a secret-protected endpoint, which also keeps the free API awake. Correctness never depends on the job running on time.
- **Why:** Render's cron jobs and workers are paid and the free API sleeps after 15 minutes idle, while the catalog requires a scheduled job that submits expired Attempts even when the browser is closed.
- **Rejected:** A Render cron job or worker (paid); sealing only on read (no real scheduled job).
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-028; catalog-de-proiecte-web.md (P13 technical requirements)
- **Source:** user · confidence high

## D-045 · Answer options shuffled per Attempt
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** The options of dual, single and multiple choice questions are shuffled per Attempt, and the order is stored with the Attempt so review and contests show exactly what the Candidate saw. Items keep the blueprint order (D-043).
- **Why:** Delivers the catalog's random order without changing item numbers in grading or the shared difficulty curve.
- **Rejected:** Also shuffling Items within each Subject; no shuffling.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-029; catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-046 · Subject I answer-key corrections recalculate until publication
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Correcting a Subject I answer key after Attempts were submitted recalculates that question's scores in every Attempt and logs the change. Once results are published, the answer key is locked. Same rule as barem edits (D-031).
- **Why:** The catalog requires recalculation when the teacher corrects a question after the exam; locking at publication keeps published grades stable.
- **Rejected:** Recalculating after publication; no recalculation.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-030
- **Source:** user · confidence high

## D-047 · Weak-item thresholds
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Difficulty p = average score / maximum score (Subject II uses partial scores). Discrimination = correlation between the item score and the rest of the exam score (corrected item-total). An item is weak if p < 0.20 or p > 0.90, or discrimination < 0.20; negative discrimination is flagged as a likely faulty question. A distractor chosen by fewer than 5% of Candidates is flagged unused. With fewer than 2 Attempts, or no variation in the answers, the item shows "not enough data" instead of a value. Item Analysis groups by the Examiner's competences (D-039) and reports per question and per Item (D-043).
- **Why:** The catalog requires weak items to be flagged, degenerate cases handled (everyone correct, one student) and at least one weak item found in the pilot.
- **Rejected:** Flagging on discrimination only; stricter thresholds (p < 0.30 or > 0.80, discrimination < 0.30).
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-031; catalog-de-proiecte-web.md:907, 916
- **Source:** user · confidence high

## D-048 · Subject II photos in object storage in production
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-22
- **Rule:** Subject II solutions keep their step-by-step text and up to 3 handwritten photos per problem (D-011, D-026). In production the photos are stored in S3-compatible object storage with a free tier (provider chosen in P6); in development they stay on the local disk. The Examiner's grading queue shows them either way.
- **Why:** Render's free web service loses its disk on every deploy, so photos uploaded in the pilot would be deleted before grading (Q-027).
- **Rejected:** Local disk on Render with no deploys between pilot and grading; a paid Render persistent disk.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-027; conversation 2026-11-22
- **Source:** user · confidence high
