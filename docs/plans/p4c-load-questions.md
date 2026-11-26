# Plan — P4c: load questions.yaml into an Examiner's bank

Approved 2026-11-26. Answers: Q-074.

## Size
S — one artisan command, one dependency, one test file, small doc updates. BANK.md's log
structure already exists, so only the loader is left.

## Approach
`php artisan app:load-questions {email} {--file=}`, shaped like `CreateUser`; a command rather
than a `Seeder` class because a seeder can't be told whose bank to fill (D-029's "seeder" read as
this insert-only loader, confirmed). `--file` defaults to `database/seeders/data/questions.yaml`
and exists so tests can load fixtures.

1. **Check the whole file first:** YAML parses; `code` passes `CodeRules` and is unique in the
   file; `section`/`type` valid and fitting (`TypeFitsSection`); competence code + description and
   topic present. Any error: fail with a list by question code, nothing written.
2. **Insert in one transaction:** a code already in the database (any bank or the library) is
   skipped and reported, never updated or deleted (D-029). Competences matched by code, topics by
   name ignoring case, pools by name; created the first time. An existing competence with another
   description keeps its own (warning). `answer` → `answer_key`, `parameters` as is,
   `barem[].step` → `BaremStep` description, `uses_barem` set.
3. **Status** from `Readiness::problems()`: complete → Ready; incomplete → Draft, with the
   problems listed (Q-074).

New dependency `symfony/yaml` (matching the installed Symfony components): nothing installed
parses YAML.

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Console/Commands/LoadQuestions.php` | the command |
| edit | `backend/composer.json`, `composer.lock` | `symfony/yaml` |
| add | `backend/tests/Feature/Console/LoadQuestionsTest.php` | Pest tests |
| edit | `backend/database/seeders/data/questions.yaml`, `questions.template.yaml` | "the seeder (P4c)" → the command; how to run it locally and live |
| edit | `AGENTS.md` §2, `docs/agents/ARCHITECTURE.md` (if it lists commands), README | the command |
| edit | `docs/plans/application-roadmap.md` | P4c row: D-039 → D-058, status |

No API change: C-004 and its consumers are unchanged.

## Tests (Pest · `tests/Feature/Console/LoadQuestionsTest.php`)
1. Every type loads into the named Examiner's bank with answer key, values, barem steps,
   explanation; complete questions are Ready.
2. Competences, topics (case-insensitive) and pools created once and reused; an existing
   competence's description kept, with a warning.
3. A second run skips loaded codes; a question edited in the app stays edited; nothing deleted.
4. A code taken by another bank or a library entry is skipped and reported.
5. A well-formed incomplete question loads as Draft with its problems listed.
6. A broken file (bad YAML, unknown type, type not fitting section, repeated code, bad code,
   missing competence) is refused, nothing written, each error names the question.
7. An email that isn't an active Examiner is refused (D-055, D-056).
8. `questions.template.yaml` loads cleanly; all 9 examples are Ready.
9. An empty `questions:` loads nothing and succeeds.

## Sequencing
One builder, branch `feat/p4c-load-questions` off `main`.

## Risks
- questions.yaml is committed in a public repo: answer keys are public (user's choice, Q-074).
- Live load from the user's machine (no shell on Render's free plan):
  `read -s DB_URL` (URL with `?sslmode=require`), then
  `docker compose exec -e DB_URL api php artisan app:load-questions <email>`. Never in a file or
  in shell history. Optionally limit the Render database's Access Control to your IP while
  loading. Works the same after a move to AWS (Q-073).
- No undo for an insert; questions can be deleted in the app until drawn (Q-056). Load into the
  local database first.

## Out of scope
Writing questions; loading for the local demo Examiner in `DatabaseSeeder`; updating loaded
questions; BANK.md validation rows.

## Knowledge used (all confirmed 2026-11-26)
D-005, D-006, D-008, D-013, D-014, D-017, D-029, D-031, D-040, D-041, D-055, D-056, D-057,
D-058, D-059, PATTERN-001, PATTERN-004, PATTERN-005 (API only; the CLI prints English sentences
like `CreateUser`); Q-022, Q-039, Q-054, Q-073 (open, no dependency), Q-074.
Considered, not applied: PATTERN-007 (one-off CLI run; the unique index catches a race); D-039
(superseded by D-058).
