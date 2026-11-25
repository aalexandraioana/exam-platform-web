# Plan — P6b: timer, autosave, submit, sealing (twist part 1, server side)

Status: approved 2026-11-25 (Q-068, the C-006 extension, the assumptions) · Covers D-004, D-021, D-044, D-012, D-019 ·
Q-067 and Q-068 answered · Builds on P6a (C-006 part 1) · next: P6c (Subject I grading), P6d (photos), P7 (screens)

## Size
M. Extends C-006 (save, submit, sealing; answers in the read), one state machine, one sealing
service with a command, a schedule and a protected endpoint. Backend only.

## Approach
- **State machine** (catalog: "transitions validated on the server; a test for every invalid
  transition"). One place, `Attempt::moveTo(status)`, allows exactly:
  `started → in_progress`, `started → submitted`, `in_progress → submitted`, `submitted → graded`
  (graded is used from P8). Anything else throws `InvalidTransition`, so no code path can skip it.
  - `started` until the first saved answer, then `in_progress` (Q-068 as proposed).
- **The deadline** (D-004, D-021): an Attempt accepts answers until `expires_at` + the Grace Period.
  The grace is `config('attempts.grace_seconds')`, 30 by default, from `ATTEMPT_GRACE_SECONDS`
  (the catalog asks for a configurable grace). Every check uses the server's clock only.
- **Autosave** (catalog: "idempotent, handles answers arriving out of order, a version per answer"):
  `PUT /attempts/{id}/items/{position}/answer` with `{answer, marked_for_review, version}`.
  - The client numbers its saves per answer (1, 2, 3…). The server stores a save only when its
    `version` is higher than the stored one (compared under the Attempt's row lock), so a repeated or late
    save changes nothing and still answers 200 with what is stored (`applied: false`).
  - The answer's shape is checked per type: true/false a boolean, single choice a shown position,
    multiple choice distinct shown positions, short answer a string (≤ 200 characters), a Subject II
    problem its step-by-step text (≤ 10 000 characters); `null` clears it.
  - Refused: after the deadline + grace → `409 time_up` (the Attempt is sealed in the same
    request); after submitting → `409 attempt_submitted`.
- **Submit**: `POST /attempts/{id}/submit` → `submitted`, `submitted_at` now. Repeating it answers
  200 with the same Attempt (idempotent). After the deadline + grace it seals instead
  (`auto_submitted`, `submitted_at` = `expires_at`) and also answers 200: saves already accepted
  count, nothing is lost.
- **Sealing** (D-044), `Support/Attempts/Sealer`: open Attempts past `expires_at` + grace become
  `submitted`, `auto_submitted = true`, `submitted_at = expires_at`, in one update.
  - On read: before every C-006 request (the exam list, start, read, save, submit) the Candidate's
    expired Attempts are sealed. This also lifts P6a's limitation: an expired Attempt no longer
    blocks a new start.
  - Scheduled: an `attempts:seal-expired` command, scheduled every 5 minutes in `routes/console.php`
    (runs wherever a scheduler runs, e.g. `php artisan schedule:work` locally).
  - External (Q-067): `POST /api/cron/seal-expired` with the header `X-Cron-Secret`, compared with
    `CRON_SECRET` in constant time. With no secret configured it answers 404. It runs the same
    Sealer and returns `{sealed: n}`. cron-job.org calls it every 5 minutes after deploy.
- **Concurrency**: save, submit and sealing lock the Attempt's row first, so a save racing a submit
  is either stored before the submit or refused after it, never half-applied.
- **Reading** (`GET /attempts/{id}`) adds, per item, the saved answer
  (`{value, version, marked_for_review, saved_at}` or null), plus `submitted_at` and
  `auto_submitted`, so a refresh or another device resumes exactly where the Candidate stopped.
  Still no key, score or seed (D-019).

Rejected:
- a timestamp instead of a version (client clocks differ; the catalog asks for a version)
- refusing a stale save with an error (a retry queue would loop on it; 200 + `applied: false` is idempotent)
- answering 409 to a late submit (the Candidate's work is already sealed; an error would suggest it was lost)
- triggering `schedule:run` over HTTP (the endpoint calls the Sealer directly; same result, less moving parts)

## API (C-006, docs/API.md → Attempts) · active Candidate, own Attempts
| Method · path | What |
|---|---|
| `PUT /attempts/{id}/items/{position}/answer` | `{answer, marked_for_review, version}` → 200 `{answer: {value, version, marked_for_review, saved_at}, applied, status}`; 422 `invalid_answer` / validation; 409 `time_up`, `attempt_submitted`; 404 unknown position or another Candidate's Attempt |
| `POST /attempts/{id}/submit` | 200 `{attempt}`; idempotent; late → sealed |
| `GET /attempts/{id}` | as P6a, plus `submitted_at`, `auto_submitted`, `items[].answer` |
| `POST /cron/seal-expired` | header `X-Cron-Secret` → 200 `{sealed}`; wrong secret 403; no secret set 404 |

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Support/Attempts/Sealer.php`, `Saver.php`, `InvalidTransition.php` | sealing, versioned save, the transition error |
| add | `backend/config/attempts.php` | `grace_seconds` (env `ATTEMPT_GRACE_SECONDS`, 30) |
| edit | `backend/app/Models/Attempt.php` | `moveTo()`, `acceptsAnswersUntil()` |
| edit | `backend/app/Http/Controllers/AttemptController.php`, `CandidateExamController.php`, `Resources/AttemptResource.php` | save, submit, seal on read, answers in the read |
| add | `backend/app/Http/Controllers/CronController.php` | endpoint (the command is defined in `routes/console.php`, as built) |
| edit | `backend/routes/api.php`, `routes/console.php` | routes; schedule every 5 minutes |
| edit | `backend/.env.example` | `ATTEMPT_GRACE_SECONDS=30`, `CRON_SECRET=` (empty; the real one only in Render's settings) |
| add | `backend/tests/Unit/Attempts/TransitionsTest.php`, `tests/Feature/Attempts/SaveTest.php`, `SubmitTest.php`, `SealTest.php` | below |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md` (C-006), `ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | |

Consumers of C-006: none on disk yet (P7 adds `frontend/src/api/attempts.ts`); the change is additive.

## Tests (Pest, written first)
| # | Behaviour | Test |
|---|---|---|
| 1 | The four allowed transitions; **each of the 12 invalid ones** (incl. same-state and back from graded) throws | Unit · TransitionsTest |
| 2 | First save: `started → in_progress`; answer, version 1, `saved_at` stored | SaveTest |
| 3 | Versions: a higher version replaces; the same version repeated, or a lower one arriving late, changes nothing and answers 200 `applied: false` with the stored answer | SaveTest |
| 4 | Shapes per type: valid ones stored; wrong type, out-of-range or repeated positions, too long → 422; `null` clears; `marked_for_review` saved | SaveTest |
| 5 | Timer: a save at `expires_at` + 29 s is accepted; at + 31 s → `409 time_up` and the Attempt is sealed; grace changed in config moves the edge | SaveTest (frozen clock) |
| 6 | After submitting → `409 attempt_submitted`; another Candidate's Attempt or unknown position → 404 | SaveTest |
| 7 | Submit: status, `submitted_at`; repeated → 200, same `submitted_at`; late → sealed with `submitted_at = expires_at`, `auto_submitted` | SubmitTest |
| 8 | Seal on read: an expired open Attempt is shown submitted on read and in the exam list; it no longer blocks a new start (when attempts remain) | SealTest |
| 9 | Command and endpoint seal only expired open Attempts (all Candidates), leave the rest; endpoint: wrong/missing secret 403, no secret configured 404 | SealTest |
| 10 | Refresh loses nothing: after saves, the read returns every saved answer, version and review mark | SaveTest |

Not automated: the 5-minute calls from cron-job.org (set up by you after deploy; I check the
endpoint live with a test call).

## Design
None (P7 builds the exam room, DS-003/DS-004).

## Sequencing
One builder.

## Risks
- `CRON_SECRET` must be set in Render before cron-job.org can call the endpoint. You generate it
  (I give the command) and paste it in Render and in the cron-job.org job; it never enters the repo
  or this conversation.
- A Candidate whose clock is wrong still gets the right time: P7 shows the countdown from
  `server_time`, never from the device clock.
- Subject I grading at sealing comes in P6c; until then sealed Attempts have no score (none is
  shown before publication anyway, D-019).

## Out of scope
Grading (P6c); photos (P6d); the exam room, countdown and local retry queue (P7); `graded` being
reached (P8); the cron-job.org job itself (you, after deploy).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| Q-068 | proposed: `started` until the first saved answer, then `in_progress` | the state machine | **confirm** |
| C-006 | Attempts API, part 1 | extended additively (save, submit, cron, answers in the read); consumers: none yet (P7) | **confirm the extension** |
| D-004 | server timer, 30 s grace | deadline check; the grace becomes configurable, 30 by default | confirmed 2026-11-18 |
| D-044 | seal on read and by a pinged scheduled job | Sealer, command, endpoint | confirmed 2026-11-22 |
| Q-067 | cron-job.org | the endpoint | answered |
| 5 entries confirmed before, unchanged: D-012, D-019, D-021, PATTERN-005, PATTERN-006 | | attempts left after sealing; nothing scored shown; full duration; error codes; `password.current` | — |

### Considered, not applied
- D-048, D-026 (photos): P6d. D-017 (matching): P6c.

### Assumptions (no entry behind them)
- Choice answers are stored as the **shown** positions the Candidate picked; P6c maps them through
  `option_order` (the rule tested in P6a).
- Limits: short answer ≤ 200 characters, Subject II text ≤ 10 000.
- A sealed Attempt's `submitted_at` is its `expires_at` (the deadline), not the grace's end.
