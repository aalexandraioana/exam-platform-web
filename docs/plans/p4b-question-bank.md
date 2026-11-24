# Plan — P4b: question bank (DS-007)

Status: approved 2026-11-24 (C-004, the knowledge entries and the assumptions) · Covers D-027, D-031, D-040, D-041, D-057, D-058, D-059, D-060 ·
Q-053–Q-058 answered · Builds on P4a (`app/Support/Math`)

## Size
L. A schema change, a new API contract (C-004) with about 20 endpoints, the largest screen so far,
and mock additions. Split in three parts.

## Approach
**Part 1 · backend.** Migration for D-058/D-059: `topic_labels` becomes `topics` (same columns),
questions get `topic_id`, the link table goes, and Postgres' Ready check also needs `topic_id`.
A new `QuestionController` (same shape as `ClassController`: everything looked up through the
signed-in Examiner, so another Examiner's question is a 404) and a `Readiness` class that lists what
a question still needs for Ready (D-059) as codes (PATTERN-005): the fields, the answer key's shape
per type, a complete barem when used (D-031), and P4a's `ValueDefinitions` plus one test draw
(`no_valid_draw`). Preview and "Testează un răspuns" call P4a's `ValueDrawer` and `AnswerMatcher`
on the unsaved editor content, so the rules live in one place (server). Competences, topics and
pools: list and create (Q-053). Library: publish a Ready question as a frozen copy, browse, copy
into one's bank (D-040).

**Part 2 · mock additions to DS-007** (confirmed before Part 3): the answer editors for true/false,
single and multiple choice, number and fraction; a new empty question (code + subject + type);
the explanation field; the inline "+ … nouă" dialogs (Q-053); the pools column (Q-055);
"Șterge" with its confirmation (Q-056); "Mută în ciorne" and a refused save (Q-057); copying from
the library (asks for the new code, Q-054).

**Part 3 · frontend.** `QuestionBankPage` at `/examiner/questions`, a "Bancă de întrebări" link in
the Examiner's nav, built from the confirmed DS-007 with existing components (DS-015, DS-017),
PATTERN-002 selects, maths in JetBrains Mono (D-060).

Rejected: computing Ready on the client only (the server must refuse an incomplete Ready, D-059);
a separate screen for competences, topics and pools (Q-053); pagination (a bank holds tens to a few
hundred questions; filtering is server-side and the list is light: no statements beyond a preview).

## API (C-004, docs/API.md → Question bank) · Examiner only, own data
| Method · path | What |
|---|---|
| `GET /questions` | own bank (not library entries); filters `search` (code or text), `competence_id`, `topic_id`, `pool_id`, `type`, `section`, `grade_level`, `difficulty`, `status`; each row: code, statement start, competence code, topic, pools, status |
| `POST /questions` | `code` (unique, Q-054), `section`, `type` → 201 Draft |
| `GET /questions/{id}` | everything, plus `problems` (what Ready still needs) |
| `PATCH /questions/{id}` | any field except code/status; `pool_ids`; `barem` steps; a Ready question that would become incomplete → 422 `not_ready` with `problems` (Q-057) |
| `POST /questions/{id}/ready` · `/draft` | mark Ready (422 `not_ready` + problems) · back to Draft |
| `DELETE /questions/{id}` | 204; 409 `question_drawn` once an Attempt has drawn it (Q-056) |
| `POST /questions/preview` | unsaved type, statement, options, parameters → `problems` and 3 sample draws (random seeds) |
| `POST /questions/check-answer` | unsaved type, answer key, (parameters), a typed answer → `accepted` |
| `GET, POST /competences` · `/topics` · `/pools` | list; create (`code` + `description` / `name`; 422 `taken`) |
| `POST /questions/{id}/publish` | Ready only (422 `not_ready`); frozen copy coded `LIB-<code>`; 409 `already_published` |
| `GET /library` | every published entry, with author name; same filters |
| `POST /library/{id}/copy` | `code` → 201 a Draft-or-Ready copy in one's bank, `copied_from_id` set; the entry's competence (by code) and topic (by name) are added to one's lists if missing (D-040) |

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/database/migrations/2026_11_25_*_one_topic_per_question.php` | topics, `questions.topic_id`, Ready check (D-058, D-059) |
| rename/edit | `backend/app/Models/TopicLabel.php` → `Topic.php`; `Question.php`, `User.php`, factories | relations |
| add | `backend/app/Http/Controllers/QuestionController.php`, `LibraryController.php`, `CompetenceController.php`, `TopicController.php`, `PoolController.php` | C-004 |
| add | `backend/app/Http/Requests/Questions/*` | validation, codes (PATTERN-005) |
| add | `backend/app/Support/Questions/Readiness.php` | D-059 problems |
| add | `backend/app/Http/Resources/QuestionResource.php` (+ summary) | |
| edit | `backend/routes/api.php` | role:examiner, password.current |
| edit | `backend/tests/Feature/Schema/QuestionBankSchemaTest.php` | **changed assertions**: one topic, Ready needs a topic (D-058/D-059 replace what they test) |
| add | `backend/tests/Feature/Questions/*Test.php` | below |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md` (C-004), `docs/agents/ARCHITECTURE.md` | |
| edit | `docs/design/mocks/DS-007.html` | Part 2 |
| add | `frontend/src/api/questions.ts`; `frontend/src/pages/examiner/QuestionBankPage.tsx` (+ editor parts) and tests | Part 3 |
| edit | `frontend/src/App.tsx`, `components/AppHeader.tsx`, `i18n/*.json` | route, nav link, RO/EN |
| add | `frontend/e2e/questions.spec.ts` | DS-007 screenshots |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | Migration: one topic per question; Ready refused without a topic; topic names unique per Examiner ignoring case | Pest · schema |
| 2 | Create: code required, unique, unchangeable; Draft with only section and type; type must match section | Pest |
| 3 | List: own questions only (no library entries, no other Examiner's), each filter, search by code or text | Pest |
| 4 | Readiness per type: missing fields, bad answer keys (no correct option, out of range, duplicate options, empty accepted list, bad number/fraction), barem sum ≠ points, value problems, `no_valid_draw` | Pest · unit + feature |
| 5 | Ready / Draft / refused save of an incomplete Ready question (Q-057) | Pest |
| 6 | Pools on a question; create competence / topic / pool; `taken` | Pest |
| 7 | Preview: problems and 3 draws; check-answer: number, fraction, text, choice, parameterised | Pest |
| 8 | Delete: allowed when never drawn; 409 when drawn (Q-056) | Pest |
| 9 | Library: publish only Ready, `LIB-` code, frozen after the source is edited, 409 twice; copy brings competence and topic, keeps `copied_from_id` | Pest |
| 10 | Another Examiner's question, pool, competence: 404; Candidate/Administrator: 403 | Pest |
| 11 | Screen: list and filters, open a question, edit and save, each answer editor, values with samples, test an answer, Ready checklist, new question, delete, library copy, errors | Vitest |
| 12 | DS-007 screenshots, light/dark, 1440/320 | Playwright |

## Design
DS-007 (approved) plus the Part 2 additions, drawn and confirmed before Part 3. Tokens only; states:
empty bank, empty library, loading, load error, save error, long statements and names, 320 px.

## Sequencing
Part 1 and Part 2 in parallel (disjoint files). Part 3 after you confirm Part 2.

## Risks
- Size against the schedule (the pilot is 30 Nov): Part 1 alone lets P4c load your questions
  and P5/P6 draw them, so the screen can't hold the twist back. If time runs short, Part 3 ships
  the list, editor and Ready first and the library last.
- The topic migration changes a P1b table; no question exists yet in any database, so nothing is
  lost (checked before running it on Render).
- "Never drawn" for delete depends on attempt_items, which P6 fills; until then every question is
  deletable.

## Out of scope
Renaming or deleting competences, topics and pools (Q-053); withdrawing library entries (Q-058);
a usage count (Q-055, maybe P5); the seeder (P4c); exam Items (P5).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-027 | Private banks, shared library, copies are the copier's | library | confirm |
| D-031 | Optional barem for Subject II | barem editor, Readiness | confirm |
| D-040 | Library entries are frozen copies; copying brings competence and topic | publish/copy | confirm |
| D-041 | One bank per Examiner, pools inside | pools | confirm |
| D-022, D-033, D-035, D-050, D-057, D-058, D-059, D-060, PATTERN-005 | confirmed 2026-11-24 | | — |
| PATTERN-002 | Styled native select (candidate) | filters, editor | confirm |
| PATTERN-003 | Tokens-only Tailwind theme (candidate) | screen | confirm |
| PATTERN-004 | Fixed data rules as Postgres constraints (candidate) | Ready check with topic | confirm |
| PATTERN-006 | Account state blocks the app (candidate) | routes sit inside `password.current` | confirm |
| C-001 | Auth API | unchanged; routes behind it | confirm |
| Q-053–Q-058 | your answers today | scope above | answered |

### Assumptions (no entry behind them)
- A library entry's code is `LIB-` + the source code; a question can be published once.
- Copying asks for the new code (Q-054) and keeps the entry's status (a copy of a Ready entry is Ready).
- The topic RO term in the API is `topic` (CONTEXT.md: Temă); the table is renamed to `topics`.
