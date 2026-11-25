# Plan — P6a: start and draw (twist part 2: reproducible parameters)

Status: approved 2026-11-25 (C-006 part 1, D-028, the assumptions) · Covers D-006, D-012, D-015, D-021, D-045, D-057 · Q-065 answered ·
next: P6b (timer, autosave, submit), P6c (Subject I grading), P6d (photos)

## Size
M. One new contract (C-006, first part), the start service and its snapshot, two read endpoints.
Backend only.

## Approach
- **The Candidate's exams** (D-015): Exams published to classes where the Candidate's place is
  accepted. Each shows its window, the attempts allowed and used, a `state` and `can_start`:
  - state: upcoming until `available_from`, closed from `available_until`, open in between
  - `can_start`: open, attempts left, none still open
- **Start** (`Support/Attempts/Starter`), in one transaction:
  - checks: published to one of the Candidate's accepted classes, open now, fewer Attempts than
    `max_attempts` (D-012), and no Attempt still open (that one is returned to be resumed)
  - a random seed, kept on the Attempt
  - `Blueprint::assign(exam, seed)` (P5) gives every Item its own question (D-057)
  - per Item, with a seed derived from the Attempt's seed and the Item's position:
    - values drawn with `ValueDrawer` (P4a), so the statement and options are filled
    - options shuffled (D-045)
  - one `attempt_items` row per Item:
    - `question_snapshot`: exactly what the Candidate sees (section, type, points, statement,
      options in their shown order)
    - `drawn_values`
    - `expected_answer`: the answer key, the option order and the drawn answer; never sent to
      the Candidate
  - `expires_at` = start + the Exam's full duration (D-021); the grace period comes in P6b
  - status `started` (transitions: P6b)
- **Reproducibility** (the twist): `Starter::snapshot(exam, seed)` is a pure function of the
  Exam, its questions and the seed. A test rebuilds an Attempt's snapshot from its stored seed and
  gets exactly what was stored, which is what a contest needs (D-006).
- **Reading an Attempt**: the Candidate's own only. It returns the status, `started_at`,
  `expires_at`, `server_time`, the exam title and the items as shown. It never returns the answer
  key, the drawn answer or a score.

Rejected:
- drawing at each read (a refresh would change the questions)
- storing only the seed (D-006 asks for the concrete values; the snapshot is also stored)
- shuffling on the client (the order must be the same after a refresh, and stored for contests)

## API (C-006, docs/API.md → Attempts) · active Candidate with a current password, own data
| Method · path | What |
|---|---|
| `GET /candidate/exams` | `{exams: [{id, title, description, duration_minutes, available_from, available_until, max_attempts, attempts_used, state, open_attempt_id, can_start, results_published}]}` |
| `POST /candidate/exams/{id}/attempts` | 201 `{attempt}`; `409 attempt_open` with `attempt_id`; `409 no_attempts_left`; `409 not_available` (upcoming or closed); 404 when not published to the Candidate's accepted classes |
| `GET /attempts/{id}` | `{attempt: {id, exam: {id, title}, status, attempt_number, started_at, expires_at, server_time, items: [{position, section, type, points, statement, options}]}}`; another Candidate's Attempt → 404 |

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Support/Attempts/Starter.php` | eligibility, seed, draw, snapshot |
| add | `backend/app/Http/Controllers/CandidateExamController.php`, `AttemptController.php`, `Resources/AttemptResource.php` | C-006 part 1 |
| edit | `backend/routes/api.php` | `role:candidate` routes inside `password.current` |
| edit | `backend/app/Models/Attempt.php`, `Exam.php`, `User.php` | relations and helpers (open Attempts, published for a Candidate); comments to current IDs |
| add | `backend/tests/Feature/Attempts/StartTest.php`, `CandidateExamsTest.php`, `ReadTest.php` | below |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md` (C-006), `ARCHITECTURE.md` | |

## Tests (Pest, written first)
| # | Behaviour |
|---|---|
| 1 | List: only published Exams of the Candidate's accepted classes (not pending, declined, drafts, other classes); state upcoming / open / closed; attempts used; `can_start`; `open_attempt_id` |
| 2 | Start refused: upcoming, closed, no attempts left, not a member (404), Examiner (403); an open Attempt → `409 attempt_open` with its id |
| 3 | Start: attempt number, seed, `expires_at` = start + duration even when `available_until` is sooner (D-021), status started |
| 4 | Draw: every Item a distinct question (D-057), as many rows as Items, positions in blueprint order |
| 5 | Values: a parameterised question's statement and options are filled; `drawn_values` and the drawn answer stored |
| 6 | Shuffle: options appear in a stored order; the answer key stays in original positions; over many seeds the orders vary |
| 7 | Reproducible: `Starter::snapshot(exam, seed)` rebuilds exactly the stored snapshot, values and order |
| 8 | Reading: own Attempt only (another Candidate's → 404); no answer key, drawn answer or score anywhere in the response |
| 9 | A second Attempt after the first one is submitted, when `max_attempts` allows |

## Design
None (P7 builds DS-003 and DS-004).

## Sequencing
One builder.

## Risks
- Until P6b, an Attempt past its deadline still counts as open (sealing comes in P6b). There is no
  Candidate screen before P7, so nobody meets this in between.
- If a published Exam can't be drawn any more (e.g. its questions were moved to Draft after
  publishing), start answers `409 not_available` instead of failing; the Examiner sees it in the
  preview.

## Out of scope
Answers, autosave, the timer's refusal, submitting, sealing (P6b); grading (P6c); photos (P6d);
screens (P7).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-006 | Concrete values stored per Attempt | snapshot and drawn values | confirmed 2026-11-24 |
| D-012 | Attempt limit per Exam | `max_attempts` | confirmed 2026-11-24 |
| D-015 | Only the Candidates of the Exam's classes see it | list and start | confirmed 2026-11-24 |
| D-021 | Full duration per Attempt | `expires_at` | confirmed 2026-11-24 |
| D-045 | Options shuffled per Attempt, order stored | shuffle | confirmed 2026-11-24 |
| D-057 | A distinct question per Item, matched by criteria | `Blueprint::assign` | confirmed 2026-11-24 |
| D-028 | Join requests accepted by the Examiner | only accepted places count | confirm |
| D-019 | Nothing scored shown before publication | read endpoint shows no key or score | confirmed 2026-11-24 |
| C-005 | Exams API, `Blueprint` | reused server-side; unchanged | confirmed 2026-11-24 |
| PATTERN-005, PATTERN-006 | Codes; blocked until the password is changed | errors; routes inside `password.current` | confirmed 2026-11-24 |
| Q-065 | P6 split in four | scope | answered |

### Considered, not applied
- D-004 (grace period), D-044 (sealing): P6b. Q-067, Q-068: P6b.

### Assumptions (no entry behind them)
- `available_from` is inclusive and `available_until` exclusive.
- An open Attempt can be resumed from any device (the server holds all state).
- The Item's points (not the question's) are the points shown and scored.
