# Plan — P7b: exam room, reading and answering (DS-004)

Status: approved 2026-11-25 (C-006, D-045, D-060, the assumptions) · Covers D-019, D-022, D-033, D-038, D-045, D-060 · Q-070, Q-071, Q-072
answered · Builds on C-006 (read, autosave) and P7a (same branch) · next: P7c (timer, submit),
P7d (offline, resume)

## Size
M. One screen with five input types, a navigator, direct saving and DS-004 mock additions to
confirm first. No API change.

## Approach
**Part 1 · DS-004 mock additions** (confirmed by you before Part 2):
- **One item per screen** (Q-072): the Subject I state shows item 3 alone, with "← Itemul 2" and
  "Itemul 4 →".
- **New item states:**
  - multiple choice: checkboxes, "Alege toate variantele corecte."
  - true/false: two options, "Adevărat" and "Fals"
  - short answer with a generic label, "Răspunsul tău", and the decimal hint
  - Subject II as text only (Q-070): "Pașii rezolvării", with no photo block. The photo state
    stays in the mock, marked for P6d.
- **The answer couldn't be saved:** a notice with "Încearcă din nou". P7d replaces it with the
  offline queue.
- **Time is up / already submitted** (until P7c): a notice instead of the inputs, with a link to
  the dashboard. P7c replaces it with the DS-004 "Timp expirat" screen.
- Everything else is as approved: the exam header, the navigator with its legend and filters (a
  bottom sheet below 1024 px), the "Marchează pentru revizuire" toggle, loading.

**Part 2 · the screen** at `/candidate/attempts/:id` (replaces P7a's redirect):
- **Load:** `GET /attempts/{id}`. While loading, the DS-004 "Se încarcă" state.
  - `404` goes back to the dashboard.
  - A submitted Attempt shows the "already submitted" notice.
- **Header:** the exam's own header, as DS-004 (the app header is hidden in the exam room):
  - title, "{n} itemi · {points} puncte + 10 puncte din oficiu"
  - the save status
  - "Itemi 7/9" below 1024 px
  - room is left for P7c's timer and "Predă examenul"
- **The current item** is kept in the address (`?item=3`), so a refresh stays on it.
  - Number, points and the mark toggle at the top.
  - The statement as plain text in JetBrains Mono, line breaks kept (D-060).
  - The input for its type; options in the order the server sent them (D-045, already shuffled).
  - "← Itemul n" / "Itemul n →" below.
- **Navigator:**
  - items by Subject: answered (ticked), unanswered, current (underlined), marked (flag)
  - "n din m cu răspuns"
  - filters "Toți · Fără răspuns (n) · Marcați (n)"
  - a bottom sheet with a close button below 1024 px
- **Saving** (`PUT …/answer`, C-006):
  - **When:** a choice is sent at once; typed text 800 ms after the last keystroke, and on leaving
    the item.
  - **Versions:** each item's version is the last known one + 1, sent one at a time per item, and
    only the latest.
  - **Clearing:** an empty text box or no option chosen sends `null` (cleared).
  - **The mark** is saved with the item's current answer.
  - **Status:** "Se salvează…" / "Salvat · acum n s"; a failure shows the retry notice.
  - **`409 time_up` / `attempt_submitted`:** the inputs lock and the "time is up" notice shows.

Rejected:
- the whole Subject on one page, or two items per screen (Q-072)
- re-shuffling or sorting options on the client (D-045: the order is the server's, kept for contests)
- a save button (DS-004: "Răspunsurile se salvează automat")

## Files
| Action | Path | What |
|---|---|---|
| edit | `docs/design/mocks/DS-004.html`, `docs/design/registry.yaml` | Part 1 |
| edit | `frontend/src/api/attempts.ts` | `getAttempt`, `saveAnswer` and their types |
| add | `frontend/src/pages/candidate/ExamRoomPage.tsx`, `exam/ItemView.tsx`, `exam/Navigator.tsx`, `exam/useAnswers.ts` (+ tests) | Part 2 |
| edit | `frontend/src/App.tsx`, `components/AppHeader.tsx`, `i18n/ro.json`, `en.json` | route; no app header in the exam room; texts |
| add | `frontend/e2e/exam-room.spec.ts` | DS-004 screenshots |
| edit | `docs/agents/ARCHITECTURE.md`, roadmap | |

C-006: unchanged. This plan becomes a consumer of its read and autosave.

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | Each type saves its shape: single the shown position, multiple a sorted list of positions (none → null), true/false a boolean, short answer and Subject II text (empty → null); the hints shown | Vitest |
| 2 | Text is sent 800 ms after the last keystroke and on leaving the item; one request per item at a time; versions grow from the server's | Vitest (fake timers) |
| 3 | The mark toggle saves with the current answer and shows in the navigator | Vitest |
| 4 | Navigator: answered / unanswered / current / marked; counts; filters; jumping to an item; `?item=` kept after a refresh | Vitest |
| 5 | "← Itemul n" / "Itemul n →", none at the ends; Subject label changes with the item | Vitest |
| 6 | Saved answers from the server are shown on load (resume) | Vitest |
| 7 | Save failure: retry notice, retry sends the latest version; `409 time_up` locks the inputs with the notice; `404` back to the dashboard; a submitted Attempt shows the notice | Vitest |
| 8 | DS-004 screenshots, light/dark, 1440/320: each item type, navigator open on mobile, marked, save failed, time up, loading | Playwright |

## Design
DS-004 approved, plus the Part 1 additions confirmed first.
- Tokens only. Lucide icons (D-033). RO default and EN (D-022, D-038). Maths in JetBrains Mono (D-060).
- Long statements and options wrap.
- Keyboard: native radios and checkboxes, focus moves to the item on navigation, the navigator is
  reachable by keyboard.
- 320 px to 1440 px.

## Sequencing
Part 1 first; Part 2 after you confirm it. One builder, on `feat/p7-exam-experience` with P7a.

## Risks
- Two quick changes to the same item: only the latest version is kept, by the client and by the
  server (P6b). Nothing is lost while online.
- Lost connection is only reported (retry) in P7b; keeping answers on the device and sending them
  later is P7d. P7a+P7b+P7c are not merged until you say so; the pilot needs P7d too.
- Statements are plain text: a fraction or an exponent shows as typed (e.g. "3/4", "2^3"), as
  decided in D-060.

## Out of scope
The timer, hiding it, the 5-minute and 1-minute notices, submitting, the "Timp expirat" screen and
"Încercarea 1 din 1" (P7c); the offline queue, "Fără conexiune · n în așteptare" and the
refresh/lost-connection tests (P7d); photos (P6d).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| Q-072 | one item per screen | layout | answered today |
| C-006 | Attempts API | read and autosave used unchanged; new consumer `api/attempts.ts` | **confirm** |
| D-045 | options shuffled per Attempt, order stored | shown as sent; answers are shown positions | **confirm** |
| D-060 | maths as plain text in JetBrains Mono | statements and options | **confirm** |
| PATTERN-008 | dialog buttons in halves | the navigator sheet has none; any confirm in P7c | candidate |
| Q-070, Q-071 | no photos in P7; the split | scope | answered |
| 6 entries confirmed before, unchanged: D-004, D-019, D-022, D-033, D-038, PATTERN-003 | | server decides time (P7c shows it); nothing scored shown; RO/EN; Lucide; tokens | — |

### Considered, not applied
- D-026, D-048 (photos): P6d. D-021 (full duration): P7c's timer. D-044 (sealing): the server's;
  P7b only reacts to its 409.

### Assumptions (no entry behind them)
- The app header (language, theme, log-out) is hidden in the exam room, as DS-004 shows only the
  exam header. The language and theme stay as they were set before.
- Typed answers are sent 800 ms after the last keystroke.
- The current item is kept in the address (`?item=3`).
