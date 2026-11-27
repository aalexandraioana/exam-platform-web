# P8c: correcting a Subject I answer key after Attempts were submitted (D-046)

Approved by the user on 2026-11-27. Part of P8 (Q-077), after P8a and P8b.

## Size
M: a backend change to saving questions, a small change-log table, a short history and notice in the question editor, and a DS-007 mock addition confirmed first.

## Approach
When the Examiner saves a Subject I question whose answer key changed and which has already been drawn, the same transaction:
1. **Copies the new key into each affected Attempt's snapshot:** Attempts in exams whose results aren't published, running ones included. Each Attempt keeps the options as the Candidate saw them (Q-088).
2. **Re-grades Subject I** in the submitted and graded Attempts, with `Grader::subjectOne` (it grades from the snapshot) and `Scorer::attemptTotals`.
3. **Records one row in `answer_key_corrections`:** who, when, the key before and after, how many answers were re-graded (Q-087).
4. **Answers with `regraded: {answers, flagged: 0}`.** The editor shows "Răspunsul corect a fost salvat: N încercări recalculate" (Q-090) and the last corrections, one short line each.

Locks follow the P8a review order: the exams that drew the question, then the question.

On a drawn question, the save refuses:
- changing the number or order of options: `options_locked`;
- changing a formula or the generated values: `parameters_locked` (Q-089, Q-091);
- correcting the key after results are published: `answer_key_locked`, as built in P8a.

**Rejected:** re-grading from the question alone, since grading reads each Attempt's own snapshot (D-006, D-045).

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/database/migrations/…_create_answer_key_corrections_table.php` | change log (Q-087) |
| add | `backend/app/Models/AnswerKeyCorrection.php` | model |
| add | `backend/app/Support/Grading/KeyCorrection.php` | snapshots, re-grade, log, counts |
| edit | `backend/app/Http/Controllers/QuestionController.php` | call it in `update`; `options_locked`, `parameters_locked` |
| edit | `backend/app/Http/Resources/QuestionResource.php` | `key_corrections` (last 5) |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md` (C-004) | new codes and fields |
| add | `backend/tests/Feature/Grading/KeyCorrectionTest.php` | Pest |
| edit | `docs/design/mocks/DS-007.html`, `registry.yaml` | notice + history, confirmed before screen code |
| edit | `frontend/src/api/questions.ts`, `pages/examiner/questions/QuestionEditor.tsx`, `i18n/{ro,en}.json`, tests | C-004 consumer |
| edit | `frontend/e2e/questions.spec.ts`, `docs/design/screens/DS-007.*` | screenshots |

## Tests (written first)
| # | Behaviour | Test |
|---|---|---|
| 1 | Correcting the right option re-grades Subject I in submitted and graded Attempts: points, `subject_1_score`, `total_score` | Pest |
| 2 | Single, multiple, true/false and short answers (accepted list or fixed value), each with options shuffled per Attempt (D-045) | Pest |
| 3 | A running Attempt gets the new key and is graded with it at submission | Pest |
| 4 | Attempts keep their options; a typo fix in an option text doesn't change what was shown | Pest |
| 5 | Adding, removing or reordering options once drawn → `options_locked`; changing a formula → `parameters_locked` | Pest |
| 6 | After results are published → `answer_key_locked`, nothing changes | Pest (exists) |
| 7 | A correction row with who, when, before, after and count; `key_corrections` in GET | Pest |
| 8 | An undrawn question, or the same key saved again: no re-grade, no log | Pest |
| 9 | Editor: the notice with the count, the history lines, the two refusal messages | Vitest |
| 10 | DS-007 screenshots, light and dark | Playwright |

## Sequencing
One builder: backend (tests first), then the DS-007 mock for confirmation, then the frontend. Branch `feat/p8c-key-correction`; released in a grouped release (D-063), after the pilot.

## Risks
- **Re-grade size:** about 30 Attempts per class, in one transaction.
- **Edits and reorders together:** the same option texts in a new order are refused; a change in the number of options is always refused.
- **New table:** the migration only adds a table.

## Out of scope
Re-grading after a formula change (Q-091), corrections after publication (D-046), Subject II (D-031, P8a), a separate audit screen.

## Knowledge used
Confirmed and unchanged: D-005, D-006, D-019, D-031, D-045, D-051, D-057, D-059, D-062, D-063, PATTERN-005, PATTERN-007. Confirmed 2026-11-27: D-046, C-004 (changed by this plan), Q-077, Q-091. Answered 2026-11-27: Q-087–Q-090. Considered, not applied: D-047.

Assumptions:
- Affected Attempts are those in exams whose results aren't published (one published exam locks the key everywhere, as in P8a).
- The editor shows the last 5 corrections.
