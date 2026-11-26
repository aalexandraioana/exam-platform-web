# Plan — P8a: Subject II grading and publishing results

Approved 2026-11-26. Answers: Q-075 (→ D-062), Q-076, Q-077, Q-078; Q-039 updated (3 Subject II
problems). Out of scope here: P8b (the Candidate's results page) and P8c (answer-key correction
recalculation, D-046).

## Size
L — D-062 rules, a grading API, barem-edit recalculation, publication locks, and DS-009 with
both views and an inline barem editor (Q-078: no cuts).

## Approach

### Step 1 · D-062: fixed Subject II structure
- `Readiness`: a Subject II question is Ready only at 20 points (problem code `subject_two_points`).
- `PublishChecks`: Subject II has exactly 3 Items (`subject_two_items`); `ExamItemController`
  refuses a Subject II Item whose points aren't 20.
- CHECK constraints (PATTERN-004): questions (Subject II and Ready ⇒ points = 20), exam_items
  (Subject II ⇒ points = 20).
- Factories and test setup with other Subject II points change; no assertion changes.
- `questions.template.yaml` / `questions.yaml` header: Subject II questions are worth 20.
- DS-008 (builder): a Subject II Item's points are fixed at 20 (read-only), shown in the mock step.

### Step 2 · C-004 change (approved 2026-11-26)
- `QuestionResource` returns barem steps with `id`; `PATCH /questions/{id}` keeps steps by id
  (with id: updated in place, scores kept; without: new; left out: deleted with only its scores;
  a foreign id: `422 barem: invalid`).
- After a barem save, `Support/Grading/Scorer` recalculates graded answers of this question in
  exams whose results aren't published: points went down below what was given → capped and
  flagged; a step with points deleted → flagged; a step added → 0 and flagged; description or
  higher points only → unchanged. Total = steps + adjustment, clamped to 0..points (flagged if
  clamped). Response adds `regraded: {answers, flagged}`.
- A question drawn in any exam with published results refuses barem / `uses_barem` changes
  (`422 barem: barem_locked`) and answer-key changes (`422 answer_key: answer_key_locked`).
- Frontend: `api/questions.ts` (step `id`), `BaremEditor.tsx` keeps ids, the editor shows the locks.

### Step 3 · Grading API (new C-007), for the exam's owner only
| Endpoint | Purpose |
|---|---|
| `GET /exams/{id}/grading` | queue: Subject II answers per Item and per Candidate, graded / to grade / to re-check counts, publish readiness |
| `GET /grading/items/{attemptItemId}` | snapshot statement, written steps, photos, live barem steps (with "modified since graded"), current scores |
| `PUT /grading/items/{attemptItemId}` | barem scores (Nu 0 / Parțial ≤ step / Da full) or one holistic score, adjustment, comment; total refused outside 0..20 |
| `POST /exams/{id}/results` | publish with the cohort note (Q-076: every submitted Attempt graded, none started or in progress, `available_until` passed; else `results_not_ready` with what is missing) |
| `GET /grading/images/{id}` | a photo of an answer in the Examiner's own exam |

Saving a grade sets `graded_by`, `graded_at`, clears `needs_recheck`; when all of an Attempt's
Subject II items are graded: `subject_2_score`, total = 10 + S1 + S2, status `graded`. Grade saves
and publishing lock the row first (PATTERN-007). Mean and median use each Candidate's counted
Attempt by the exam's score policy (D-012); the grade shown is total / 10. No migration needed.

### Step 4 · DS-009 screen
Mock first (DESIGN.md): label fix (competence code + points; no topic shown as a competence; no
"departajare", Q-062), the "Pe candidat" view, the inline barem editor (steps with description
and points, add/remove, sum must be 20), the publish-readiness message (Q-076), and the DS-008
read-only 20 points. The user confirms; then `/examiner/exams/:id/grading`, opened from the
published exam ("Corectează (n / N)"). Hidden names are on screen only. The inline editor saves
through `PATCH /questions/{id}`.

## Files
| Action | Path | What |
|---|---|---|
| edit | `backend/app/Support/Questions/Readiness.php`, `Support/Exams/PublishChecks.php`, `Http/Controllers/ExamItemController.php` | D-062 |
| add | `backend/database/migrations/2026_11_26_…_fixed_subject_two_points.php` | D-062 CHECK constraints |
| edit | `backend/database/factories/*`, affected tests' setup | D-062 points |
| edit | `backend/app/Http/Controllers/QuestionController.php`, `Http/Resources/QuestionResource.php` | C-004 change |
| add | `backend/app/Support/Grading/Scorer.php` | scores, recalculation |
| add | `backend/app/Http/Controllers/GradingController.php`, `Http/Requests/Grading/*` | C-007 |
| edit | `backend/routes/api.php` | routes |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md` | C-004 codes, C-005 codes, C-007 |
| edit | `backend/database/seeders/data/questions*.yaml` | Subject II = 20 points |
| edit | `docs/design/mocks/DS-009.html`, `DS-008.html`, `registry.yaml` | mock fix and additions |
| add | `frontend/src/api/grading.ts`, `frontend/src/pages/examiner/grading/*` | DS-009 |
| edit | `frontend/src/api/questions.ts`, `pages/examiner/questions/BaremEditor.tsx`, the editor's errors | C-004 consumer |
| edit | `frontend/src/App.tsx`, the exam builder (DS-008) | route, entry, read-only 20 p |
| add | `docs/design/screens/DS-009.*.png`, updated `DS-008.*.png` | screenshots |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | Subject II question Ready only at 20 p; Item refused unless 20 p; publish needs exactly 3 Subject II Items; constraints refuse bad rows | Pest · Questions, Exams, Schema |
| 2 | Barem steps kept by id: update, add, remove, foreign id refused | Pest · `Grading/BaremEditTest.php` |
| 3 | Recalculation per case (description, up, down → capped + flagged, deleted, added, clamped) and `regraded` | Pest |
| 4 | Locks after publication: barem, `uses_barem`, answer key refused; other edits allowed | Pest |
| 5 | Queue only for the exam's owner (other Examiner 404, Candidate 403); per Item and per Candidate; unanswered problems included | Pest · `Grading/QueueTest.php` |
| 6 | Barem grading Nu / Parțial / Da, partial ≤ step, adjustment, total outside 0..20 refused; holistic score | Pest · `Grading/GradeTest.php` |
| 7 | Last Subject II grade → scores, total, `graded` | Pest |
| 8 | Publish refused until Q-076 holds (each case); saves note and date | Pest · `Grading/PublishResultsTest.php` |
| 9 | Photo only from the Examiner's own exam | Pest |
| 10 | Mean and median by score policy (highest, latest) | Pest |
| 11 | DS-009: both views, pager, barem / no-barem panels, inline barem editor, hidden names, re-check, publish dialog and readiness, empty | Vitest |
| 12 | Editor shows `barem_locked` / `answer_key_locked`; builder shows 20 p read-only | Vitest |
| 13 | Screenshots DS-009 (each mock state) and DS-008, light and dark | Playwright |

## Sequencing
One builder, in the order of the steps; Step 4's screen code waits for the confirmed mocks.

## Risks
- Time (grading on 1 Dec). The backend (steps 1–3) comes first.
- Live data: a Subject II question not worth 20 drops out of Ready; an exam already published is
  not re-checked. Check the live bank before deploying.
- Publishing results can't be undone (D-019); the dialog says so.

## Knowledge used (all confirmed 2026-11-26)
D-005, D-008, D-012, D-015, D-019, D-022, D-026, D-031, D-033, D-035, D-046 (lock only; recalculation
is P8c), D-048, D-050, D-051, D-057, D-059, D-061, D-062 (new); PATTERN-001, PATTERN-003,
PATTERN-004, PATTERN-005, PATTERN-007, PATTERN-008; C-004 (changed), C-005 (new codes), C-006
(unchanged), C-007 (new); Q-039, Q-060, Q-062, Q-075–Q-078.
Considered, not applied: PATTERN-002, PATTERN-006, PATTERN-009.
Assumptions: the grade shown is total / 10; no "Corectare" item in the top navigation yet.
