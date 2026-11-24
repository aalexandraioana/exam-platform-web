# Plan — P5: exam builder and publication (DS-008)

Status: approved 2026-11-24 (C-005, the knowledge entries and the assumptions) · Covers D-005, D-012, D-015, D-021, D-057, D-059 · Q-059–Q-063
answered · Builds on P3 (classes), P4a (values), P4b (bank, pools, competences, topics)

## Size
L. A schema change, a new API contract (C-005), the matching logic every draw needs, two screens
(Examene list and the builder) and mock additions. Three parts, as P4b.

## Approach
**Part 1 · backend.**
- Migration (D-057): `exam_items` get `type` and `topic_id`, both nullable, where null means
  "any". Item ownership (pool, competence, topic, classes) is checked in requests, as in C-004.
- `Support/Exams/Blueprint` is the one place that knows which questions an Item may draw:
  - `eligible(item)`: Ready questions in the Item's pool with its competence and difficulty, its
    type and topic unless "any", and the Exam's grade level (D-057, D-059).
  - `assign(exam, seed)`: gives every Item its own question. Each Item's eligible list is
    shuffled with the seed, then a standard bipartite matching (augmenting paths) finds a distinct
    question per Item. That makes it random and reproducible, and it never fails when an
    assignment exists. It returns null when none exists, which is the publish check.
  - P6 calls the same `assign` when an Attempt starts, with the Attempt's seed. P5 uses it for
    the publish check and the preview.
- `Support/Exams/PublishChecks` lists what is missing as codes (PATTERN-005):
  - title, grade level, duration, at least one class
  - every Item complete: section, points, pool, competence, difficulty
  - Subject I = 30 and Subject II = 60 (D-005)
  - `no_distinct_draw`, naming the Items that can't all be served
  - coverage (Q-063): a warning, not a problem
- `ExamController` + `ExamItemController` (C-005) follow the shape of `ClassController`.
  - After publishing, only title, description and `available_until` change (Q-060);
    anything else is a `409 exam_published`.
  - A draft can be deleted; a published Exam can't (Q-061).
- Preview: one draw with a random seed. Each Item's question is filled with P4a's `ValueDrawer`
  (per-Item seed derived from the draw seed), with its expected answer. Option shuffling (D-045)
  happens in P6, at the Attempt.

**Part 2 · DS-008 additions** (confirmed before Part 3):
- the **Examene** list (Q-059), including the empty state
- a publish confirmation, since publishing can't be undone (Q-061, DESIGN.md: destructive actions ask first)
- a published exam with its locked fields
- deleting a draft
- "departajare" removed (Q-062)

**Part 3 · frontend.**
- `ExamsPage` at `/examiner/exams` and `ExamBuilderPage` at `/examiner/exams/:id`, plus an
  "Examene" link in the Examiner's menu.
- Settings are saved automatically after each change, as DS-008 shows ("Salvat automat"), with a
  short delay. Items are saved by their dialog. The checks reload after every change.
- Built from the confirmed DS-008 and existing components (SelectField, Modal, Alert).

Rejected:
- checking distinctness per Item only (two Items sharing one question would pass)
- a random draw that retries on a collision (it can fail even when an assignment exists)
- an explicit "Save" for settings (DS-008 is approved with autosave)

## API (C-005, docs/API.md → Exams) · Examiner only, own data
| Method · path | What |
|---|---|
| `GET /exams` | own exams: id, title, status (draft/published), classes, window, item count |
| `POST /exams` | `{title}` → 201 a draft |
| `GET /exams/{id}` | settings, class ids, Items (each with its eligible count), `checks` (sums, problems, coverage warnings) |
| `PATCH /exams/{id}` | title, description, grade_level, duration_minutes, available_from, available_until, max_attempts, score_policy, class_ids; published: title, description, available_until only (409 `exam_published`) |
| `DELETE /exams/{id}` | draft only (409 `exam_published`) |
| `POST /exams/{id}/items` · `PATCH, DELETE /exams/{id}/items/{itemId}` | section, points, pool_id, competence_id, difficulty, type (null = any), topic_id (null = any); drafts only |
| `PUT /exams/{id}/items/order` | `{item_ids: [...]}` in the new order |
| `POST /exams/{id}/match` | unsaved Item criteria → `{count}` (the dialog's live count) |
| `POST /exams/{id}/publish` | 422 `not_publishable` + `problems`; else `published_at` set |
| `GET /exams/{id}/preview` | one draw: per Item the question code, filled statement and options, values, expected answer, and how many questions it was drawn from |

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/database/migrations/2026_11_25_1*_item_type_and_topic.php` | `exam_items.type`, `exam_items.topic_id` |
| edit | `backend/app/Models/ExamItem.php`, `Exam.php` | casts, relations; comments to D-057 |
| add | `backend/app/Support/Exams/Blueprint.php`, `PublishChecks.php` | eligibility, distinct assignment, checks |
| add | `backend/app/Http/Controllers/ExamController.php`, `ExamItemController.php`, `Requests/Exams/*`, `Resources/ExamResource.php` | C-005 |
| edit | `backend/routes/api.php` | examiner routes |
| add | `backend/tests/Feature/Exams/*`, `backend/tests/Unit/Exams/BlueprintTest.php` | below |
| edit | `docs/API.md`, `CONTRACTS.md` (C-005), `ARCHITECTURE.md` | |
| edit | `docs/design/mocks/DS-008.html`, `registry.yaml` | Part 2 |
| add | `frontend/src/api/exams.ts`, `pages/examiner/ExamsPage.tsx`, `ExamBuilderPage.tsx` (+ `exams/` parts) and tests | Part 3 |
| edit | `frontend/src/App.tsx`, `components/AppHeader.tsx`, `i18n/*.json` | routes, "Examene" link, RO/EN |
| add | `frontend/e2e/exams.spec.ts` | DS-008 screenshots |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | Eligible questions per Item: pool, competence, difficulty, type/topic or any, grade level; Drafts and other pools excluded | Pest · Blueprint |
| 2 | Distinct assignment: found when one exists (including the case where a greedy pick fails), null when none; same seed same draw; different seeds vary | Pest · unit |
| 3 | Publish checks: each missing setting, incomplete Item, 30/60 sums, no class, `no_distinct_draw` naming Items; coverage as warning only | Pest |
| 4 | Create, list, show, update settings; another Examiner's exam, class, pool, competence or topic → 404 / 422 | Pest |
| 5 | Items: add, edit, delete, reorder; refused after publishing | Pest |
| 6 | Match count for unsaved criteria | Pest |
| 7 | Publish: 422 with problems; success sets published_at; then only title, description, available_until change (409 otherwise); no unpublish | Pest |
| 8 | Delete a draft (classes unlinked); refuse a published one | Pest |
| 9 | Preview: every Item drawn, distinct questions, values filled, expected answer | Pest |
| 10 | Exams list, new exam, builder: settings autosave, Items dialog with live count, reorder, checks, publish confirmation, locked published exam, preview, delete draft | Vitest |
| 11 | DS-008 screenshots, light/dark, 1440/320 | Playwright |

## Design
DS-008 (approved) plus the Part 2 additions, drawn and confirmed before Part 3. Tokens only;
states: no exams, loading, load error, save error, long titles, many Items, 320 px.

## Sequencing
Part 1 and Part 2 in parallel; Part 3 after you confirm Part 2.

## Risks
- Schedule: P5 is planned for 26 Nov and P6 for 27 Nov. Part 1 alone unblocks P6. If time runs
  short, the preview ships last.
- The matching runs on every check. A bank of hundreds of questions and about ten Items is tiny
  for it, so no caching.
- A published exam can't be undone (Q-061). The confirmation dialog says so, and the checks must
  pass first.

## Out of scope
Candidates seeing and starting exams (P6/P7); results and the cohort note (P8); the dashboard
(DS-006, P11); unpublishing (Q-061); option shuffling (D-045, P6).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-005 | 10 + 30 (Subject I) + 60 (Subject II) | publish sums | confirm |
| D-012 | Attempt limit and score policy per Exam | settings | confirm |
| D-015 | Exams are published to classes; only their Candidates see them | classes | confirm |
| D-021 | Full duration per Attempt; available_until only stops new starts | window, extending it after publishing | confirm |
| D-049 | A class linked to a published Exam can't be deleted | publishing links classes for good | confirm |
| D-019 | Results only after publication | not touched here (P8) | confirm |
| D-045 | Options shuffled per Attempt | in P6, not the preview | confirm |
| D-006, D-013, D-022, D-027, D-031, D-033, D-035, D-040, D-041, D-050, D-057, D-058, D-059, D-060, PATTERN-002–006 | confirmed 2026-11-24 | | — |
| C-002 | Classes API | the builder lists the Examiner's classes with it; unchanged | confirm |
| C-004 | Question bank API | pools, competences, topics lists reused; unchanged | confirmed 2026-11-24 |
| Q-059–Q-063 | your answers today | scope above | answered |

### Assumptions (no entry behind them)
- The availability window is optional at publish: no `available_from` means open as soon as it
  is published; no `available_until` means it stays open.
- Classes offered in the builder are all of the Examiner's classes (classes have no grade level).
- An Item's points can be any positive value; only the Subject totals (30 / 60) are checked.
