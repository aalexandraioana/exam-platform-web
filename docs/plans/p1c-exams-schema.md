# Plan — P1c · Exams schema

**Status:** approved 2026-11-22 · branch `feat/p1c-exams-schema` · part of P1 (schema v2,
P1a–P1d; see [application-roadmap.md](application-roadmap.md)).

## Size
**S** — 3 tables (`exams`, `class_exam`, `exam_items`), 1 enum, 2 models, factories, Pest tests.
No endpoints or UI.

## Approach
- Same style as P1a/P1b (nearest examples): new migrations, rules as database constraints, PHP
  enums, nothing that decides state mass-assignable.
- An unpublished Exam is a draft: it needs only a title. Completeness (duration, grade, classes,
  Items summing to 30 + 60, a distinct eligible question per Item) is checked when publishing,
  in P5, because those rules span several rows.
- Each Item draws from a pool (D-043): `exam_items` holds section, competence, difficulty,
  points and `pool_id`.
- The baseline 10 points aren't stored: D-005 fixes them; scoring uses a constant.
- Delete rules: deleting an Exam deletes its Items and class links (P1d blocks it once Attempts
  exist); deleting a class removes only its links; a pool or competence used by an Item can't be
  deleted; an Examiner who owns Exams can't be deleted.

## Tables
| Table | Key columns | Constraints |
|---|---|---|
| `exams` | `examiner_id`, `title`, `description`, `grade_level` (5–8), `duration_minutes` (> 0), `available_from`, `available_until`, `max_attempts` (≥ 1, default 1), `score_policy` (highest / latest, default highest), `published_at`, `results_published_at`, `cohort_note` | until after from; results only on a published Exam |
| `class_exam` | `exam_id`, `class_id` | primary (exam, class); both cascade; `class_id` indexed |
| `exam_items` | `exam_id`, `position`, `section`, `competence_id`, `difficulty`, `points` (> 0), `pool_id` | unique (exam, position); competence and pool restricted and indexed |

## Files
| Action | Path | What |
|---|---|---|
| create | `backend/database/migrations/2026_11_22_20000x_*` (3) | The tables above |
| create | `backend/app/Enums/ScorePolicy.php` | `highest`, `latest` (D-012) |
| create | `backend/app/Models/{Exam,ExamItem}.php` | Relations, casts; publish timestamps set by trusted code only |
| modify | `backend/app/Models/{User,SchoolClass,Pool,Competence}.php` | `exams()`, `examItems()` |
| create | `backend/database/factories/{Exam,ExamItem}Factory.php` | `published()`, `resultsPublished()`; an Item's pool and competence belong to the Exam's Examiner |
| modify | `backend/tests/Feature/Schema/MigrationsTest.php` | New tables in the round trip |
| create | `backend/tests/Feature/Schema/ExamsSchemaTest.php` | Tests below |
| modify | `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | Storage table; P1c status; P5 note on same-Examiner classes, pools, competences |

## Tests (Pest, on Postgres)
1. Migrations round trip, including the new tables.
2. A new Exam needs only a title; defaults to unpublished, 1 Attempt, highest score.
3. Refused: duration ≤ 0, max Attempts < 1, grade outside 5–8, unknown score policy, until not after from, results published on an unpublished Exam.
4. An Exam is published to several classes, once each; deleting a class or the Exam removes only the links.
5. Item positions unique per Exam; points > 0; section and difficulty values checked.
6. Deleting an Exam deletes its Items; a pool or competence used by an Item can't be deleted.
7. Relations: examiner → exams → items → pool / competence; exam ↔ classes.
8. Foreign keys no unique key covers are indexed.

## Out of scope
Publish check, Exam builder and screens (P5); attempts, answers and blocking deletion of an Exam
with Attempts (P1d); locking answer key and barem after results are published (P8).

## Knowledge used
Confirmed: D-001, D-003, D-005, D-008, D-009, D-012, D-015, D-019, D-021, D-031, D-036, D-039,
D-041, D-042, D-043, D-046, PATTERN-001. PATTERN-004 stays a candidate (not promoted); the code
follows the P1a/P1b examples.
Assumptions approved with the plan: an Item may be incomplete while the Exam is a draft (only
position and section required); an Exam draft needs only a title and duration has no default;
defaults 1 Attempt and highest score; `description` kept (shown on DS-003).
