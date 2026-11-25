# Plan — P7d: offline and resume (twist part 1, client side)

Status: approved 2026-11-25 (C-006 addition, D-004, the assumptions) · Covers D-004, D-021, D-044 and the catalog's "refresh, closing the
tab and losing the connection lose nothing" · Builds on P6b (versioned autosave), P7b–P7c (same
branch) · last part of P7 (Q-071)

## Size
M. The exam room's saving keeps every answer on the device until the server has it, retries by
itself, resumes after a refresh or a reopened tab; one API field; the catalog's two Playwright tests.
No new screen: "Fără conexiune" is in the approved DS-004 mock.

## Approach
**Part 1 · API (C-006, additive):** `GET /attempts/{id}` adds `accepts_answers_until`, the
deadline plus the Grace Period (D-004), from the existing `Attempt::acceptsAnswersUntil()`. At 0 the
client then keeps sending what waits until exactly that moment, instead of guessing the grace.

**Part 2 · the exam room** (`exam/useAnswers.ts`, P7b's hook):
- **On the device first:** every change is written to `localStorage`
  (`exam-answers-{attempt}`: value, review mark, version, "waiting") before it is sent, and marked
  sent when the server confirms it.
  - If storage is blocked (private mode), it keeps working in memory only.
  - The entry is removed once the Attempt has ended.
- **Retries by itself:** a failed save is sent again after 1, 2, 4… seconds (at most 30), and at
  once when the browser says it is back online. Still one save per item at a time, only the newest
  change (P7b).
- **"Fără conexiune · n răspunsuri în așteptare"** in the header, and the DS-004 warning "Conexiunea
  s-a întrerupt…", while the network is down or saves fail to reach the server. A server error that
  isn't a lost connection keeps P7b's "Nesalvat" notice with "Încearcă din nou".
- **The browser asks before closing the page** while any answer is waiting.
- **Resume** (refresh, reopened tab, the same device later):
  - The read gives the server's answers.
  - An answer still waiting on this device with a higher version than the server's wins, is shown,
    and is sent at once. One with a lower or equal version is dropped (the server has a newer one,
    e.g. from another device).
- **At 0 and on "Predă examenul"** (P7c): waiting answers keep being retried until
  `accepts_answers_until` by the server's clock, then the Attempt is submitted (or sealed by the
  server, D-044). The "Timp expirat" screen says how many items reached the server.

**Part 3 · Playwright, the catalog's two tests** (API mocked, with a mock that remembers saves):
- **Refresh mid-exam:** answer three items (one still in its typing pause), reload → every answer is
  back, on the same item. Plus closing the tab and opening the Attempt in a new tab: the same.
- **Lost connection:** go offline, answer two items → "Fără conexiune · 2 răspunsuri în așteptare"
  and the warning; back online → both are sent, "Salvat", and the mock holds both answers with
  growing versions.

Rejected:
- a service worker or IndexedDB (localStorage holds a few kB per Attempt, enough, and needs nothing new)
- the server's time as each answer's version (the catalog asks for a version per answer; P6b has it)
- dropping the waiting answers at 0 (the grace exists for exactly these, D-004)

## API (C-006 addition)
| Endpoint | Added |
|---|---|
| `GET /attempts/{id}` (and the submit answer) | `accepts_answers_until` |

Consumers: `frontend/src/api/attempts.ts` only.

## Files
| Action | Path | What |
|---|---|---|
| edit | `backend/app/Http/Resources/AttemptResource.php`, `backend/tests/Feature/Attempts/ReadTest.php` | Part 1 |
| edit | `frontend/src/api/attempts.ts` | the field |
| edit | `frontend/src/pages/candidate/exam/useAnswers.ts` (+ `answerStore.ts` for the device copy) and tests | Part 2 |
| edit | `frontend/src/pages/candidate/ExamRoomPage.tsx`, `i18n/ro.json`, `en.json` | offline status and warning, close warning, the 0 path |
| add | `frontend/e2e/exam-resilience.spec.ts` | Part 3 |
| edit | `frontend/e2e/exam-room.spec.ts` | "Fără conexiune" screenshots |
| edit | `docs/API.md`, `CONTRACTS.md` (C-006), `ARCHITECTURE.md`, roadmap, `docs/design/registry.yaml` | |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | The read gives `accepts_answers_until` = deadline + grace (config) | Pest |
| 2 | Each change is on the device before it is sent; marked sent after the server confirms | Vitest · unit |
| 3 | Retries after a failure with a growing delay, and at once on `online`; one per item, newest only | Vitest (fake timers) |
| 4 | Resume: a waiting local answer with a higher version wins and is sent; a lower or equal one is dropped; nothing waiting → the server's answers | Vitest |
| 5 | Offline: "Fără conexiune · n răspunsuri în așteptare" and the warning; back online → "Salvat"; a server error keeps "Nesalvat" with retry | Vitest |
| 6 | The browser asks before closing while answers wait, not otherwise | Vitest |
| 7 | At 0 offline: retried until `accepts_answers_until`, then submit or the server's seal; the end screen counts what reached the server | Vitest (fake timers) |
| 8 | Storage blocked: still saves, from memory | Vitest |
| 9 | **Refresh mid-exam** and **closing the tab and reopening** lose nothing | Playwright |
| 10 | **Lost connection** loses nothing | Playwright |
| 11 | DS-004 "Fără conexiune" screenshots, light/dark, 1440/320 | Playwright |

Not automated: a real phone losing signal on a real network (the pilot's dry run on 29 Nov).

## Design
DS-004 "Fără conexiune" (approved): the header status in warning colour and the warning notice.
No new screen or text beyond the mock. Tokens only, RO/EN.

## Sequencing
Part 1, then Parts 2–3. One builder, same branch.

## Risks
- `localStorage` is per browser and device: a Candidate who switches devices while offline has the
  unsent answers only on the first one. The other device shows the server's answers.
- Two tabs of the same Attempt: both write the device copy. The version rule keeps the newest per
  item. Acceptable.
- Clearing site data while offline loses what wasn't sent; the warning before closing is the guard.

## Out of scope
Photos (P6d); a service worker or full offline start of an exam (README §7: offline mode is out of
scope); results (P9).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| C-006 | Attempts API | `accepts_answers_until` added; consumer `api/attempts.ts` | **confirm** |
| D-004 | server timer, 30 s grace for in-flight answers | the client retries until the grace ends | **confirm** |
| 4 entries confirmed before, unchanged: D-021, D-044, Q-071, PATTERN-008 | | full duration; sealing; the split; dialog buttons | — |

### Considered, not applied
- D-061 (maths), D-045 (shuffle): unchanged. D-026/D-048 (photos): P6d.

### Assumptions (no entry behind them)
- Retries wait 1, 2, 4… seconds, at most 30.
- The device copy is removed when the Attempt ends.
- "Fără conexiune" shows for network failures; other server errors keep P7b's "Nesalvat".
