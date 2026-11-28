# P10: Item Analysis (D-047)

Approved by the user on 2026-11-27. Depends on P8 (graded Attempts). Contract C-008; screen DS-010.

## Size
M: one read-only endpoint with a pure statistics class, one new screen (DS-010) whose mock is drawn and confirmed first. No schema change.

## Approach
- **Statistics:** a pure class, `backend/app/Support/Analysis/ItemAnalysis.php`, works on plain arrays so it can be unit-tested exactly. Input: each Candidate's counted, graded Attempt (Q-093, Q-094); per answer its `awarded_points`, the item's maximum (`question_snapshot.points`) and the Attempt's `total_score`.
- **Counted Attempts:** `GradingController::stats` moves into `Support/Grading/CountedAttempts`, used by the grading queue and the analysis, so both pick the same Attempt. Under "highest", ties go to the later Attempt (highest `attempt_number`, Q-097); "latest" is unchanged.
- **Endpoint:** `ItemAnalysisController@show`, `GET /api/exams/{id}/analysis`, Examiner only; the exam is found with `ExamController::find` (another Examiner's exam is 404). Computed on every read, nothing stored (about 10–30 Attempts × 9 Items in the pilot).
- **Screen:** `/examiner/exams/:id/analysis` (DS-010), linked from the exam page next to the grading link.
- **Rejected:** a cache table (a migration and invalidation after key corrections and barem edits, for no gain at this size); the statistics in SQL (harder to test for the degenerate cases).

### How the numbers are computed (D-047)
- Item score x = `awarded_points`; rest score = `total_score − 10 − x`; difficulty p = mean(x) / maximum; discrimination r = Pearson(x, rest) (the point-biserial for 0/full items; partial scores for Subject II).
- Fewer than 2 Attempts: p and r are `not_enough_data`. No variation in x or in the rest score: r alone is `not_enough_data`, p is shown and flagged as usual (Q-095). With exactly 2 Attempts r is ±1, computed as the rule says.
- Flags, on unrounded values: `too_hard` (p < 0.20), `too_easy` (p > 0.90), `low_discrimination` (r < 0.20), `negative_discrimination` (r < 0, "likely faulty"). Weak = any flag.
- Per Item: all counted Attempts, whichever question they drew. Per question: only the Attempts that drew it.
- Distractors: dual, single and multiple choice only. The shown position maps back to the original option through `option_order` (D-045), as `Grader::isCorrect` does. Counts per original option; for multiple choice every ticked option counts. A wrong option chosen by fewer than 5% of the Candidates who got the question is `unused` (unanswered ones in the denominator, choosing nothing).
- Per competence (Q-096): code, description, p = Σ points / Σ maximum over its Items, number of weak Items.
- Header: graded of submitted Attempts, mean and median grade (from `CountedAttempts`), and `recheck`: answers marked for re-check in the counted Attempts.
- API returns p from 0 to 1 (4 decimals); the SPA shows difficulty and distractor shares as percentages (RO/EN), numbers in `font-math` (D-061).

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Support/Analysis/ItemAnalysis.php` | p, r, flags, distractors, competence groups |
| add | `backend/app/Support/Grading/CountedAttempts.php` | counted Attempt per Candidate (tie → later), mean and median |
| add | `backend/app/Http/Controllers/ItemAnalysisController.php` | `show` |
| edit | `backend/routes/api.php` | the route, Examiner group |
| edit | `backend/app/Http/Controllers/GradingController.php` | `stats` uses `CountedAttempts` (response unchanged) |
| add | `backend/tests/Unit/ItemAnalysisTest.php`, `backend/tests/Feature/ItemAnalysisApiTest.php` | tests |
| add | `backend/tests/Fixtures/item-analysis-reference.json` | about 10 Attempts with expected p and r computed independently (Python `statistics.correlation`, `statistics.mean`; script noted in the file) |
| edit | `docs/API.md` | Item Analysis (Examiner) section with an example |
| add | `docs/design/mocks/DS-010.html` | mock, confirmed before the UI |
| add | `frontend/src/api/analysis.ts`, `frontend/src/pages/examiner/ItemAnalysisPage.tsx` (+ `.test.tsx`) | screen, legend, re-check notice |
| edit | `frontend/src/App.tsx`, `frontend/src/pages/examiner/ExamBuilderPage.tsx`, `frontend/src/i18n/{ro,en}.json` | route, link, copy |
| edit | `frontend/e2e/screens.spec.ts`, `frontend/e2e/mockApi.ts` | DS-010 screenshots |
| edit | `docs/design/registry.yaml`, `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | DS-010 → implemented; "computed on read"; P10 row |

## Tests (written first)
| # | Behaviour | Test |
|---|---|---|
| 1 | p and r on a small hand-computed set (point-biserial checked by hand) | Unit |
| 2 | Subject II partial scores: p = mean / maximum | Unit |
| 3 | Everyone correct: p = 1.00, `too_easy`; r `not_enough_data` | Unit |
| 4 | One Attempt: p and r `not_enough_data`, no flags | Unit |
| 5 | Each threshold on both sides (p 0.20, 0.90; r 0.20; r < 0) | Unit |
| 6 | Distractor through `option_order`; under 5% → `unused`; unanswered in the denominator; multiple choice counts each ticked option | Unit |
| 7 | Only the counted Attempt per Candidate (highest / latest); submitted but ungraded left out and counted in "X of Y" | Feature |
| 8 | Per question uses only the Attempts that drew it | Feature |
| 9 | Competence p = Σ points / Σ maximum, with the weak count | Feature |
| 10 | Another Examiner's exam → 404; a Candidate → 403; a draft exam → empty | Feature |
| 11 | Grading queue mean and median unchanged (existing tests, assertions untouched) | existing Feature |
| 12 | Screen: flags as icon + text, `not_enough_data`, empty and error states | Vitest |
| 13 | DS-010 light and dark, 320 px and desktop | Playwright (in Docker) |
| 14 | Tie under "highest": the later Attempt counts, on every read and after an unrelated re-grade | Feature |
| 15 | Reference fixture: p and r match the independent values to 4 decimals | Unit |
| 16 | Everyone wrong: p = 0, `too_hard`; r `not_enough_data` | Unit |
| 17 | Exactly 2 Attempts: r = ±1, computed | Unit |
| 18 | `recheck` counts only the counted Attempts' flagged answers | Feature |
| 19 | Percentages shown; re-check notice when above 0; legend folds and is keyboard-reachable | Vitest |
| 20 | **Manual pilot check:** after grading on 1 Dec, run on a local copy of the pilot backup; check one Subject I and one Subject II Item by hand in a spreadsheet; weak Items into BANK.md (with P12) | not automated: needs the real pilot data |

## Design
DS-010 (draft): the mock is drawn from the existing tokens and DS-009's layout (D-035) and confirmed before UI code. Header with graded of submitted, mean and median; a foldable legend (p: share of the maximum points earned, weak below 20% or above 90%; r: how well the item separates stronger and weaker Candidates, the correlation of the item score with the rest of the score, weak below 0.20; negative r: stronger Candidates did worse, usually a wrong key or unclear wording; distractor unused: a wrong option chosen by fewer than 5%); an info notice when answers are marked for re-check, linking to grading; competence groups, each a table of its Items (position, Subject, points, p, r, flags), each Item expanding to its questions (code, n, p, r, flags, option counts with `unused`). Flags are a Lucide icon plus text. States: empty (no graded Attempt, link to grading), loading skeleton, error with retry, long codes and descriptions, one Candidate. Stacked cards at 320 px, no horizontal scroll.

## Sequencing
One builder on `feat/p10-item-analysis` (from `origin/main`): backend tests first; draw the DS-010 mock and **stop for confirmation**; UI and screenshots.

**Release (D-063):** changed by the user on 2026-11-28: merged that day (PR #19), before the pilot, in one grouped release with P11 and the new-exam fix, deployed API then site. Original plan: nothing is merged before or during the 30 Nov pilot. On 1 Dec, after the pilot and with the user's go, merge and deploy by hand (API, then site), so the analysis runs on the pilot data while grading finishes; test 20 on 2 Dec.

## Risks
- Small samples per question: many per-question rows show `not_enough_data`; per-Item rows carry the pilot's weak item.
- The analysis follows every re-grade (computed on read), as intended.
- Easy to reverse: no migration, nothing written.

## Out of scope
Analysis across Exams; analysis for Candidates (Q-085); export; discrimination per competence (Q-096); ungraded Attempts; writing the pilot's weak items into BANK.md (P12).

## Knowledge used (confirmed 2026-11-27)
D-001, D-005, D-006, D-008, D-012, D-019, D-022, D-033, D-035, D-036, D-045, D-046, D-047, D-051, D-057, D-058, D-061, D-062, D-063; PATTERN-001, PATTERN-003 (candidate); C-005, C-007, C-008 (new); Q-085, Q-093–Q-097 (answered 2026-11-27).

Considered, not applied: D-039 and D-043 (superseded by D-058 and D-057); PATTERN-007 (read-only, nothing to lock); Q-091 (formula re-grading; the analysis reads whatever scores exist).

Assumptions: Exam-level only (a question in two Exams is analysed in each); an unanswered choice item counts in the distractor denominator but chooses no option.
