# P013 · Question Pool and Parameterized Exams (Bancă de Întrebări și Examene Parametrizate)

Web platform for administering online examinations with question pools, parameterized numerical questions, authoritative server timers, autosave resilience, manual grading workflows, and item psychometric analytics.

---

## 1. Project Overview & Client Context

- **Catalog Project:** P013 (Category C: University / Education)
- **Target Audience:** Middle-school education (Clasa a VI-a / 6th Grade)
- **Client / Domain Expert:** Middle-school Mathematics Teacher (see [INTERVIEW.md](file:///home/alexa/Work/exam-platform-web/INTERVIEW.md))
- **Domain Terminology:** Strictly adheres to [CONTEXT.md](file:///home/alexa/Work/exam-platform-web/CONTEXT.md) (**Exam**, **Candidate**, **Examiner**, **Attempt**, **Submission**).

---

## 2. Personal Project Variables

As required by the project specifications ([catalog-de-proiecte-web.md](file:///home/alexa/Work/exam-platform-web/catalog-de-proiecte-web.md#L910-L915)), the specific parameters established for this implementation are:

1. **Discipline & Question Pool Content:**
   - **Discipline:** 6th-Grade Mathematics (*Matematică - Clasa a VI-a*).
   - **Topics Covered:**
     - *Algebra:* Mulțimi de numere naturale și întregi; rapoarte și proporții.
     - *Geometry:* Unghiuri și triunghiuri.
   - **Pool Size:** Minimum 60 real, verified questions (tracked in `BANK.md`), validated by peers, and run in a live pilot test with at least 10 candidates.
2. **Scoring & Grading Model:**
   - **Total Points:** 100 points maximum (grades 1.0 to 10.0).
   - **Baseline:** 10 points *din oficiu* (minimum grade is 1.0; question scores cannot result in negative points).
   - **Subject 1 (30 points):** 6 questions $\times$ 5 points each. Fully auto-graded binary scoring (full points or 0; no partial credit).
   - **Subject 2 (60 points):** 3–4 complex multi-step problems. Graded manually by the **Examiner** post-**Submission**, supporting partial points.
   - **Negative Marking:** Strictly disallowed across all question types.
3. **Timer Authoritativeness & Expiration Grace Period:**
   - **Server-Authoritative Clock:** Duration (e.g., 50 minutes) tracked strictly by the backend.
   - **Expiration Grace Period:** **30 seconds** buffer allowing in-flight autosave/submission requests delayed by network latency before hard rejection.
4. **Default Numeric Tolerance:**
   - **Exact Match (tolerance = 0):** Numerical answers require exact integer or exact terminating decimal matches.
5. **Attempt Policy:**
   - **Configurable Attempts:** The **Examiner** can configure the allowed number of **Attempts** per **Exam** (supporting single or multiple attempts) along with score policy (e.g., highest score or latest score).

---

## 3. Technology Stack

In accordance with [catalog-de-proiecte-web.md](file:///home/alexa/Work/exam-platform-web/catalog-de-proiecte-web.md#L48-L67) and repository decisions:

- **Backend:** Laravel 11 providing a headless REST API, with Laravel Sanctum for authentication, Eloquent ORM for migrations and seeds, and scheduled tasks for automatic submission sealing.
- **Frontend:** React + Vite building an interactive Single Page Application (SPA) for Candidates, Examiners, and Administrators.
- **Database:** PostgreSQL 16 managing relational persistence with versioned Eloquent migrations and foreign key constraints across at least 6 core entities.
- **Containerization & Local Dev:** Docker Compose (`docker compose up`) orchestrating PostgreSQL, caching, and local development services.
- **API Contracts:** Fully documented REST endpoints with request/response payloads registered in [docs/agents/CONTRACTS.md](file:///home/alexa/Work/exam-platform-web/docs/agents/CONTRACTS.md).
- **Styling:** Tailwind CSS adhering to the visual tokens and accessibility criteria in [docs/design/DESIGN.md](file:///home/alexa/Work/exam-platform-web/docs/design/DESIGN.md).
- **Automated Testing Suite:** Pest PHP for backend tests, Vitest for frontend unit/integration tests, and Playwright for E2E user flows and automated visual regression screenshots.
- **Repository Layout:** Two-folder monorepo structure (`backend/` for Laravel 11, `frontend/` for React + Vite SPA, root `docker-compose.yml`).

---

## 4. User Roles & Access Control

The platform enforces three distinct authorization tiers:

1. **Candidate (Student):**
   - Self-registers with email and password.
   - Views available **Exams** and schedules.
   - Takes active **Attempts** with persistent autosave, server-synchronized timer, and recovery across reloads/disconnections.
   - Accesses read-only review, scoring breakdowns, and examiner feedback once grading is finalized.
2. **Examiner (Teacher):**
   - Accounts must be approved or provisioned by an Administrator.
   - Manages the Question Bank (CRUD for 60 questions, categories, difficulty levels, formulas, variant tuples).
   - Configures **Exam** templates (question pools, timing, deadlines).
   - Manages the **Manual Grading Queue** to review and score **Subject 2** submissions with partial credit.
   - Accesses the **Item Analysis & Analytics Dashboard** (facility index, discrimination, distractor analysis, class average/median).
3. **Administrator:**
   - System-wide access to provision and approve **Examiner** accounts and manage **Candidates**.
   - Global oversight, supervision, and lifecycle management for all platform **Exams**.

---

## 5. Question Types & Data Model

### Supported Question Formats
- **Alegere duală (Dual Choice / True-False):** Binary choice (Subject 1).
- **Alegere simplă (Single Choice):** 4 radio options, 1 correct (Subject 1).
- **Alegere multiplă (Multiple Choice):** Checkboxes; all-or-nothing (Subject 1).
- **Răspuns scurt & Completare (Short Answer / Fill-in-the-blank):** Text or numeric input with exact matching (Subject 1).
- **Numeric parametrizat (Parameterized Numeric):** Variable ranges evaluated via formulas; concrete evaluated numbers are permanently stored on the **Attempt** record for auditability (Subject 1). Evaluated server-side using a sandboxed PHP mathematical expression library (strictly avoiding arbitrary `eval()`).
- **Problemă structurată (Multi-step Problem):** Step-by-step reasoning or mathematical proof submitted for manual grading (Subject 2), supporting photo/image upload of handwritten solution work alongside a step summary text area.

> [!NOTE]
> Detailed mathematical constraint modeling for parameterized generators is currently tracked in [docs/agents/OPEN-QUESTIONS.md#Q-004](file:///home/alexa/Work/exam-platform-web/docs/agents/OPEN-QUESTIONS.md#Q-004) pending final confirmation with the client.

---

## 6. Screen Inventory & User Journeys

### Candidate Screens
1. **Authentication:** Login, Register, Forgot Password.
2. **Dashboard:** Active **Exams**, upcoming assessments, past **Attempts**, and published grades.
3. **Exam Room / Taking View:** Authoritative countdown timer, autosave sync indicator, question navigator drawer, Subject 1 input components, Subject 2 text/step input areas, and explicit **Submission** trigger.
4. **Results / Review View:** Post-assessment feedback, showing candidate answers, correct answers, examiner comments, and score breakdown.

### Examiner Screens
1. **Dashboard:** Summary metrics (active exams, attempts in progress, submissions awaiting grading).
2. **Question Bank Manager:** Filterable table of 60 questions with tags, difficulty indicators, preview, and variant editor.
3. **Exam Builder / Editor:** Template manager defining duration, availability windows, randomized pool criteria, and Subject 1 / Subject 2 weightings.
4. **Manual Grading Queue:** List of ungraded **Subject 2** attempts with rubric scoring, partial credit inputs, and feedback boxes.
5. **Item Analysis & Analytics Dashboard:** Visual psychometric cards (difficulty %, point-biserial discrimination index, distractor frequency) and cohort stats (average, median).

### Administrator Screens
1. **User Management:** Pending examiner approval queue, role assignments, candidate account oversight.
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
