# Plan — P1a · Accounts, competences & classes

**Status:** approved 2026-11-22 · branch `feat/p1a-accounts-competences-classes` · part of P1
(schema v2), split into P1a–P1d (see [application-roadmap.md](application-roadmap.md)).

## Size
**S** — 1 migration changing `users`, 3 new tables, enums, models, factories, Pest tests. No
seeder content, no endpoints, no UI.

## Approach
- **New migrations only** (production has already run the skeleton's `users` migration).
  `role` and `is_active` move here from the auth plan Part 1.
- **Competences** belong to one Examiner: a code plus a Romanian description, code unique per
  Examiner (D-039). Nothing to seed; Examiners create them in the app (P4b).
- **Value checks in the database** (`enum` columns are CHECK constraints on Postgres), cast to
  PHP enums in the models.
- **Delete rules:** a class deletes its memberships; a user who owns classes or competences
  can't be deleted (restricted).

## Files
| Action | Path | What |
|---|---|---|
| create | `…_add_role_and_is_active_to_users_table.php` | `role` (candidate / examiner / administrator, default candidate), `is_active` (default true) |
| create | `…_create_competences_table.php` | `examiner_id`, `code`, `description`; unique (examiner_id, code) |
| create | `…_create_classes_table.php` | `examiner_id`, `name`, `join_code` (unique) |
| create | `…_create_class_memberships_table.php` | `class_id`, `candidate_id`, `status` (pending / accepted / rejected), `requested_at`, `decided_at`; unique (class_id, candidate_id) |
| create | `backend/app/Enums/{Role,MembershipStatus}.php` | Same values as the DB checks |
| create | `backend/app/Models/{Competence,SchoolClass,ClassMembership}.php`; modify `User.php` | Relations and casts (`SchoolClass`: `Class` is reserved in PHP) |
| create/modify | `backend/database/factories/…` | One per model; role states on `UserFactory` |
| create | `backend/tests/Feature/Schema/{MigrationsTest,AccountsCompetencesClassesSchemaTest}.php` | Tests below |
| modify | `CONTEXT.md` | Term **Competence** (RO **Competență**); update **Item** ("specific competence") |
| modify | `docs/agents/ARCHITECTURE.md`; `docs/plans/database-schema.md`, `auth-part-1-backend.md`; `application-roadmap.md` | Storage table; "superseded by P1" header and pointer; P1 split; DS-007/008/009 need mock fixes (topics vs competences, banks) before P4b/P5/P8 |

## Tests (Pest, on Postgres)
| # | Behaviour | Test file |
|---|---|---|
| 1 | All migrations run, roll back and run again cleanly | `MigrationsTest.php` |
| 2 | Role defaults to candidate, `is_active` to true; an unknown role is rejected | `AccountsCompetencesClassesSchemaTest.php` |
| 3 | A competence code is unique per Examiner; another Examiner may use the same code | same |
| 4 | Join codes are unique; one membership per Candidate per class; an unknown status is rejected | same |
| 5 | Deleting a class deletes its memberships; deleting a user who owns a class or a competence is refused | same |
| 6 | Relations: examiner → classes → memberships → candidates; examiner → competences | same |

## Sequencing · Risks · Out of scope
- One builder, tests first.
- Low risk: only new migrations; no data in production yet.
- Out of scope: banks, labels, questions (P1b); exams (P1c); attempts and answers (P1d); auth
  (P2); class logic and screens (P3); competence screens (P4b).

## Knowledge used
Confirmed: D-001, D-003, D-008, D-009, D-015, D-020, D-028, D-036, D-039 (supersedes D-030,
approved at this gate), PATTERN-001.
Assumptions confirmed at the gate: CONTEXT term Competence = RO Competență; rejected join
requests keep their row with status `rejected`, and entering the code again sets it back to
`pending`.
Coming in P1b (approved at its own gate): D-040 library frozen copy (copies competence and
topic labels into the copier's lists), D-041 several banks per Examiner (refines D-027).
