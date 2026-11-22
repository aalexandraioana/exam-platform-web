# Plan — P1b · Question bank schema

**Status:** approved 2026-11-22 · branch `feat/p1b-question-bank-schema` · part of P1 (schema
v2, P1a–P1d; see [application-roadmap.md](application-roadmap.md)).

## Size
**M** — 6 tables (pools, topic labels, questions, barem steps, two link tables), 4 enums, 4
models, factories, Pest tests. No endpoints or UI.

## Approach
- Same style as P1a (nearest example): new migrations, value checks in the database, PHP
  enums in the models, nothing that decides ownership or status mass-assignable.
- An Examiner's **bank** is all their questions (`questions.examiner_id`), not a table
  (D-041). **Pools** are named groups inside it; a question can be in several pools or none.
- Database checks for simple fixed rules: a Draft needs only section and type; Ready needs
  statement, points, competence, grade level and difficulty (D-042); a barem only on Subject
  II (D-031); only Ready questions in the library (D-040); type tied to section.
- **Library in the same table** (D-040): a library entry is a `questions` row with
  `published_to_library_at` set and `copied_from_id` pointing to its source; the same column
  links a copy to the library entry it came from. A separate table was rejected (duplicate
  columns, barem and labels).
- Every foreign key is indexed unless it leads a unique key (lesson from the PR #1 review).

## Tables
| Table | Key columns | Constraints |
|---|---|---|
| `pools` | `examiner_id`, `name` | unique (examiner, name) |
| `topic_labels` | `examiner_id`, `name` | unique per Examiner, ignoring case |
| `questions` | `examiner_id`, `code`, `section`, `type`, `status` (draft default), `grade_level` (5–8), `difficulty`, `competence_id`, `points`, `statement`, `answer_key` JSON, `parameters` JSON, `uses_barem`, `explanation`, `published_to_library_at`, `copied_from_id` | unique code; points ≥ 0; structured_problem ⇔ Subject II; Ready ⇒ statement, points, competence, grade, difficulty; barem ⇒ Subject II; library entry ⇒ Ready |
| `pool_question` | `pool_id`, `question_id` | unique pair; both cascade |
| `question_topic_label` | `question_id`, `topic_label_id` | unique pair; both cascade |
| `barem_steps` | `question_id`, `position`, `description`, `points` | unique (question, position); points ≥ 0; cascade with question |

Delete rules: an Examiner who owns pools, labels or questions can't be deleted; a competence
used by a question can't be deleted; deleting a question removes its pool and label links and
its barem; deleting a library entry's source empties `copied_from_id`. (P1c: a pool used by an
Exam Item can't be deleted.)

## Files
| Action | Path | What |
|---|---|---|
| create | `backend/database/migrations/2026_11_22_19000x_*` (6) | The tables above |
| create | `backend/app/Enums/{Section,QuestionType,Difficulty,QuestionStatus}.php` | Same values as the DB checks |
| create | `backend/app/Models/{Pool,TopicLabel,Question,BaremStep}.php` | Relations and casts; fillable content fields only |
| modify | `backend/app/Models/{User,Competence}.php` | `pools()`, `topicLabels()`, `questions()`; `Competence::questions()` |
| create | `backend/database/factories/{Pool,TopicLabel,Question,BaremStep}Factory.php` | Question states `ready()`, `subjectTwo()`, `withBarem()`, `inLibrary()` |
| modify | `backend/tests/Feature/Schema/MigrationsTest.php` | New tables in the round trip |
| create | `backend/tests/Feature/Schema/QuestionBankSchemaTest.php` | Tests below |
| modify | `CONTEXT.md` | Bank (Bancă de întrebări), Pool (Set de întrebări), Topic label (Etichetă); Item, Variant, Exam, Draft, Ready follow D-042/D-043 |
| modify | `README.md`, `docs/agents/ARCHITECTURE.md`, `docs/plans/application-roadmap.md` | References to D-025/D-032 follow D-043/D-042; storage table; roadmap P1b/P1c/P5/P6 |

## Tests (Pest, on Postgres)
1. Migrations round trip, including the new tables.
2. A question saves with only section and type; defaults to Draft, not in the library, no barem.
3. Ready refused unless statement, points, competence, grade level and difficulty are set.
4. Codes unique; grade outside 5–8, negative points and unknown values refused.
5. Type must match section; a barem on a Subject I question is refused.
6. Only a Ready question can be a library entry; deleting its source keeps the entry.
7. A question can be in several pools, once per pool; deleting a pool keeps its questions; pool names unique per Examiner.
8. Several labels per question; label names unique per Examiner ignoring case; deleting a label only detaches it.
9. Barem step positions unique per question, points ≥ 0, deleted with the question.
10. A competence used by a question can't be deleted.
11. Relations: examiner → pools → questions → labels / barem / competence; library entry → source.
12. Foreign keys indexed (questions' examiner, competence, source; question side of both link tables).

## Sequencing · Risks · Out of scope
- One builder, tests first.
- JSON contents (`answer_key`, `parameters`) are containers until P4a/P4b; same-Examiner
  ownership of a question's pools, labels and competence is enforced in P4b, not the database.
- Out of scope: app logic and screens (P4b), formula evaluation (P4a), seeding (P4c), exams
  (P1c), attempts (P1d).

## Knowledge used
Confirmed: D-001, D-003, D-005, D-008, D-009, D-013, D-017, D-027 (wording "bank"), D-029,
D-031, D-036, D-039, D-040, D-041, D-042 (supersedes D-032), D-043 (supersedes D-025),
PATTERN-001. Q-035 (not applicable), Q-036 and Q-037 answered.
Assumptions confirmed: codes unique platform-wide; pool names unique per Examiner, topic labels
unique per Examiner ignoring case; RO words Bancă de întrebări, Set de întrebări, Etichetă;
structured_problem is the only Subject II type.
