# P11: Overview screens (DS-006 Examiner dashboard, DS-012 Administrator exam supervision)

Approved by the user on 2026-11-28, with the four test changes below. Built on `feat/p11-overview`
from `feat/p10-item-analysis`; planned to merge with P10 on 1 Dec; the user moved both to 2026-11-28, before the pilot (PR #19, PR #22; D-063). Contract C-009.
Answers: Q-098 (DS-012 read-only, every exam, state filter), Q-099 (the dashboard is the Examiner's landing).

## Size
M: two read-only endpoints over existing models (no schema change), two new screens whose mocks
are drawn and confirmed first, and the Examiner landing moving from Classes to the dashboard.

## Approach
- **Backend (C-009):** `OverviewController@examinerDashboard` (`GET /api/examiner/dashboard`,
  Examiner, own exams only) and `@adminExams` (`GET /api/admin/exams`, Administrator, read-only).
  `withCount` queries, so the query count doesn't grow with the exams. Exam states from
  `Starter::state` (upcoming / open / closed); Attempt statuses from the state machine.
- **Frontend:** `ExaminerDashboardPage` at `/examiner` (landing); Classes move to
  `/examiner/classes`; the Examiner menu starts with "Panou". `AdminExamsPage` at `/admin/exams`,
  linked "Examene" in the Administrator menu; the Administrator still lands on Users. Reuses the
  table and the 1024 px cap of `UsersPage`, the list of `ExamsPage`, the styled select (PATTERN-002).
- **Rejected:** live auto-refresh (loads on open, retry on error); charts (not asked for);
  server-side filtering of the admin list (a few dozen exams; filtered in the browser).

### Definitions
- **Active exams:** published and the window open now (`Starter::state = open`).
- **Attempts in progress:** `started` or `in_progress` and still accepting answers (deadline + the
  30 s grace, D-004); an expired Attempt not yet sealed (D-044) doesn't count.
- **Awaiting grading:** Attempts with status `submitted` (an Attempt becomes `graded` once every
  Subject II answer is graded).
- **Dashboard list:** published exams that are open or have submissions awaiting grading; title,
  state, end of the window, in progress, awaiting, results published; open first, then newest.
- **Admin list:** every exam, drafts included, newest first: title, Examiner, status, state (none
  for a draft), window, results published at, classes, Attempts submitted (submitted or graded) and
  graded. Filter Toate / Active (upcoming + open) / Arhivate (closed) / Ciorne. No Candidate data,
  no scores.

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Http/Controllers/OverviewController.php` | the two endpoints |
| edit | `backend/routes/api.php` | the two routes in the role groups |
| add | `backend/tests/Feature/Overview/ExaminerDashboardTest.php`, `AdminExamsTest.php` | tests |
| edit | `docs/agents/CONTRACTS.md`, `docs/API.md` | C-009 |
| add | `docs/design/mocks/DS-006.html`, `DS-012.html` | mocks, confirmed before screen code |
| add | `frontend/src/api/overview.ts`, `frontend/src/pages/examiner/ExaminerDashboardPage.tsx` (+ test), `frontend/src/pages/admin/AdminExamsPage.tsx` (+ test) | screens |
| edit | `frontend/src/App.tsx`, `frontend/src/components/AppHeader.tsx`, `frontend/src/i18n/{ro,en}.json` | routes, menu, copy |
| edit | `frontend/e2e/screens.spec.ts`, `frontend/e2e/mockApi.ts` | screenshots |
| edit | `docs/design/registry.yaml`, `docs/plans/application-roadmap.md` | DS-006, DS-012 implemented; P11 row |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | The dashboard counts only the Examiner's own exams | ExaminerDashboardTest |
| 2 | Active = published and open; drafts, upcoming, closed not counted | ExaminerDashboardTest |
| 3 | In progress until deadline + grace; expired, submitted, graded not counted | ExaminerDashboardTest |
| 4 | Awaiting = submitted, not graded | ExaminerDashboardTest |
| 5 | The exam list: open or awaiting, open first | ExaminerDashboardTest |
| 6 | Role refusals (403) | both |
| 7 | Admin list: every exam with state, window, classes, counts | AdminExamsTest |
| 8 | No Candidate data, no scores | AdminExamsTest |
| 9 | Fixed number of queries | both |
| 10 | Dashboard screen: cards, list, empty, loading, error with retry | ExaminerDashboardPage.test.tsx |
| 11 | Admin screen: rows, filter, empty, error with retry | AdminExamsPage.test.tsx |
| 12 | Menus: "Panou" first; "Examene" for the Administrator | AppHeader.test.tsx |
| 13 | DS-006 and DS-012 screenshots, light and dark, 1440 and 320 px | screens.spec.ts |

**Existing test changes approved by the user (2026-11-28):**
1. `frontend/e2e/auth.spec.ts:7`: the Examiner still lands on `/examiner`; the heading "Clase" → the dashboard heading ("Panou").
2. `frontend/src/components/AppHeader.test.tsx:30`: the menu `['Bancă de întrebări', 'Examene', 'Clase']` → `['Panou', 'Bancă de întrebări', 'Examene', 'Clase']`.
3. `frontend/src/components/AppHeader.test.tsx:7`: setup starts at `/examiner/classes`; the assertion is unchanged.
4. `frontend/e2e/classes.spec.ts:52, 64`: setup `goto('/examiner')` → `goto('/examiner/classes')`.

## Out of scope
Administrator actions on exams, an exam detail page for the Administrator, auto-refresh, charts,
searching the admin list, per-class statistics.
