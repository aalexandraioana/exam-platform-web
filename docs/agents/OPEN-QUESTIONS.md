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
- Q-032 · How is mathematical notation shown in question text? · _answered_
- Q-033 · In which format is the API documented? · _answered_
- Q-034 · Which pages, if any, may search engines index? · _answered_
- Q-035 · Which curriculum topics are seeded? · _answered_
- Q-036 · Must a question drawn for an Item match the Item? · _answered_
- Q-037 · Can the same question appear twice in one Attempt? · _answered_
- Q-038 · Can a class linked to a published Exam be deleted? · _answered_
- Q-039 · Does the 30 Nov pilot include Subject 2? · _answered_
- Q-040 · What happens when the class code entered at registration matches no class? · _answered_
- Q-041 · What does the roster's "more options" menu on DS-013 contain, and can a declined Candidate ask to join again?
- Q-042 · Who resets a forgotten password, and is the new password temporary? · _answered_
- Q-043 · Can the Administrator reactivate a deactivated user? · _answered_
- Q-044 · Who can be deactivated on DS-011: other Administrators, and the Administrator themselves? · _answered_
- Q-045 · Does an Item still draw from a pool once it also matches type and topic? · _answered_
- Q-046 · How does an Item match a question's topics? · _answered_
- Q-047 · Are fixed values in a parameterised question marked too? · _answered_
- Q-048 · What can a value domain be? · _answered_
- Q-049 · Must calculated values and the answer of a parameterised question be whole numbers? · _answered_
- Q-050 · Which question types can use named values? · _answered_
- Q-051 · Can the answer of a parameterised question be a fraction? · _answered_
- Q-052 · Which operations can formulas use? · _answered_
- Q-053 · Where does an Examiner create competences, topics and pools? · _answered_
- Q-054 · Who sets the code of a question created in the app? · _answered_
- Q-055 · What replaces DS-007's "Folosită în" column? · _answered_
- Q-056 · Can a question be deleted? · _answered_
- Q-057 · What happens when a Ready question is edited so it is no longer complete? · _answered_
- Q-058 · Can an Examiner take back an entry they published to the library? · _answered_
- Q-059 · Where does an Examiner see their exams? · _answered_
- Q-060 · What can change after an Exam is published? · _answered_
- Q-061 · Can an Exam be unpublished or deleted? · _answered_
- Q-062 · What is the "departajare" label on DS-008's Item 9? · _answered_
- Q-063 · Which competences should an Exam cover (DS-008 coverage warning)? · _answered_
- Q-064 · Where do Candidates see an Exam's description? · _answered_
- Q-065 · Is P6 built in one piece? · _answered_
- Q-066 · Which object storage provider holds Subject II photos in production? · _answered_
- Q-067 · Who sets up the external cron that seals expired Attempts? · _answered_
- Q-068 · What separates the "started" and "in_progress" Attempt states? · _answered_
- Q-069 · Which labels does an exam card on the Candidate dashboard show? · _answered_
- Q-070 · Does P7 include Subject II photos and the submitted-exams table? · _answered_
- Q-071 · Is P7 built in one piece? · _answered_
- Q-072 · How many items does the exam room show at once? · _answered_
- Q-073 · Does the delivered app move from Render to AWS?
- Q-074 · How does questions.yaml get into the live bank? · _answered_
- Q-075 · How is a Subject II Item graded when its question's points differ from the Item's? · _answered_
- Q-076 · When may the Examiner publish an exam's results? · _answered_
- Q-077 · Is P8 built in one piece? · _answered_
- Q-078 · Which DS-009 parts may be cut to save time? · _answered_
- Q-079 · Do answers marked for re-check block publishing results? · _answered_
- Q-080 · Can an exam without an end date publish its results? · _answered_
- Q-081 · Is "Disponibil până la" locked once results are published? · _answered_
- Q-082 · What does a Candidate see for each Subject I item after results are published? · _answered_
- Q-083 · What does a Candidate see for each Subject II problem after results are published? · _answered_
- Q-084 · Which Attempts does the results page show when an Exam allowed several? · _answered_
- Q-085 · Does a Candidate see class statistics with their results? · _answered_

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
- **Note:** 2026-11-24: only the Administrator sets a new password now, and it is temporary (Q-042, D-054).

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
- **Answer:** A Sanctum bearer token: issued at login, kept by the SPA in localStorage and sent in the `Authorization` header; logout revokes it. Chosen over a cookie session because the site and the API are on different onrender.com domains, and onrender.com is a public suffix, so a session cookie would be cross-site (`SameSite=None`) and blocked by Safari. Matches the approved auth plans (D-050). (Answered 2026-11-23.)

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
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P4b (question bank), P7 (exam room)
- **Context:** Plain text with JetBrains Mono (DESIGN.md `font-math`), or rendered notation such as KaTeX (a new dependency).
- **Answer:** Plain text in JetBrains Mono (DESIGN.md `font-math`), with Unicode symbols typed in the text (∢, °, ², ·, :, ≤); no rendering library. (Answered 2026-11-24.)

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
- **Answer:** Yes. The pilot Exam has 6 Subject 1 Items and 3 Subject 2 problems of 20 points (D-062), each with a barem, graded by the Examiner on 1 Dec. (Answered 2026-11-23; 3 problems instead of 2 since 2026-11-26.)

## Q-040 · What happens when the class code entered at registration matches no class?
- **Status:** answered
- **Date:** 2026-11-23
- **Blocks:** P2 (registration, DS-002), P3 (join requests)
- **Context:** D-028 lets a Candidate enter a class code at registration, but says nothing about a code that matches no class. Options: refuse the registration and show the error on the code field (nothing is created; the Candidate fixes the code or clears it), or create the account anyway and tell the Candidate the code was not found. The DS-002 mock shows it in its "Cod greșit" state.
- **Answer:** The registration is refused: nothing is created, and the code field says the code matches no class. The Candidate fixes the code or clears the field (it stays optional) and submits again. Chosen so a typo is caught while the teacher's code is at hand, instead of leaving an account outside its class (D-053). (Answered 2026-11-23.)

## Q-041 · What does the roster's "more options" menu on DS-013 contain, and can a declined Candidate ask to join again?
- **Status:** open
- **Date:** 2026-11-23
- **Blocks:** P3 (roster menu; joining after a decline)
- **Context:** DS-013 shows a "…" button per Candidate in the roster with no menu drawn (removing a Candidate from the class is a likely item). D-028 keeps a declined request's row, one per Candidate and class, and doesn't say whether that Candidate may send a new request. Until answered, the menu is not built and joining after a decline is refused as already decided.
- **Note:** 2026-11-24: the "…" button and the empty "Acțiuni" column left the DS-013 mock and roster (P3b); they come back with the menu once this is answered.

## Q-042 · Who resets a forgotten password, and is the new password temporary?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P3 (DS-013 password dialog), P11 (DS-011 Administrator screen)
- **Context:** D-020 let the Examiner set a new password for a Candidate in their class, in a dialog that showed it in plain text and asked for it once. The user moved resets to the Administrator, with a temporary password, while no Administrator screen exists yet.
- **Answer:** Only the Administrator resets passwords, on an Administrator screen built now (the Administrator screens leave the cut list). The Administrator types the password, hidden and twice. It is temporary for every user whose password an Administrator sets, and for new Examiner accounts: at the next sign-in they must choose a new one, different from the temporary one. A temporary password does not expire. The Examiner's "Parolă nouă" button on DS-013 goes away (D-054). (Answered 2026-11-24.)

## Q-043 · Can the Administrator reactivate a deactivated user?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P3b (DS-011 row actions)
- **Context:** DS-011 deactivates users (existing `is_active`: tokens revoked, login refused). Nothing says whether that can be undone. Until answered, DS-011 has no reactivate action and the mock shows a deactivated user's row without one.
- **Answer:** No. Deactivation is permanent. (Answered 2026-11-24.)

## Q-044 · Who can be deactivated on DS-011: other Administrators, and the Administrator themselves?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P3b (DS-011 row actions, admin endpoint)
- **Context:** Deactivating one's own account would lock the only Administrator out; deactivating another Administrator may or may not be wanted. Until answered, the Deactivate action is drawn only on Candidate and Examiner rows.
- **Answer:** No Administrator account can be deactivated on DS-011, neither another Administrator's nor one's own. Only Candidates and Examiners can. (Answered 2026-11-24.)

## Q-045 · Does an Item still draw from a pool once it also matches type and topic?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5 (exam builder, DS-008), P6 (draw)
- **Context:** The user said Items draw questions "from the pool based on selected difficulty, type, topic and competence". D-043 has each Item pick one of the Examiner's pools and match competence and difficulty inside it. Options: keep the pool and add type and topic to the match, or drop the pool from Items and draw from the whole bank (pools then only organise the bank, D-041).
- **Answer:** The Item keeps its pool and matches inside it. (Answered 2026-11-24.)

## Q-046 · How does an Item match a question's topics?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b (question editor), P5, P6
- **Context:** D-039 lets a question carry several topic labels, which "don't structure anything". If Items match on topic: does a question keep several topics (it matches when the Item's topic is one of them) or get exactly one; is a topic required before Ready (D-042); and may an Item leave topic or type as "any"?
- **Answer:** Exactly one topic per question. An Item may leave topic or type as "any". (Answered 2026-11-24.)

## Q-047 · Are fixed values in a parameterised question marked too?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (math engine), P4b (DS-007 editor)
- **Context:** DS-007 marks values that change with {braces} in the statement: each is either drawn from an interval ("Intervale") or calculated from the drawn ones ("Valori calculate"); a fixed number is plain text. The user said fixed, random and calculated values "need to be marked". Option: fixed values are named too ({k} with one value), so all three kinds are listed and visible in the editor.
- **Answer:** Left to Claude's choice by the user: fixed values are named too ({k} with one value), so the editor lists fixed, random and calculated values side by side. (Answered 2026-11-24.)

## Q-048 · What can a value domain be?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (math engine), P4b (DS-007 editor)
- **Context:** D-043 allows min/max bounds with simple conditions (e.g. `a > b`), and DS-007 draws whole numbers. Open: whole numbers only, or also decimals (how many places) or a step (e.g. multiples of 5); a list of allowed values; excluded values (e.g. not 0).
- **Answer:** Whole numbers only, between min and max, with optional excluded values (e.g. not 0); simple conditions stay (D-043). (Answered 2026-11-24.)

## Q-049 · Must calculated values and the answer of a parameterised question be whole numbers?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (draw), P4b (preview)
- **Context:** Random values are whole numbers (Q-048), but a calculated value or the answer can come out non-whole through division (7 : 2 = 3,5; 1 : 3 = 0,333…). Options: reject such a draw and draw again (only whole results), or allow decimals up to a fixed number of places (shown with a comma) and reject only longer ones.
- **Answer:** Only whole results: a draw whose calculated value or answer isn't a whole number is thrown away and drawn again. (Answered 2026-11-24.)

## Q-050 · Which question types can use named values?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a, P4b
- **Context:** DS-007 shows values for a short-answer question with a numeric answer. Values could also appear in a Subject II problem statement (graded by hand, no computed answer), or in choice options (e.g. options {a}, {a + 1}, which then need distinct values).
- **Answer:** All three: short answer with a numeric answer, Subject II problem statements (no computed answer), and the options of choice questions. (Answered 2026-11-24.)

## Q-051 · Can the answer of a parameterised question be a fraction?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (answer matching)
- **Context:** D-017 accepts a fraction only in the form the Examiner expects. With drawn values the form must be computed (e.g. p/q simplified), which means choosing a rule for "the expected form".
- **Answer:** No. A parameterised question's answer is a number only. (Answered 2026-11-24.)

## Q-052 · Which operations can formulas use?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (whitelist, D-013)
- **Context:** The seed template says + - * / and parentheses. 6th-grade problems may also want powers (2³), the remainder of a division, or the absolute value.
- **Answer:** + − · : and parentheses only (`*`, `×` and `/` also accepted as the same operations). No powers, remainder or absolute value. (Answered 2026-11-24.)

## Q-053 · Where does an Examiner create competences, topics and pools?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** DS-007 shows only dropdowns and "+ Adaugă într-un set".
- **Answer:** Inline: each dropdown ends with "+ Competență nouă…" / "+ Temă nouă…" / "+ Set nou…", opening a small dialog. Renaming and deleting come later. (Answered 2026-11-24.)

## Q-054 · Who sets the code of a question created in the app?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** Seeded questions get the code written in questions.yaml (D-029).
- **Answer:** The Examiner types it when creating the question; it must be unique and can't be changed once saved. (Answered 2026-11-24.)

## Q-055 · What replaces DS-007's "Folosită în" column?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** Under D-057 exams draw from pools, not listed questions, so "used in N exams" is no longer a simple fact.
- **Answer:** The question's pools; a usage count may come back with P5. (Answered 2026-11-24.)

## Q-056 · Can a question be deleted?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** DS-007 has no delete action; attempt_items reference questions (restrict on delete).
- **Answer:** Yes, after a confirmation, as long as no Attempt has drawn it. (Answered 2026-11-24.)

## Q-057 · What happens when a Ready question is edited so it is no longer complete?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** D-059 lists what Ready needs.
- **Answer:** Saving is refused and the checklist shows what is missing; the Examiner moves it back to Draft explicitly ("Mută în ciorne"). (Answered 2026-11-24.)

## Q-058 · Can an Examiner take back an entry they published to the library?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** D-040: publishing makes a frozen copy; copies others made are theirs.
- **Answer:** Not in P4b. (Answered 2026-11-24.)

## Q-059 · Where does an Examiner see their exams?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** DS-008 is the builder of one exam ("← Examene"); no mock shows the list, and DS-006 (dashboard) is a draft for P11.
- **Answer:** A simple Examene list drawn as an extra DS-008 state: title, status, classes, availability window, "+ Examen nou". (Answered 2026-11-24.)

## Q-060 · What can change after an Exam is published?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** The roadmap locks the Items and classes once published.
- **Answer:** Only the title, the description and the end of the window (available_until). Duration, attempts and score policy are locked too. (Answered 2026-11-24.)

## Q-061 · Can an Exam be unpublished or deleted?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** Results and Attempts point to a published Exam.
- **Answer:** A draft can be deleted after a confirmation; a published Exam can't be unpublished or deleted. (Answered 2026-11-24.)

## Q-062 · What is the "departajare" label on DS-008's Item 9?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** Nothing in the ledger defines it.
- **Answer:** Dropped; difficulty already shows "Dificil". (Answered 2026-11-24.)

## Q-063 · Which competences should an Exam cover (DS-008 coverage warning)?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** DS-008 warns about a competence with no Item.
- **Answer:** Every competence of the Examiner that has at least one Ready question for the Exam's grade level; a missing one is a warning, not a block. (Answered 2026-11-24.)

## Q-064 · Where do Candidates see an Exam's description?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7 (Candidate dashboard DS-003, exam room DS-004)
- **Context:** An Exam has an optional description, edited in the builder (DS-008 "Setări", added 2026-11-25). No Candidate screen shows it yet. Options: on the dashboard card, on the screen before the Attempt starts, or nowhere (a note for the Examiner only).

- **Answer:** On the exam card on the Candidate dashboard, under the title, as the DS-003 mock shows. (Answered 2026-11-25.)
## Q-065 · Is P6 built in one piece?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6
- **Context:** P6 covers the whole attempt engine plus Subject II photo uploads, which need ImageMagick in the Docker image, an S3 library and an object storage account (D-048).
- **Answer:** Split in four: P6a start and draw (twist: reproducible parameters), P6b timer, autosave and submit (twist: server timer), P6c Subject I grading, P6d Subject II photos and storage. (Answered 2026-11-25; first in two, then split further.)

## Q-066 · Which object storage provider holds Subject II photos in production?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6d
- **Context:** D-048 left the provider to P6. Candidates: Supabase Storage (1 GB free, S3-compatible) or Cloudflare R2 (10 GB free, may need a payment card). The free tiers are to be verified before choosing. The user creates the account; its keys go in Render's settings, never in the repo. Needed by about 28 Nov for the 30 Nov pilot (Q-039).
- **Answer:** Cloudflare R2, set up by the user on 2026-11-26: a private bucket and an API token limited to it; the keys only in Render's settings (`AWS_*`, Laravel's `s3` disk), never in the repo or the conversation. (Answered 2026-11-26.)

## Q-067 · Who sets up the external cron that seals expired Attempts?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6b (sealing endpoint), P12 (pilot)
- **Context:** D-044 needs a free external service calling a secret-protected endpoint every few minutes; reads seal expired Attempts anyway, so correctness doesn't depend on it.
- **Proposed answer:** P6b builds the endpoint (secret in Render's settings); after deploy the user creates a free cron-job.org job calling it every 5 minutes, with steps provided.
- **Answer:** Yes, cron-job.org; it can be removed later (sealing on read keeps results correct without it). Chosen also to keep the free API awake for the pilot, the demo and the evaluation. (Answered 2026-11-25.)

## Q-068 · What separates the "started" and "in_progress" Attempt states?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6b (state machine)
- **Context:** The schema has started, in_progress, submitted, graded.
- **Proposed answer:** "started" when the Attempt is created, "in_progress" from the first saved answer, so the Examiner can tell who opened the exam but answered nothing.
- **Answer:** Yes, as proposed (confirmed in the P6b plan, 2026-11-25).

## Q-069 · Which labels does an exam card on the Candidate dashboard show?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7 (DS-003)
- **Context:** The approved DS-003 mock shows competence codes and topics ("C3 · C4 · Geometrie"); the API sends neither.
- **Answer:** Only the topics of the exam's Items; no competence codes. (Answered 2026-11-25.)

## Q-070 · Does P7 include Subject II photos and the submitted-exams table?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7 (DS-003, DS-004)
- **Context:** Photo uploads need P6d and a storage provider (Q-066); the DS-003 "Examene predate" table shows scores, which come with P9.
- **Answer:** P7 is built without the photo block (P6d adds it as the approved DS-004 shows) and without the "Examene predate" table (it comes with P9). (Answered 2026-11-25.)

## Q-071 · Is P7 built in one piece?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7
- **Context:** P7 covers two screens, an offline-safe answer queue, a server-synced timer, API additions, mock additions and the catalog's refresh and lost-connection tests.
- **Answer:** Split in four, built in order before the 30 Nov pilot: P7a dashboard (DS-003, join dialog, exam-list API additions), P7b exam room reading and answering (DS-004 additions, inputs, navigation, navigator, mark for review, direct saving), P7c timer and submit, P7d offline and resume (answer queue, resume, Playwright refresh and lost-connection tests). (Answered 2026-11-25; first in three, then P7b split further.)

## Q-072 · How many items does the exam room show at once?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7b (DS-004)
- **Context:** The approved DS-004 mock shows items 3 and 4 together in Subject I but item 8 alone in Subject II.
- **Answer:** One item per screen, in both Subjects; "← Itemul n" / "Itemul n →" move between items and the navigator jumps to any item. (Answered 2026-11-25.)

## Q-073 · Does the delivered app move from Render to AWS?
- **Status:** open
- **Date:** 2026-11-26
- **Blocks:** P12 (delivery: the live URL on 3 Dec)
- **Context:** The user's professor requires AWS for the delivered app (live on AWS for the 3 Dec delivery; the 30 Nov pilot may stay on Render). The user chose their own new AWS account and "an AWS server with Cloudflare R2". Drafted, not yet approved: a PROPOSAL superseding D-014 (a new decision, not numbered yet): one EC2 server (Frankfurt) with Docker Compose (the production API image, PostgreSQL 16 with a nightly backup to R2, Caddy serving the SPA and HTTPS), deploys from GitHub Actions, data moved from Render on 1 Dec. Two choices open: HTTPS through CloudFront, a bought domain or a free IP-name domain; the sealing cron on the server (updating D-044) or cron-job.org. Parked by the user on 2026-11-26 to finish the build first.

## Q-074 · How does questions.yaml get into the live bank?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P4c
- **Context:** The repo is public, so committed answer keys can be read by pilot Candidates; Render's free plan has no server shell; D-059 decides when a question can be Ready.
- **Answer:** questions.yaml is committed (no .gitignore), knowing its answer keys are public. A question that is well-formed but incomplete loads as Draft, with what it still needs listed; complete ones load as Ready. The live load runs from the user's machine with `app:load-questions <email>` against the live database URL (read with `read -s`, `sslmode=require`). (Answered 2026-11-26.)

## Q-075 · How is a Subject II Item graded when its question's points differ from the Item's?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** P5 lets an Item's points be any positive value (only the Subject totals are checked), but a barem adds up to the question's own points (D-031).
- **Answer:** A fixed Subject II structure: 3 problems of 20 points, and Subject II questions are Ready only at 20 points, so the barem and the Item always match (D-062). (Answered 2026-11-26.)

## Q-076 · When may the Examiner publish an exam's results?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** Publishing can't be undone (D-019); the DS-009 mock says publishing waits until all submissions are graded.
- **Answer:** When every submitted Attempt is graded, no Attempt is still running, and the exam's availability window has closed. (Answered 2026-11-26.)

## Q-077 · Is P8 built in one piece?
- **Status:** answered
- **Date:** 2026-11-26
- **Confirmed:** 2026-11-27
- **Blocks:** P8
- **Context:** P8 is large and Subject II grading happens on 1 Dec (Q-039).
- **Answer:** No. P8a: grading and publishing results (now). P8b: the Candidate's results page (DS-005 mock confirmed first), right after. P8c: answer-key correction recalculation (D-046), after the pilot. (Answered 2026-11-26.)

## Q-078 · Which DS-009 parts may be cut to save time?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** The approved DS-009 mock has a "Pe item" and a "Pe candidat" view and an "Editează baremul" action.
- **Answer:** None: both views are built, and the barem is edited inline on the grading screen, as in the mock. (Answered 2026-11-26.)

## Q-079 · Do answers marked for re-check block publishing results?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** Q-076 requires every submitted Attempt to be graded; a barem edit can flag graded answers for re-check (D-031).
- **Answer:** Yes (user, 2026-11-27): an answer marked for re-check blocks publishing results until the Examiner grades it again. Needs a C-007 change (a `recheck` reason in `missing`) and DS-009 copy.

## Q-080 · Can an exam without an end date publish its results?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** Q-076 requires the availability window to have closed; `available_until` may be empty.
- **Answer:** No (user, 2026-11-27): before publishing, the Examiner must set an end date ("Disponibil până la") first; publishing never sets it for them. Matches the code (`window_open` when `available_until` is empty or in the future); DS-009 needs copy for the no-end-date case.

## Q-081 · Is "Disponibil până la" locked once results are published?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8a
- **Context:** Q-060 keeps `available_until` editable after an exam is published (`ExamController::EDITABLE_WHEN_PUBLISHED`). After results are published, clearing it or moving it into the future reopens the exam while grades (and later answer keys) are visible.
- **Answer:** Yes (user, 2026-11-27): once results are published, `available_until` is locked; title and description stay editable. Before results are published nothing changes (Q-060). Needs a C-005 change.

## Q-082 · What does a Candidate see for each Subject I item after results are published?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** The question as they saw it, their answer, the correct answer, the points, and the question's explanation when it has one (the editor already promises it after publication). (User, 2026-11-27.)

## Q-083 · What does a Candidate see for each Subject II problem after results are published?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** Their written steps and their own photos, the points out of 20, the Examiner's comment, and the barem steps with the points earned on each; one score when the question has no barem. (User, 2026-11-27.)

## Q-084 · Which Attempts does the results page show when an Exam allowed several?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** All of the Candidate's Attempts at the Exam, each with its grade, the one that counts under the score policy (D-012) marked; each can be opened. (User, 2026-11-27.)

## Q-085 · Does a Candidate see class statistics with their results?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** No. Only their own grade, points and comments, plus the cohort note (D-019); the mean and median stay on the Examiner's grading screen. (User, 2026-11-27.)
