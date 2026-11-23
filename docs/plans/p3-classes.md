# Plan — P3: classes, join requests and new passwords

**Status:** approved 2026-11-23 · after [p2-auth-accounts.md](p2-auth-accounts.md) is merged

## Size
M. One API area (the Examiner's classes and memberships) with about 10 Pest tests, and one
screen (DS-013) built from P2's components plus a Modal and the mobile menu.

## Approach
**Backend.** `ClassController` (behind `role:examiner` and `active` from P2) works on the
Examiner's own classes: list (with pending and Candidate counts), show (pending requests
and roster), create, rename, new join code, and delete. Delete follows D-049: draft
Exams are unlinked in a transaction first, and a class linked to a published Exam is
refused with 409. Another Examiner's class is a 404.

`MembershipController` lets a Candidate join by code (pending). An Examiner can accept
or decline a pending request, and set a new password for an accepted Candidate of their
class (D-020). The Examiner types the password, min 8. The P2 hook then revokes that
Candidate's tokens. Status and dates are set only in these actions, never by mass
assignment.

`JoinCode` gains `generate()`: 6 characters from an alphabet without 0/O/1/I/L, upper
case, retried on a unique collision. It also gains `format()`, which shows `K7Q-4MX`.
The endpoints go into `docs/API.md` (D-051) and C-002.

**Frontend.** `/examiner` now goes to `ClassesPage` (DS-013): class list, the selected
class with its join code (copy, new code), pending requests (accept, decline), the
roster with a search box (filtered in the browser), and the dialogs for a new class and
a new password. A `Modal` component is added (focus trap, Escape, focus returns to the
button). AppHeader gains the Examiner nav, showing only "Clase" until other screens
exist, and the mobile drawer.

**Rejected:** a separate join-request table (P1a's `class_memberships` already holds
status and dates); searching the roster on the server (a class has a few dozen
Candidates).

## Files
| Action | Path | What |
|---|---|---|
| create | `backend/app/Http/Controllers/ClassController.php` | index, show, store, update, regenerate code, destroy |
| create | `backend/app/Http/Controllers/MembershipController.php` | join (Candidate); accept, decline, set password (Examiner) |
| create | `backend/app/Http/Requests/` (store/update class, join, set password) | validation |
| create | `backend/app/Http/Resources/ClassResource.php`, `MembershipResource.php` | JSON shapes in C-002 |
| modify | `backend/app/Support/JoinCode.php` | `generate()`, `format()` |
| modify | `backend/routes/api.php` | class and membership routes |
| create | `backend/tests/Feature/Classes/*Test.php` | Pest |
| modify | `backend/tests/Unit/JoinCodeTest.php` | generate, format |
| create | `frontend/src/api/classes.ts` | typed calls |
| create | `frontend/src/components/Modal.tsx` | dialog |
| modify | `frontend/src/components/AppHeader.tsx` | Examiner nav, mobile drawer |
| create | `frontend/src/pages/examiner/ClassesPage.tsx` (DS-013) | screen |
| modify | `frontend/src/App.tsx`, `i18n/ro.json`, `en.json` | route; texts |
| modify | `frontend/e2e/screens.spec.ts` | DS-013 screenshots |
| modify | `docs/API.md`, `docs/agents/CONTRACTS.md` | class endpoints; C-002 |
| modify | `docs/design/registry.yaml`, `docs/design/screens/` | DS-013 implemented; screenshots |
| modify | `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | status |

## Tests
| # | Behaviour | Test (file · kind) | Not automated? why |
|---|---|---|---|
| 1 | Examiner lists only their own classes, with pending and Candidate counts | Classes/ClassTest · Pest | |
| 2 | Create class: server code, 6 chars from the alphabet, upper case; a code in the request is ignored | Classes/ClassTest · Pest | |
| 3 | Rename; a new code makes the old one fail and keeps existing requests | Classes/ClassTest · Pest | |
| 4 | Another Examiner's class: 404 on show, update, delete, accept, set password | Classes/OwnershipTest · Pest | |
| 5 | Candidates and inactive Examiners can't reach class routes (403) | Classes/OwnershipTest · Pest | |
| 6 | Delete unlinks draft Exams; refused (409) while a published Exam is linked (D-049) | Classes/ClassTest · Pest | |
| 7 | Candidate joins by code: pending; joining again while pending or accepted changes nothing | Classes/MembershipTest · Pest | |
| 8 | Join with an unknown code: 422; after a decline: 409 until Q-041 is answered | Classes/MembershipTest · Pest | |
| 9 | Accept / decline a pending request sets status and `decided_at`; deciding twice: 409 | Classes/MembershipTest · Pest | |
| 10 | Set password: only for an accepted Candidate of the Examiner's class, min 8; old password and tokens stop working | Classes/SetPasswordTest · Pest | |
| 11 | `JoinCode::generate` and `format` | Unit/JoinCodeTest · Pest | |
| 12 | Classes page: list, select, create, accept, decline, new code, copy, set password, search, empty, error | pages/examiner/ClassesPage.test.tsx · Vitest | |
| 13 | Modal: focus moves in, Escape closes, focus returns | components/Modal.test.tsx · Vitest | |
| 14 | Examiner login lands on the classes screen | e2e/auth.spec.ts · Playwright (mocked API) | |
| 15 | Screenshots DS-013, light and dark, 320 px and 1440 px | e2e/screens.spec.ts · Playwright | compared by eye with the mock |
| 16 | Live: create a class, register with its code, accept | | manual on Render after merge |

## Design
DS-013 ✅. Tokens only (PATTERN-003), Lucide icons (D-033). States as in the mock: with
requests, without requests, new class, new password, no classes, error; long class and
Candidate names wrap. Light and dark. The roster's "…" button is left out until Q-041
is answered. The new-password field starts empty (your answer today); the mock's value
is an example.

## Sequencing
One builder: backend first, then the screen. It starts after P2 is merged, because it
needs P2's middlewares, `apiFetch`, AuthProvider and components.

## Risks
- **Clipboard copy** needs a secure context. It works on the live site (https) and on
  localhost; elsewhere the code stays selectable.
- **A code collision** on generation is retried; with about 887 million codes it's
  practically never hit.
- Nothing here is hard to reverse. No schema change.

## Out of scope
The Candidate's "Am un cod de clasă" button and dialog (P7, with DS-003; the join API is
here). Deleting a class from the UI (DS-013 has no control for it; the API is here). The
roster's "…" menu (Q-041). Removing a Candidate from a class.

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| Q-041 *(new, open)* | What does the roster's "…" menu on DS-013 contain, and can a declined Candidate ask to join again? | Unanswered, so the menu is not built, and joining after a decline returns 409 "already decided" | answer or leave open |

9 entries confirmed before, unchanged: D-001, D-015, D-020, D-028, D-033, D-035, D-049,
D-050, D-051, plus PATTERN-001.

Candidates used (not yet approved, followed as the current practice): PATTERN-003
tokens-only Tailwind.

### Considered, not applied
- PATTERN-004 constraints: no schema change; the P1a constraints already hold.
- D-053: registration with a code is P2.

### Assumptions (no entry behind them)
1. The Examiner types the Candidate's new password (min 8) (your answer today). Setting it also logs the Candidate out everywhere.
2. Join codes: 6 characters, no 0/O/1/I/L, stored without the hyphen; input is case- and hyphen-insensitive.
3. A new join code takes effect at once; requests already sent stay (as the DS-013 help text says).
