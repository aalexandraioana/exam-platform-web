# Open questions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
- Q-001 · What web framework and technology stack should be used? · _answered_
- Q-002 · What testing framework and test runner should be configured? · _answered_
- Q-003 · What screenshot mechanism should be used for visual regression testing? · _answered_
- Q-004 · How should question parameterization and mathematical constraints be modeled? · _answered_
- Q-005 · How should cohort-wide general feedback and individual candidate feedback be published? · _answered_
- Q-006 · How are an Exam's questions chosen for each Attempt? · _answered_
- Q-007 · Does the platform have classes, and what is a cohort? · _answered_
- Q-008 · Which numeric answer formats are accepted? · _answered_
- Q-009 · When does a Candidate see their Subject 1 score? · _answered_
- Q-010 · How are short text answers matched? · _answered_
- Q-011 · What does the "Feedback cadru didactic" column on the candidate dashboard (DS-003) show? · _answered_
- Q-012 · How are Examiner accounts created? · _answered_
- Q-013 · How is a forgotten password handled? · _answered_
- Q-014 · What happens when an Attempt starts close to the Exam's end_time? · _answered_
- Q-015 · Which language is the UI in? · _answered_
- Q-016 · How is an examiner-written Variant (A/B) assigned to an Attempt? · _answered_
- Q-017 · Which Romanian and English UI words map to each CONTEXT.md term? · _answered_
- Q-018 · What are the limits for Subject 2 photo uploads? · _answered_
- Q-019 · Is the question bank shared between Examiners or private to its author? · _answered_
- Q-020 · What rules define the random draw of questions for an Attempt? · _answered_
- Q-021 · Who creates classes, and how does a self-registered Candidate join one? · _answered_
- Q-022 · Where is the question pool of at least 60 verified questions kept? · _answered_
- Q-023 · How is a question's specific competence identified? · _answered_
- Q-024 · What happens when an Item has fewer Variants than the letter an Attempt got? · _answered_

---

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

## Q-004 · How should question parameterization and mathematical constraints be modeled?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Standard fixed questions are the default (`is_parameterized = false`). A per-question toggle enables parameterization in either of two forms: (1) examiner-written Variants (e.g. Variant A and Variant B) that can change the wording or the values of the same exercise; (2) values drawn per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`, to avoid negative results in Grade 5 subtraction). For drawn values the Examiner previews the generated values before the Exam is published. Teachers are not asked to write complex constraint rules. The assigned Variant or drawn values and the expected answer are snapshotted per Attempt, and expressions are evaluated safely on the server. (Clarified 2026-11-22: the earlier text only described form 1; the user confirmed both forms plus the preview step.)

## Q-005 · How should cohort-wide general feedback and individual candidate feedback be published?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** The Examiner publishes a single global cohort feedback note all at once after full grading is complete. Individual candidates also receive private per-problem partial points and comments on their Subject 2 submissions, visible only after the Examiner explicitly publishes results.

## Q-006 · How are an Exam's questions chosen for each Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Random draw per Attempt: the Examiner sets rules (e.g. topic, difficulty, count) and each Attempt draws its own questions from the question pool. The rule format is open (Q-020).

## Q-007 · Does the platform have classes, and what is a cohort?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Yes. Candidates belong to classes; an Exam is published to one or more classes; the cohort in D-010 is the Candidates of the class(es) the Exam was published to. Who creates classes and how Candidates join is open (Q-021).

## Q-008 · Which numeric answer formats are accepted?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Both decimal separators are accepted (`2,5` and `2.5`). A fraction answer must be in the form the Examiner expects (e.g. simplified); an equal value in another form is not accepted.

## Q-009 · When does a Candidate see their Subject 1 score?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Not before publication. After Submission the Candidate sees "submitted, awaiting grading"; Subject 1, Subject 2 and the total appear together when the Examiner publishes results (D-010).

## Q-010 · How are short text answers matched?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Case, extra whitespace and diacritics are ignored, and the Examiner can list several accepted answers per question.

## Q-011 · What does the "Feedback cadru didactic" column on the candidate dashboard (DS-003) show?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Nothing: the column is dropped. The dashboard shows score and status only; all feedback lives in the review screen (DS-005).

## Q-012 · How are Examiner accounts created?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Only an Administrator creates Examiner accounts. There is no Examiner self-registration and no "pending approval" login state.

## Q-013 · How is a forgotten password handled?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** No email reset. An Administrator (or the Examiner, for their class) sets a new password. The "Forgot Password" screen leaves the README screen list.

## Q-014 · What happens when an Attempt starts close to the Exam's end_time?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Every Attempt gets the full duration from its own start (plus the Grace Period). `end_time` only stops new Attempts from starting.

## Q-015 · Which language is the UI in?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Romanian and English, with a language toggle. CONTEXT.md gets a Romanian and an English column per term; the Romanian words themselves are open (Q-017).

## Q-016 · How is an examiner-written Variant (A/B) assigned to an Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** At random: when an Attempt starts, the server picks one Variant per Item at random, independently per Item (D-025). Supersedes the earlier letter-by-alternation answer, which misread the intent.

## Q-017 · Which Romanian and English UI words map to each CONTEXT.md term?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Formal, exam-style Romanian mirroring the English terms: Examen, Candidat, Examinator, Administrator, Încercare, Predare, Subiectul I / II, Punct din oficiu, Variantă, Analiza itemilor, Perioadă de toleranță, Clasă, Item (blueprint slot). Avoid in Romanian UI: test, testare, lucrare, cadru didactic, profesor. Recorded in CONTEXT.md.

## Q-018 · What are the limits for Subject 2 photo uploads?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Up to 3 images per Subject 2 problem, 10 MB each, in JPG, PNG or HEIC; HEIC is converted to JPG on the server so the Examiner's browser can display it. (The current `responses.uploaded_image_path` holds one path only.)

## Q-019 · Is the question bank shared between Examiners or private to its author?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Private, with copy to share: each Examiner sees and uses only their own questions, but can publish a question to a shared library; other Examiners copy it into their own pool (the copy is theirs to edit).

## Q-020 · What rules define the random draw of questions for an Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** A blueprint of ordered Items, each fixing section, competence, difficulty and points, with one or more equivalent questions per Item; one question per Item per Attempt, picked at random (D-025).

## Q-021 · Who creates classes, and how does a self-registered Candidate join one?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** The Examiner creates their classes; each class has a short join code. A Candidate enters the code at registration or later from the dashboard and stays pending until the Examiner accepts them.

## Q-022 · Where is the question pool of at least 60 verified questions kept?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** The database is the source of truth. The initial pool is loaded once by a seeder from a seed file; the seeder only inserts questions whose stable code is not yet in the database and never updates or deletes, so questions added or edited in the UI are safe. BANK.md does not hold question text: it is the validation and pilot log the catalog requires (per validated question: code, competence, the 2+ colleagues who validated it, when, what they corrected; plus the results of the pilot with 10+ Candidates). Questions added later in the UI need a BANK.md row only if they count toward the validated 60.

## Q-023 · How is a question's specific competence identified?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** A small fixed list of competences covering only the planned topics and scope (e.g. C1–C4 for a chapter), not the full curriculum. Questions and blueprint Items are tagged from this list, and Item Analysis groups by it.

## Q-024 · What happens when an Item has fewer Variants than the letter an Attempt got?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Not applicable: D-025 removed letters; each Item picks its Variant at random, so no letter can be missing.
