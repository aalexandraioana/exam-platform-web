# P013 · Question Pool and Parameterized Exams (Bancă de Întrebări și Examene Parametrizate)

Web platform for administering online mathematics examinations across grade levels, featuring question pools, parameterized numerical questions, authoritative server timers, autosave resilience, manual grading workflows, and item psychometric analytics.

---

## 1. Project Overview & Client Context

- **Catalog Project:** P013 (Category C: University / Education)
- **Target Audience:** Mathematics education across grade levels (grades 5–8+, with 6th Grade Mathematics as the reference pool and pilot dataset)
- **Client / Domain Expert:** Middle-school Mathematics Teacher (see [INTERVIEW.md](INTERVIEW.md))
- **Domain Terminology:** Strictly adheres to [CONTEXT.md](CONTEXT.md) (**Exam**, **Candidate**, **Examiner**, **Attempt**, **Submission**).

---

## 2. Personal Project Variables

As required by the project specifications ([catalog-de-proiecte-web.md](catalog-de-proiecte-web.md#L910-L915)), the specific parameters established for this implementation are:

1. **Discipline & Question Pool Content:**
   - **Discipline:** Mathematics across grade levels, with 6th-Grade Mathematics (*Matematică - Clasa a VI-a*) as the initial reference pool.
   - **Topics Covered:**
     - *Algebra:* Mulțimi de numere naturale și întregi; rapoarte și proporții.
     - *Geometry:* Unghiuri și triunghiuri.
   - **Pool Size:** Minimum 60 real questions, each validated by at least 2 peers, and run in a live pilot test with at least 10 **Candidates**. The questions live in the database (seeded once, then edited in the app); `BANK.md` is the validation and pilot log (who validated each question, when, what they corrected, and the pilot results).
2. **Scoring & Grading Model:**
   - **Total Points:** 100 points maximum (grades 1.0 to 10.0).
   - **Baseline:** 10 points *din oficiu* (minimum grade is 1.0; question scores cannot result in negative points).
   - **Subject 1 (30 points):** 6 questions $\times$ 5 points each. Fully auto-graded binary scoring (full points or 0; no partial credit).
   - **Subject 2 (60 points):** 3–4 complex multi-step problems. Graded manually by the **Examiner** post-**Submission**, supporting partial points.
   - **Negative Marking:** Strictly disallowed across all question types.
3. **Timer Authoritativeness & Expiration Grace Period:**
   - **Server-Authoritative Clock:** Duration (e.g., 50 minutes) tracked strictly by the backend. Every **Attempt** gets the full duration from its own start; the Exam's closing time only stops new Attempts from starting (D-021).
   - **Expiration Grace Period:** **30 seconds** buffer allowing in-flight autosave/submission requests delayed by network latency before hard rejection.
4. **Answer Matching (D-006, D-017):**
   - **Exact Match (tolerance = 0):** Numerical answers require exact integer or exact terminating decimal matches; both `2,5` and `2.5` are accepted. A fraction must be in the form the **Examiner** expects.
   - **Text answers:** case, extra whitespace and diacritics are ignored; the **Examiner** can list several accepted answers.
5. **Attempt Policy:**
   - **Configurable Attempts:** The **Examiner** can configure the allowed number of **Attempts** per **Exam** (supporting single or multiple attempts) along with score policy (e.g., highest score or latest score).

---

## 3. Technology Stack

In accordance with [catalog-de-proiecte-web.md](catalog-de-proiecte-web.md#L48-L67) and repository decisions:

- **Backend:** Laravel 13 providing a headless REST API, with Laravel Sanctum for authentication, Eloquent ORM for migrations and seeds, and scheduled tasks for automatic submission sealing.
- **Frontend:** React + Vite building an interactive Single Page Application (SPA) for Candidates, Examiners, and Administrators.
- **Database:** PostgreSQL 16 managing relational persistence with versioned Eloquent migrations and foreign key constraints across at least 6 core entities.
- **Containerization & Local Dev:** Docker Compose (`docker compose up`) runs PostgreSQL and the Laravel API.
- **API Contracts:** Fully documented REST endpoints with request/response payloads registered in [docs/agents/CONTRACTS.md](docs/agents/CONTRACTS.md).
- **Styling:** Tailwind CSS adhering to the visual tokens and accessibility criteria in [docs/design/DESIGN.md](docs/design/DESIGN.md).
- **Automated Testing Suite:** Pest PHP for backend tests, Vitest for frontend unit/integration tests, and Playwright for E2E user flows and automated visual regression screenshots.
- **Repository Layout:** Two-folder monorepo structure (`backend/` for Laravel 13, `frontend/` for React + Vite SPA, root `docker-compose.yml`).


### Run locally

Needs Docker and Node (version in `frontend/.nvmrc`); no PHP on the host.

```bash
docker compose up -d                        # PostgreSQL + API on http://localhost:8000
docker compose exec api ./vendor/bin/pest   # backend tests

cd frontend
cp .env.example .env                        # VITE_API_BASE_URL=http://localhost:8000/api
npm install
npm run dev                                 # SPA on http://localhost:5173
npm run test                                # frontend tests
```

The first `docker compose up` installs the Composer packages, creates `backend/.env` with its own key and runs the migrations. Environment variables: `backend/.env.example`, `frontend/.env.example`.

---

## 4. User Roles & Access Control

The platform enforces three distinct authorization tiers:

1. **Candidate (Student):**
   - Self-registers with email and password, and joins a class with its join code; membership is pending until the **Examiner** accepts (D-028).
   - Views the **Exams** published to their class (D-015) and their schedules.
   - Takes active **Attempts** with persistent autosave, server-synchronized timer, and recovery across reloads/disconnections.
   - Sees no score until the **Examiner** publishes results; then accesses read-only review, scoring breakdowns, and **Examiner** feedback (D-019).
2. **Examiner (Teacher):**
   - Accounts are created by an Administrator; there is no Examiner self-registration (D-020).
   - Creates classes, shares their join codes, and accepts or declines joining **Candidates** (D-028).
   - Manages their private Question Bank (questions tagged with one of their own competences and any number of topic labels, a grade level, difficulty, Variants and value bounds (D-039)), and can publish questions to a shared library or copy others' into their own pool (D-027, D-030).
   - Configures **Exam** templates (question draw rules, timing, deadlines) and publishes them to classes.
   - Manages the **Manual Grading Queue** to review and score **Subject 2** submissions with partial credit.
   - Accesses the **Item Analysis & Analytics Dashboard** (facility index, discrimination, distractor analysis, class average/median).
3. **Administrator:**
   - System-wide access to create **Examiner** accounts, manage **Candidates**, and set new passwords on request (D-020).
   - Global oversight, supervision, and lifecycle management for all platform **Exams**.

---

## 5. Question Types & Data Model

### Supported Question Formats
- **Alegere duală (Dual Choice / True-False):** Binary choice (Subject 1).
- **Alegere simplă (Single Choice):** 4 radio options, 1 correct (Subject 1).
- **Alegere multiplă (Multiple Choice):** Checkboxes; all-or-nothing (Subject 1).
- **Răspuns scurt & Completare (Short Answer / Fill-in-the-blank):** Text or numeric input with exact matching (Subject 1).
- **Variants and parameterization (any question, D-025):** Questions are fixed by default. Written **Variants** are similar, equivalent questions placed in the same blueprint Item; each **Attempt** gets one Variant per Item, picked at random. A question may also draw values per **Attempt** from simple min/max bounds (e.g. `a > b`), previewed by the **Examiner** before publishing. The picked question, the drawn values and the expected answer are stored on the **Attempt** for auditability, and formulas are evaluated server-side with a sandboxed PHP mathematical expression library (never `eval()`).
- **Problemă structurată (Multi-step Problem):** Step-by-step reasoning or mathematical proof submitted for manual grading (Subject 2), supporting up to 3 photos of handwritten solution work per problem (JPG, PNG or HEIC, 10 MB each, D-026) alongside a step summary text area.

> [!NOTE]
> The blueprint and Variant rules are decided in D-025 ([docs/agents/DECISIONS.md](docs/agents/DECISIONS.md)). Each Examiner writes their own competences (a code and what is assessed); topics are only descriptive labels on questions (D-039).

---

## 6. Screen Inventory & User Journeys

### Candidate Screens
1. **Authentication:** Login, Register. A forgotten password is reset by an Administrator or the Examiner (D-020).
2. **Dashboard:** Active **Exams**, upcoming **Exams**, past **Attempts** (submitted and awaiting grading, or graded), and published grades.
3. **Exam Room / Taking View:** Authoritative countdown timer, autosave sync indicator, question navigator drawer, Subject 1 input components, Subject 2 text/step input areas, and explicit **Submission** trigger.
4. **Results / Review View:** Post-assessment feedback, showing candidate answers, correct answers, examiner comments, and score breakdown.

### Examiner Screens
1. **Dashboard:** Summary metrics (active exams, attempts in progress, submissions awaiting grading).
2. **Question Bank Manager:** Filterable table of the question pool with tags, difficulty indicators, preview, and Variant editor.
3. **Exam Builder / Editor:** Template manager defining duration, availability windows, the blueprint (ordered Items, each with a competence, difficulty, points and its equivalent Variants, D-025), target classes, and Subject 1 / Subject 2 weightings.
4. **Manual Grading Queue:** List of ungraded **Subject 2** attempts with rubric scoring, partial credit inputs, and feedback boxes.
5. **Item Analysis & Analytics Dashboard:** Visual psychometric cards (difficulty %, point-biserial discrimination index, distractor frequency) and cohort stats (average, median).

### Administrator Screens
1. **User Management:** Examiner account creation, role assignments, Candidate account oversight, password resets.
2. **Exam Supervision:** Platform-wide directory of all active and archived exams.

---

## 7. Project Boundaries & Out of Scope (Non-Goals)

To prevent scope creep and maintain alignment with the client's needs, the following capabilities are explicitly **NOT in the project**:

- **Webcam / Audio / AI Proctoring:** No facial recognition, audio monitoring, or biometric tracking.
- **Third-Party LMS Integrations:** No integrations with Google Classroom, Moodle, Adservio, or Canvas.
- **Automated Plagiarism Detection for Subject 2:** Subject 2 relies exclusively on manual review by the **Examiner**; no NLP or automated proof verification is performed.
- **Standalone Offline Mode:** Requires an active network connection (with autosave retry buffers for transient connection drops).
- **Live In-Exam Chat:** No communication channels between candidates and examiners during an active exam attempt.
- **Ordering Questions (Ordonare):** Excluded from the assessment engine; the scope focuses strictly on the formats used by the client and defined in Section 5.
