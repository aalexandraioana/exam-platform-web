# Plan — P6c: Subject I grading (twist part 2: answers checked per Attempt)

Status: approved 2026-11-25 (D-046 deferred to P8, the assumptions) · Covers D-005, D-006, D-017, D-019, D-045 · Builds on P4a
(`AnswerMatcher`), P6a (snapshot, `option_order`, drawn answer), P6b (submit, sealing)
· next: P6d (photos), P7 (screens), P8 (Subject II grading, publication, D-046 recalculation)

## Size
S. One grading service called from the two places an Attempt becomes submitted; no new endpoint,
no schema change, no UI.

## Approach
- **`Support/Attempts/Grader::subjectOne(Attempt)`**, run in the same transaction (and under the
  same row lock) as the change to `submitted`, in `Sealer::submit()` and `Sealer::sealIfExpired()`.
  So a submitted Attempt always has its Subject I score, whether the Candidate submitted, a save
  came too late, a read sealed it, or the cron did.
- For every Subject I item, from the stored snapshot only (never the current question, so a later
  edit can't change a submitted Attempt's score):
  - **Choices:** the Candidate's shown positions are mapped back to original positions through
    `option_order` (shown *k* = `option_order[k-1]`, the rule P6a tested), then compared with the
    stored key: single choice equal, multiple choice the same set (D-005: no partial credit).
  - **True/false:** the stored boolean.
  - **Short answer:** P4a's `AnswerMatcher` with the stored key and, for a question with values,
    the **drawn answer** of this Attempt (D-006 tolerance 0, D-017 comma/point, fraction form,
    text without case, spaces or diacritics). This is the twist's "correct answer computed per
    Attempt from the generated values".
  - Unanswered or cleared → 0.
  - Score: the Item's full points or 0 (D-005), never negative.
- **Stored:** each Subject I answer gets `awarded_points` and `graded_at` (`graded_by` stays null:
  automatic). An item never answered gets an answer row with no value, version 0 and 0 points, so
  P10's Item Analysis counts it as wrong rather than missing. The Attempt gets
  `subject_1_score` = the sum (0–30).
- **Not shown** (D-019): the read stays as it is; no score or correctness leaves the server before
  publication. Status stays `submitted`; `graded` and `total_score` come with Subject II (P8).
- Subject II answers are left ungraded (`awarded_points` null) for P8.
- `Grader` recomputes from the snapshot every time, so P8 can reuse it for D-046's recalculation.

Rejected:
- grading at read or at publication (scores must exist for P8's queue and P10, and be fixed at
  submission time)
- grading against the current question (a later edit would silently change submitted scores;
  D-046's recalculation is an explicit, logged action in P8)
- storing only the total (P10 needs per-item correctness)

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Support/Attempts/Grader.php` | Subject I scoring from the snapshot |
| edit | `backend/app/Support/Attempts/Sealer.php` | call the Grader when an Attempt becomes submitted |
| add | `backend/tests/Feature/Attempts/GradeTest.php` | below |
| edit | `docs/API.md` (one line: Subject I scored at submission, not shown), `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | |

C-006: unchanged (no field added or removed); consumers unaffected.

## Tests (Pest, written first)
| # | Behaviour |
|---|---|
| 1 | Single choice: the shown position of the correct option scores full points, over many seeds (the shuffle varies); any other position 0 |
| 2 | Multiple choice: exactly the correct set scores; a subset, a superset or one wrong option 0 |
| 3 | Choice options filled from values: the correct text's shown position scores, over many seeds |
| 4 | Short answer with values: the drawn answer for this Attempt scores; another Attempt's answer (other values) does not; "2,5" = "2.5"; a fraction in another form 0; text without diacritics |
| 5 | True/false right and wrong; unanswered and cleared answers 0, with an answer row for each unanswered Subject I item |
| 6 | `subject_1_score` = the sum; Subject II answers untouched; status stays submitted; no total |
| 7 | Grading runs on every route to submitted: submit, late submit, save after the grace, seal on read, the cron command |
| 8 | Editing the question after submission doesn't change the score (the snapshot is used) |
| 9 | The read and the exam list still show no score or correctness (D-019) |

## Design
None.

## Sequencing
One builder.

## Risks
- A Subject I item whose question type can't be auto-graded (a structured problem placed in
  Subject I) scores 0. The blueprint draws by section, so this needs a mis-set question; it is
  visible to the Examiner in P8.
- Grading adds a few queries inside the submit transaction (about ten items): negligible.

## Out of scope
D-046 recalculation after a key correction (P8, with the barem recalculation); Subject II grading,
publication, `graded`, `total_score` and the score policy (D-012) across Attempts (P8/P9); showing
results (P9); photos (P6d).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-046 | key corrections recalculate until publication | out of scope here; the Grader is reusable for it in P8 | confirm the deferral |
| 6 entries confirmed before, unchanged: D-005, D-006, D-017, D-019, D-045, D-012 | | full points or 0, no negatives; tolerance 0 and the drawn answer; matching rules; nothing shown before publication; options mapped through the stored order; score policy later | — |
| C-006 | Attempts API | unchanged | confirmed 2026-11-25 |
| PATTERN-007 | lock the row a state-dependent write checks | grading runs under the submit/seal lock | candidate (followed, not copied) |

### Considered, not applied
- D-031 (barem), D-026/D-048 (photos): Subject II, P8/P6d. D-047 (weak items): P10.

### Assumptions (no entry behind them)
- An unanswered Subject I item gets an answer row with 0 points (for P10).
- Automatic grading leaves `graded_by` empty.
