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
- Q-014 · What happens when an Attempt starts close to the Exam's end_time (`available_until`)? · _answered_
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
- Q-025 · What happens to the uncommitted backend/ scaffold, and where does Laravel run locally? · _answered_
- Q-026 · Does the SPA authenticate with a Sanctum cookie session or a bearer token? · _answered_
- Q-027 · Where are Subject 2 photos stored in production? · _answered_
- Q-028 · How does the scheduled auto-submit job run on Render? · _answered_
- Q-029 · Are Items and answer options shown in random order per Attempt? · _answered_
- Q-030 · What happens when the Examiner corrects a Subject 1 answer key after Attempts were graded? · _answered_
- Q-031 · Which thresholds flag an item as weak, and how are partial-credit items measured? · _answered_
- Q-032 · How is mathematical notation shown in question text?
- Q-033 · In which format is the API documented? · _answered_
- Q-034 · Which pages, if any, may search engines index? · _answered_
- Q-035 · Which curriculum topics are seeded? · _answered_
- Q-036 · Must a question drawn for an Item match the Item? · _answered_
- Q-037 · Can the same question appear twice in one Attempt? · _answered_
- Q-038 · Can a class linked to a published Exam be deleted? · _answered_
- Q-039 · Does the 30 Nov pilot include Subject 2? · _answered_

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

## Q-014 · What happens when an Attempt starts close to the Exam's end_time (`available_until`)?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Every Attempt gets the full duration from its own start (plus the Grace Period). `end_time` (the `available_until` column) only stops new Attempts from starting.

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

## Q-025 · What happens to the uncommitted backend/ scaffold, and where does Laravel run locally?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Generate a fresh official Laravel skeleton into `backend/`, keeping `docker-compose.yml`, `backend/.env.example` and the `/api/health` route; the 7 migrations from the outdated schema plan move to `docs/plans/legacy-migrations/` for P1 to consult (nothing deleted). Laravel runs in Docker: one `backend/Dockerfile` serves both an `api` service in docker-compose and Render.

## Q-026 · Does the SPA authenticate with a Sanctum cookie session or a bearer token?
- **Status:** answered
- **Date:** 2026-11-22
- **Context:** The uncommitted scaffold chose cookie sessions (`SESSION_DRIVER=database`, `SANCTUM_STATEFUL_DOMAINS`, `$middleware->statefulApi()`), while the approved auth plans (docs/plans/auth-part-1-backend.md, auth-parts-2-and-3.md) issue a bearer token stored in localStorage. The SPA and API run on different Render domains (D-014), which affects cookie sessions. P0 leaves `statefulApi()` out; P2 needs the answer.
- **Answer:** A Sanctum bearer token: issued at login, kept by the SPA in localStorage and sent in the `Authorization` header; logout revokes it. Chosen over a cookie session because the site and the API are on different onrender.com domains, and onrender.com is a public suffix, so a session cookie would be cross-site (`SameSite=None`) and blocked by Safari. Matches the approved auth plans (D-050, proposed). (Answered 2026-11-23.)

## Q-027 · Where are Subject 2 photos stored in production?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P6 (attempt engine: uploads)
- **Context:** D-011 says photos are "stored securely on server disk", but the Render web service's disk is wiped on every deploy (D-014), so uploads would be lost. Options: a Render persistent disk (paid plan) or object storage (e.g. S3, R2). The answer may need a change to D-011 (PROPOSAL).
- **Answer:** S3-compatible object storage with a free tier in production (provider chosen in P6, e.g. Cloudflare R2 or Supabase Storage); local disk in development. Chosen over local disk on Render, where every deploy would delete the pilot's photos before grading. Supersedes D-011 (D-048). (Answered 2026-11-22.)

## Q-028 · How does the scheduled auto-submit job run on Render?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P6 (sealing expired Attempts)
- **Context:** The catalog requires a scheduled job that submits expired Attempts even when the browser is closed. `php artisan schedule:run` needs a cron job or worker on Render (may be paid), and free web services sleep after 15 minutes idle. Options: a Render cron job, a background worker, or checking expiry whenever an Attempt is read plus an external ping.
- **Answer:** Expired Attempts are sealed whenever a request touches or lists them, and a Laravel scheduled job seals the rest; a free external cron service triggers it every few minutes through a secret-protected endpoint, which also keeps the free API awake (D-044). (Answered 2026-11-22.)

## Q-029 · Are Items and answer options shown in random order per Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P5 (exam builder), P6 (attempt start)
- **Context:** The catalog asks for random order of questions and of options ("ordine aleatoare a întrebărilor și a variantelor"). D-025 defines an ordered list of Items and says nothing about shuffling options in choice questions. INTERVIEW.md (parameter order matters in many exercises) is a reason not to assume.
- **Answer:** Only the answer options of dual, single and multiple choice questions are shuffled per Attempt, and the order is stored with the Attempt; Items keep the blueprint order (D-045). (Answered 2026-11-22.)

## Q-030 · What happens when the Examiner corrects a Subject 1 answer key after Attempts were graded?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P8 (grading and publication)
- **Context:** The catalog requires recalculation when the teacher corrects a question after the exam. D-031 covers barem edits for Subject 2 only (recalculated before publication, locked after). Open: are Subject 1 scores recalculated, and is that allowed after results are published?
- **Answer:** Correcting a Subject I answer key recalculates that question's scores in every Attempt, with the change logged, until results are published; after publication the answer key is locked (D-046). (Answered 2026-11-22.)

## Q-031 · Which thresholds flag an item as weak, and how are partial-credit items measured?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P10 (Item Analysis)
- **Context:** The catalog requires weak items to be flagged and the DoD requires at least one weak item found in the pilot. Open: difficulty and discrimination thresholds, and how Subject 2 items with partial credit enter difficulty and point-biserial discrimination.
- **Answer:** Standard thresholds: weak if difficulty p < 0.20 or > 0.90, or discrimination < 0.20; negative discrimination flagged as a likely faulty question; a distractor chosen by fewer than 5% flagged unused; fewer than 2 Attempts or no variation shows "not enough data" (D-047). (Answered 2026-11-22.)

## Q-032 · How is mathematical notation shown in question text?
- **Status:** open
- **Date:** 2026-11-22
- **Blocks:** P4b (question bank), P7 (exam room)
- **Context:** Plain text with JetBrains Mono (DESIGN.md `font-math`), or rendered notation such as KaTeX (a new dependency).

## Q-033 · In which format is the API documented?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P2 onward (each backend part adds a C- contract with a link to the docs)
- **Context:** The catalog accepts OpenAPI/Swagger or an API.md with request/response examples.
- **Answer:** A hand-written `docs/API.md` with a request and response example for each endpoint; C- entries link to its sections. No OpenAPI generator (no new dependency) (D-051, proposed). (Answered 2026-11-23.)

## Q-034 · Which pages, if any, may search engines index?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P2 (first public screens)
- **Context:** Raised by the P0 SEO review. Everything is `noindex, nofollow` for now (frontend/index.html). Pages behind login (exams, attempts, grading, results) should stay out of indexes; open is whether any public page (e.g. login or a landing page) should be indexable.
- **Answer:** None. Every page stays `noindex, nofollow`, login and registration included: the platform is a pilot tool with no public landing page (D-052, proposed). (Answered 2026-11-23.)

## Q-035 · Which curriculum topics are seeded?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Not applicable. D-039 makes topics the Examiner's own descriptive labels, so there is no curriculum topic list to seed.

## Q-036 · Must a question drawn for an Item match the Item?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Yes. An Item draws only from the pool's Ready questions whose competence and difficulty match the Item's (D-043).

## Q-037 · Can the same question appear twice in one Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** No, also when several Items draw from the same pool. An Exam can be published only if every Item can get its own distinct eligible question (D-043).

## Q-038 · Can a class linked to a published Exam be deleted?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** No. Raised by the P1c security review: deleting a class removed its links silently, hiding a published Exam and its results from that class's Candidates. The database now refuses deleting a linked class, and P3 unlinks draft Exams first (D-049).

## Q-039 · Does the 30 Nov pilot include Subject 2?
- **Status:** answered
- **Date:** 2026-11-23
- **Blocks:** P4c (seeded questions), P8 (grading on 1 Dec), P12 (pilot)
- **Context:** Subject 1 alone, auto-graded, already gives the pilot the weak-item data Item Analysis needs. Subject 2 adds photo uploads and Examiner grading with a barem to the pilot.
- **Answer:** Yes. The pilot Exam has 6 Subject 1 Items and 2 Subject 2 problems, each with a barem: about 20–30 photographed answers, graded by the Examiner on 1 Dec (30–60 minutes). (Answered 2026-11-23.)
