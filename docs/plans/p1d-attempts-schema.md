# Plan — P1d · Attempts & answers schema

**Status:** approved 2026-11-22 · branch `feat/p1d-attempts-schema` · last part of P1 (schema
v2; see [application-roadmap.md](application-roadmap.md)).

## Size
**M** — 5 tables (`attempts`, `attempt_items`, `answers`, `answer_images`,
`answer_barem_scores`), 1 enum, 5 models, factories, Pest tests. No endpoints or UI.

## Approach
- Same style as P1a–P1c: new migrations, simple rules as database constraints, PHP enums,
  nothing that decides state or scores mass-assignable.
- An Attempt stores what can't change afterwards: its start and deadline (`expires_at` =
  start + the Exam's duration at that moment, D-021), a seed for reproducing the draw, and per
  Item the picked question, drawn values, expected answer and a snapshot of what the Candidate
  saw, including the shuffled option order (D-006, D-043, D-045).
- Database rules: no question twice in one Attempt (unique attempt + question, D-043); one
  answer per Attempt Item; at most 3 photos per answer (D-026); known statuses; scores within
  D-005's limits (Subject I 0–30, Subject II 0–60, total 0–100); submitted or graded ⇒
  submission time; graded ⇒ total.
- The Grace Period isn't stored: D-004 fixes 30 s; P6 reads it from config.
- History protected: an Exam, Candidate, Exam Item or question an Attempt refers to can't be
  deleted; deleting an Attempt deletes its Items, answers, photos and barem scores; deleting a
  barem step deletes its scores (D-031).
- Indexes on every foreign key no unique key covers, plus (status, expires_at) for D-044's
  sealing query.

## Tables
| Table | Key columns | Constraints |
|---|---|---|
| `attempts` | `exam_id`, `candidate_id`, `attempt_number` (≥ 1), `status`, `seed`, `started_at`, `expires_at`, `submitted_at`, `auto_submitted`, `subject_1_score`, `subject_2_score`, `total_score` | unique (exam, candidate, number); expires after start; submitted/graded ⇒ submitted_at; graded ⇒ total; D-005 score limits; index (status, expires_at) |
| `attempt_items` | `attempt_id`, `exam_item_id`, `question_id`, `position`, `question_snapshot`, `drawn_values`, `expected_answer` | unique (attempt, Item); unique (attempt, question); question and Item restricted |
| `answers` | `attempt_item_id`, `answer`, `version` (≥ 0), `saved_at`, `marked_for_review`, `awarded_points` (≥ 0), `adjustment`, `comment`, `needs_recheck`, `graded_by`, `graded_at` | unique attempt_item |
| `answer_images` | `answer_id`, `position` (1–3), `path`, `original_name`, `mime_type`, `size_bytes` | unique (answer, position) |
| `answer_barem_scores` | `answer_id`, `barem_step_id`, `points` (≥ 0) | unique pair; cascade with answer and step |

## Files
| Action | Path | What |
|---|---|---|
| create | `backend/database/migrations/2026_11_22_21000x_*` (5) | The tables above |
| create | `backend/app/Enums/AttemptStatus.php` | started, in_progress, submitted, graded |
| create | `backend/app/Models/{Attempt,AttemptItem,Answer,AnswerImage,AnswerBaremScore}.php` | Relations, casts; state, scores, seed, deadline, snapshot and grading fields set by trusted code only |
| modify | `backend/app/Models/{User,Exam,ExamItem,Question,BaremStep}.php` | Attempt relations |
| create | `backend/database/factories/…` (5) | `submitted()`, `graded()`, `autoSubmitted()` |
| modify | `backend/tests/Feature/Schema/MigrationsTest.php` | New tables in the round trip |
| create | `backend/tests/Feature/Schema/AttemptsSchemaTest.php` | Tests below |
| modify | `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | Storage and data flow; P1d status; P1 complete |

## Tests (Pest, on Postgres)
1. Migrations round trip, including the new tables.
2. A new Attempt starts as `started`, not auto-submitted, with no scores.
3. Refused: Attempt number < 1, a repeated number, unknown status, deadline not after start, submitted without a submission time, graded without a total, scores outside 0–30 / 0–60 / 0–100.
4. The same question can't be drawn twice in one Attempt; an Item is drawn once per Attempt.
5. One answer per Attempt Item; version ≥ 0; awarded points ≥ 0.
6. Photo positions 1–3 only, unique per answer.
7. One barem score per answer and step, ≥ 0; deleting a step deletes its scores.
8. An Exam, Candidate, Exam Item or question an Attempt uses can't be deleted; deleting an Attempt deletes its Items, answers, photos and scores.
9. Relations: candidate → attempts → items → question / answer → photos / barem scores; exam → attempts.
10. Indexes on the uncovered foreign keys and (status, expires_at).

## Out of scope
State-machine transitions, draw, timer and Grace Period, autosave and versions, uploads and HEIC
(P6); Subject I auto-grading and D-046's correction log (P6/P8); Item Analysis (P10). Limits
spanning tables (awarded points ≤ Item points, barem score ≤ step points) are app rules (P6/P8).

## Knowledge used
Confirmed: D-001, D-003, D-004, D-005, D-006, D-008, D-009, D-012, D-013, D-019, D-021, D-031,
D-036, D-042, D-043, D-044, D-045, D-046, D-048, PATTERN-001. D-026 applies as written (its
"D-011 still holds" wording was flagged and left unchanged). PATTERN-004 stays a candidate.
Assumptions approved with the plan: deadline fixed at start; Grace Period in config (30 s); the
10 MB photo limit is checked at upload; scores empty until grading, and the 1–10 grade is
total ÷ 10, not stored.
