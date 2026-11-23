# Plan — P2b: first and last name, and placeholders

**Status:** approved 2026-11-23 · requested by the user after P3

## Size
S–M. One migration, the auth and classes contracts (C-001, C-002), the registration form
(DS-002) and the tests that create or check names.

## Approach
Replace `users.name` with `first_name` and `last_name` (both required, up to 100
characters). A migration fills them from the existing names by splitting at the last space;
there are only a few real accounts so far: the Administrator, one Examiner and maybe a test
Candidate. A one-word name becomes the first name, with an empty last name. `User::name`
becomes a read-only accessor, "Prenume Nume", so every place that only shows a name keeps
working.

The API **adds** `first_name` and `last_name` to every user and Candidate object and keeps
`name` as the full name, so existing readers don't break. Registration takes `first_name` and
`last_name` instead of `name`. Rosters and request lists sort by last name, then first name,
as in a school register.

`app:create-user` takes `<email> <first name> <last name>`. On DS-002 (mock updated today), the
fields are Prenume and Nume, side by side from tablet width and stacked on phones, with
placeholders "Ana", "Popescu" and "nume@exemplu.ro". Password fields get no placeholder, and the
default state is empty.

**Rejected:** keeping one column and joining the two fields (no reliable sort by last name; your
choice today).

## Files
| Action | Path | What |
|---|---|---|
| create | `backend/database/migrations/2026_11_23_…_split_user_names.php` | add `first_name`, `last_name`; fill from `name`; drop `name` (down: rebuild `name`) |
| modify | `backend/app/Models/User.php` | fillable `first_name`, `last_name`; `name` accessor |
| modify | `backend/database/factories/UserFactory.php`, `database/seeders/DatabaseSeeder.php` | two names |
| modify | `backend/app/Http/Requests/Auth/RegisterRequest.php`, `AuthController.php` | `first_name`, `last_name` (codes `required`, `invalid`) |
| modify | `backend/app/Http/Resources/UserResource.php` | adds `first_name`, `last_name` |
| modify | `backend/app/Http/Controllers/ClassController.php` | Candidate objects with both names; sort by last name |
| modify | `backend/app/Console/Commands/CreateUser.php` | `{role} {email} {first_name} {last_name}` |
| modify | backend tests that create users by `name` or check the user shape | setup and the changed contract |
| modify | `frontend/src/api/auth.ts`, `api/classes.ts`, `pages/RegisterPage.tsx`, `i18n/*.json`, tests, e2e mocks | two fields, placeholders |
| modify | `docs/API.md`, `docs/agents/CONTRACTS.md` (C-001, C-002), `docs/design/mocks/DS-002.html`, `registry.yaml`, screenshots | contract and design |

## Tests
| # | Behaviour | Test | Not automated? |
|---|---|---|---|
| 1 | Register needs first and last name (`required` per field); the user has both, and `name` is "Prenume Nume" | Auth/RegisterTest · Pest | |
| 2 | `GET /api/user` returns `first_name`, `last_name` and `name` | Auth/UserTest · Pest | |
| 3 | The migration splits existing names at the last space (one word → first name) | Schema/SplitUserNamesTest · Pest | |
| 4 | The roster and requests sort by last name, then first name | Classes/ClassTest · Pest | |
| 5 | `app:create-user` takes and stores both names | Console/CreateUserTest · Pest | |
| 6 | The form has Prenume and Nume with placeholders, checks both, sends both, and maps the 422 codes | RegisterPage.test.tsx · Vitest | |
| 7 | DS-002 screenshots, light and dark, 1440 and 320 px | e2e/screens.spec.ts · Playwright | compared by eye |
| 8 | Live: the existing accounts still log in and show their names | | manual after merge |

**Assertions that change with the contract:** the register tests' `name` field becomes
`first_name`/`last_name`, the user-shape test gains the two fields, the create-user tests' arguments
change, and the frontend tests look for the "Prenume"/"Nume" labels instead of "Nume și prenume".
Tests that check a displayed full name stay as they are (`name` is kept).

## Risks
- **The migration runs on the live database at deploy.** It's reversible (the down step rebuilds
  `name`), and the split only matters for the few existing accounts. Check them after deploy.
- **Names with more than two words** ("Ana Maria Popescu") split as first "Ana Maria", last
  "Popescu", which is right for Romanian names. Compound last names written last stay split
  wrong, but there's no edit-name screen yet.

## Out of scope
An edit-name screen. Showing the name as "Nume Prenume" anywhere (it stays "Prenume Nume").

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| C-001 | Auth API: the user object, register body | **changes:** register body, user object (additive) | PROPOSAL below |
| C-002 | Classes API: Candidate objects | **changes:** adds both names, new sort order | PROPOSAL below |
| DS-002 | Registration mock (approved) | **changes:** two name fields, placeholders, empty default state | confirm the new mock |

Unchanged and followed: D-020 (Examiners created by the operator), D-028, D-050, D-051,
D-053, PATTERN-005 (codes), PATTERN-004 (constraints in the migration).

### Assumptions
1. Both names are required, up to 100 characters each.
2. The full name shown everywhere is "Prenume Nume".
3. Sorting is by last name, then first name, case-insensitive.
