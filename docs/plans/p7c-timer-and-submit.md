# Plan — P7c: timer and submit (DS-004)

Status: approved 2026-11-25 (C-006 addition, D-044, the assumptions) · Covers D-004, D-012, D-019, D-021, D-044 · Q-071 · Builds on P6b
(server timer, submit, sealing), P7b (the exam room, same branch) · next: P7d (offline, resume)

## Size
S–M. One API field, a countdown from the server's clock, the submit dialog and two end screens,
plus three small mock additions to confirm first.

## Approach
**Part 1 · API (C-006, additive):** `GET /attempts/{id}` adds `exam.max_attempts`, for
"Încercarea 1 din 1" in the header.

**Part 2 · DS-004 mock additions** (confirmed by you before Part 3). The timer, "Ascunde",
"Sub 5 minute", "Cronometru ascuns", "Confirmare predare" and "Timp expirat" are approved already.
Added:
- the **1-minute notice**: "Mai este 1 minut. La final, examenul se predă singur cu tot ce ai salvat."
- the **"Examen predat" screen** after you submit yourself. It is the "Timp expirat" card with
  "Ai predat examenul „…” la 12:05", the saved items ("9 din 9 itemi au ajuns pe server") and a
  link to the dashboard (D-019: no score).
- **submitting while an answer isn't saved:** the dialog says which items and offers "Încearcă din
  nou" instead of submitting, so nothing typed is left behind.

**Part 3 · the exam room** (P7b's screen):
- **Countdown** (D-004, D-021): time left = `expires_at` − (device time + the offset measured from
  `server_time` at load), so a wrong device clock doesn't matter. It updates every second.
  - mm:ss, or h:mm:ss from an hour
  - warning style under 5 minutes (as the mock)
- **"Ascunde" / "Arată cronometrul":** the "Cronometru ascuns" notice while hidden. The choice is
  remembered on this device for this Attempt.
- **The notices:** at 5 minutes and at 1 minute, also when the timer is hidden.
- **"Predă examenul" → the confirmation dialog** (as the mock):
  - "Ai răspuns la 7 din 9 itemi", the unanswered and the marked items
  - "Înapoi la examen" / "Predă examenul" (PATTERN-008)
  - **Before submitting:** typed answers still waiting are sent first. If one fails, the dialog
    shows the unsaved items and doesn't submit.
  - **Then:** `POST …/submit`, then the "Examen predat" screen.
- **At 0:** the inputs lock, waiting answers are sent, then `POST …/submit`. The server accepts
  saves until the deadline + grace and seals at the deadline (P6b), so the result is the same
  either way. Then the "Timp expirat" screen ("predat automat la …"). If the network is down at
  that moment, the screen still shows: the server seals the Attempt with what it has.
- **Opening a submitted Attempt** shows "Examen predat" (submitted by you) or "Timp expirat"
  (sealed, `auto_submitted`), instead of P7b's temporary notice. A save answered `409 time_up`
  leads to "Timp expirat" too.
- The header: "Încercarea 1 din 1 · 9 itemi · 90 puncte + 10 puncte din oficiu".

Rejected:
- the device clock as the source (D-004)
- submitting at 0 without sending waiting answers first (typed text in its 800 ms pause would be lost)
- showing a score after submitting (D-019)

## API (C-006 addition)
| Endpoint | Added |
|---|---|
| `GET /attempts/{id}` (and the submit answer) | `exam.max_attempts` |

Consumers: `frontend/src/api/attempts.ts` only.

## Files
| Action | Path | What |
|---|---|---|
| edit | `backend/app/Http/Resources/AttemptResource.php`, `backend/tests/Feature/Attempts/ReadTest.php` | Part 1 |
| edit | `docs/design/mocks/DS-004.html`, `registry.yaml` | Part 2 |
| edit | `frontend/src/api/attempts.ts` | `max_attempts`, `submitAttempt` |
| add | `frontend/src/pages/candidate/exam/useCountdown.ts`, `exam/SubmitDialog.tsx`, `exam/EndScreen.tsx` (+ tests) | Part 3 |
| edit | `frontend/src/pages/candidate/ExamRoomPage.tsx`, `exam/useAnswers.ts` (send everything waiting, await it), `i18n/ro.json`, `en.json` | |
| edit | `frontend/e2e/exam-room.spec.ts` | screenshots: timer, under 5 min, hidden, dialog, the two end screens |
| edit | `docs/API.md`, `CONTRACTS.md` (C-006), `ARCHITECTURE.md`, roadmap | |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | The read gives `exam.max_attempts` | Pest |
| 2 | Countdown from the server's clock (a device clock 10 min off changes nothing); mm:ss and h:mm:ss; warning style under 5 min | Vitest (fake timers) |
| 3 | Notices at 5 and 1 minute, also when hidden; hiding is remembered after a reload | Vitest |
| 4 | At 0: inputs lock, the waiting typed answer is sent, then submit, then "Timp expirat" with the time | Vitest |
| 5 | Dialog: answered count, unanswered and marked items; "Înapoi la examen" closes; "Predă examenul" sends what waits, submits, shows "Examen predat" with "n din m itemi au ajuns pe server" | Vitest |
| 6 | An unsaved answer blocks submitting and is retried from the dialog | Vitest |
| 7 | A submitted Attempt opens on "Examen predat"; a sealed one, or a `409 time_up`, on "Timp expirat"; "Mergi la tabloul de bord" | Vitest |
| 8 | DS-004 screenshots light/dark, 1440/320: timer, under 5 min, hidden, the dialog, both end screens | Playwright |

## Design
DS-004 approved, plus the three Part 2 additions confirmed first. Tokens only. The timer uses
`text-timer` with tabular digits (mock). The notices use `role="alert"`, so a screen reader says
them; the countdown itself isn't read out every second. RO/EN. 320 px to 1440 px.

## Sequencing
Part 1 ∥ Part 2; Part 3 after you confirm Part 2. One builder, same branch.

## Risks
- A phone asleep or a backgrounded tab pauses JavaScript timers. The countdown is recomputed
  from the clock on every tick, so it is right again the moment the page wakes, and the server
  enforces the deadline anyway.
- Submitting at 0 offline: handled by the server sealing (D-044). Keeping unsent answers on the
  device to send later is P7d.

## Out of scope
The offline queue, "Fără conexiune · n în așteptare", the warning before closing and the
refresh/lost-connection tests (P7d); results (P9); photos (P6d).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| C-006 | Attempts API | `exam.max_attempts` added; consumer `api/attempts.ts` | **confirm** |
| D-044 | expired Attempts sealed on read and by the job | at 0 and offline the server seals | **confirm** |
| PATTERN-008 | dialog buttons in halves | the submit dialog | candidate |
| 5 entries confirmed before, unchanged: D-004, D-012, D-019, D-021, Q-071 | | server timer and grace; attempts counted; no score shown; full duration; the split | — |

### Considered, not applied
- D-061 (maths): unchanged. D-026/D-048 (photos): P6d.

### Assumptions (no entry behind them)
- Hiding the timer is remembered on this device for this Attempt.
- After submitting yourself you see the "Examen predat" screen, not the dashboard directly.
- At 0 the client submits once the waiting answers are sent (the server would seal anyway).
