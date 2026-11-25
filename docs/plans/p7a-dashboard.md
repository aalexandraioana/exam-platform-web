# Plan — P7a: Candidate dashboard (DS-003) and joining a class

Status: proposed 2026-11-25 · Covers D-015, D-019, D-022, D-028, D-038 · Q-064, Q-069, Q-070,
Q-071 answered · Builds on C-006 (P6a–P6c), C-002 (joining) · next: P7b, P7c, P7d

## Size
M. A few additive fields on the exam list, DS-003 mock additions to confirm first, one page and
one dialog.

## Approach
**Part 1 · API (C-006, additive).** `GET /candidate/exams` adds:
- a top-level `server_time`
- per exam:
  - `topics`: the distinct topic names of the exam's Items ("any" adds none) (Q-069)
  - `item_counts`: `{subject_1, subject_2}`
  - `open_attempt`: `{id, started_at, expires_at}` or null (beside `open_attempt_id`)
  - `submitted`: whether the Candidate has a submitted Attempt of this exam (D-019 status)

**Part 2 · DS-003 mock additions** (confirmed by you before Part 3):
- **The exam cards by state:**
  - in progress, as approved
  - open: "Începe examenul"
  - upcoming: "Se deschide pe …", no button
  - submitted with no attempt left: "Predat · se corectează" (D-019)
  - submitted with attempts left: the status and "Începe din nou"
- **Topic chips only** (Q-069). **No "Examene predate" table** (Q-070).
- **Empty states:** not in any class yet; in a class, no exams.
- **The "Am un cod de clasă" dialog** (D-028, `POST /memberships`):
  - code field
  - its answers: request sent (wait for the Examiner), already in that class, code not found,
    declined earlier (`409 already_decided`)

**Part 3 · the page** at `/candidate`, replacing `PlaceholderHome`:
- Built from the confirmed DS-003 with existing components (Alert, Button, Modal, DialogActions,
  TextField) and the Examiner pages' loading and error states.
- The in-progress card's remaining time comes from `server_time`, not the device clock; it updates
  every minute.
- **Start:** `POST …/attempts`, then go to `/candidate/attempts/:id`.
  - `409 attempt_open` goes to the returned Attempt.
  - `no_attempts_left` and `not_available` show their message and reload the list.
- **Resume:** goes to `/candidate/attempts/:id`.
- The exam room at that address is P7b. Until P7b is merged, the address shows a short loading
  state and goes back to the dashboard (no new screen).

Rejected:
- the description on a separate screen (Q-064: on the card)
- competence codes on the card (Q-069)

## API (C-006 additions)
| Endpoint | Added |
|---|---|
| `GET /candidate/exams` | `server_time`; per exam `topics`, `item_counts`, `open_attempt`, `submitted` |

Consumers: `frontend/src/api/attempts.ts` (new, this plan). C-002 (`POST /memberships`) unchanged,
new consumer `frontend/src/api/classes.ts` (`joinClass`).

## Files
| Action | Path | What |
|---|---|---|
| edit | `backend/app/Http/Controllers/CandidateExamController.php` | the new fields |
| edit | `backend/tests/Feature/Attempts/CandidateExamsTest.php` | Part 1 tests |
| edit | `docs/design/mocks/DS-003.html`, `docs/design/registry.yaml` | Part 2 |
| add | `frontend/src/api/attempts.ts` | list, start |
| edit | `frontend/src/api/classes.ts` | `joinClass(code)` |
| add | `frontend/src/pages/candidate/DashboardPage.tsx`, `ExamCard.tsx`, `JoinClassDialog.tsx` (+ tests) | Part 3 |
| edit | `frontend/src/App.tsx`, `i18n/ro.json`, `en.json` | route, texts |
| delete | `frontend/src/pages/PlaceholderHome.tsx` | only the Candidate route uses it |
| edit | `frontend/e2e/mockApi.ts`, `frontend/e2e/screens.spec.ts` (or add `candidate.spec.ts`) | DS-003 screenshots |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md` (C-006), `ARCHITECTURE.md`, roadmap | |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | `topics` distinct, none for "any"; `item_counts` per Subject; `open_attempt` with its times; `submitted` true after submitting (and after sealing); `server_time` | Pest |
| 2 | Cards per state: in progress (remaining time from `server_time`, with a device clock 10 min off), open, upcoming, submitted with and without attempts left; description and topic chips; no competence codes | Vitest |
| 3 | Start goes to the new Attempt; `attempt_open` goes to the returned one; `no_attempts_left` / `not_available` show their message and reload; resume goes to the open Attempt | Vitest |
| 4 | Empty (no class / no exams), loading, error with retry, long titles | Vitest |
| 5 | Join dialog: request sent, already a member, not found, declined; the list reloads after joining | Vitest |
| 6 | DS-003 screenshots, light/dark, 1440/320, each confirmed state | Playwright |

## Design
DS-003 (approved) plus the Part 2 additions, drawn and confirmed before Part 3. Tokens only,
Lucide icons (D-033), RO default and EN (D-022, D-038), dialog buttons in halves (PATTERN-008),
keyboard focus, 320 px to 1440 px.

## Sequencing
Part 1 ∥ Part 2; Part 3 after you confirm Part 2. One builder.

## Risks
- Merging P7a before P7b: Candidates could start an Attempt with no exam room to show it. The
  Attempt's timer runs and seals it at its deadline. Nobody uses the live site before the pilot,
  so merging is safe; just don't start a real exam on the live site until P7b is merged.

## Out of scope
The exam room (P7b), timer and submit (P7c), offline and resume (P7d), results and the
"Examene predate" table (P9), photos (P6d).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| C-006 | Attempts API | the additive fields above; consumer `api/attempts.ts` | **confirm the additions** |
| D-028 | join with a code, the Examiner accepts | the join dialog | **confirm** |
| C-002 | Classes API, `POST /memberships` | reused unchanged | **confirm** |
| PATTERN-008 | dialog buttons in equal halves | the join dialog | candidate (from today) |
| Q-064, Q-069, Q-070, Q-071 | your answers today | description on the card, topics only, no table, the split | answered |
| 10 entries confirmed before, unchanged: D-015, D-019, D-021, D-022, D-033, D-038, D-052, PATTERN-002, PATTERN-003, PATTERN-005 | | the Candidate's classes' exams; "submitted, awaiting grading"; full duration; RO/EN; Lucide; noindex; select; tokens; error codes | — |

### Considered, not applied
- D-004 (timer), D-045 (shuffle), D-060 (maths font): P7b/P7c. D-012 score policy: P9.
- Q-041 (asking again after a decline): still open, so the dialog only says the request was
  declined and to ask the Examiner.

### Assumptions (no entry behind them)
- A closed exam the Candidate never started is not shown.
- A closed exam with a submitted Attempt keeps its "Predat · se corectează" card (until P9 shows
  results).
- The in-progress card's remaining time updates every minute (the exam room shows seconds).
