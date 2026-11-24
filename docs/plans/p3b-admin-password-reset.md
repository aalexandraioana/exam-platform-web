# Plan — P3b: the Administrator sets temporary passwords; forced change at next sign-in

Status: approved 2026-11-24 · Covers D-054 (supersedes D-020), D-055, D-056, Q-042, Q-043, Q-044 · Mocks DS-011, DS-018, DS-013 confirmed 2026-11-24

## Size
M. A new column, two new endpoints and one removed endpoint, a middleware, two new screens
(DS-011 minimal, DS-018), and the DS-013 button removed.

## Approach
`users` gets a column `must_change_password` (boolean, default false). The Administrator sets a
password with `PUT /api/admin/users/{id}/password`. That sets the flag, and the existing
`User::booted` hook revokes the user's tokens. While the flag is set, a new `password.current`
middleware answers every authenticated route `403 password_change_required`, except
`GET /user`, `POST /logout` and the new `PUT /user/password`. That last route takes
`password` + `password_confirmation`, refuses the temporary password (`same_as_temporary`),
clears the flag and returns a new token: the password change revokes the current token, so the
user stays signed in this way.

`app:create-user` sets the flag too. The Examiner's route `PUT /classes/{id}/candidates/{userId}/password`
and its dialog are removed. `SetPasswordRequest` moves to the admin controller and is reused.

On the frontend, the user object carries `must_change_password`. `ProtectedRoute` and `RootRedirect`
send a flagged user to `/change-password` (DS-018, a single card like DS-002). `/admin` replaces the
placeholder with DS-011: a list of users with search, and per row a "Parolă temporară" button that
opens a dialog with two hidden `PasswordField`s. Its checks are required, then at least 8
characters, then mismatch, as in DS-002.

Rejected: checking the confirmation only on the server for the admin dialog (the API keeps
`{ password }`, the same as the removed endpoint); a separate "temporary password" table (one flag
is enough, since a temporary password never expires).

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/database/migrations/2026_11_24_120000_add_must_change_password_to_users_table.php` | boolean, default false |
| edit | `backend/app/Models/User.php` | cast; not fillable (trusted code only) |
| edit | `backend/app/Http/Resources/UserResource.php` | `must_change_password` |
| add | `backend/app/Http/Middleware/EnsurePasswordCurrent.php` | 403 `password_change_required` |
| edit | `backend/bootstrap/app.php` | middleware alias |
| edit | `backend/routes/api.php` | admin routes; `PUT /user/password`; remove the Examiner route |
| add | `backend/app/Http/Controllers/Admin/UserController.php` | `index` (all users, sorted by last name), `setPassword` |
| move | `backend/app/Http/Requests/Classes/SetPasswordRequest.php` → `Requests/Admin/` | reused |
| add | `backend/app/Http/Requests/Auth/ChangePasswordRequest.php` | min 8, confirmed, not the temporary one |
| edit | `backend/app/Http/Controllers/Auth/AuthController.php` | `changePassword` → new token |
| edit | `backend/app/Http/Controllers/MembershipController.php` | remove `setPassword` |
| edit | `backend/app/Console/Commands/CreateUser.php` | sets the flag |
| delete | `backend/tests/Feature/Classes/SetPasswordTest.php` | feature removed (see Tests) |
| add | `backend/tests/Feature/Admin/UserTest.php`, `backend/tests/Feature/Auth/ChangePasswordTest.php` | |
| edit | `backend/tests/Feature/Console/CreateUserTest.php`, `Auth/UserTest.php` | flag |
| edit | `frontend/src/api/auth.ts`, `api/classes.ts`; add `api/admin.ts` | |
| edit | `frontend/src/auth/ProtectedRoute.tsx`, `App.tsx`, `AuthProvider.tsx` | redirect, route, swap token |
| add | `frontend/src/pages/ChangePasswordPage.tsx` (+ test) | DS-018 |
| add | `frontend/src/pages/admin/UsersPage.tsx` (+ test) | DS-011 |
| edit | `frontend/src/pages/examiner/ClassesPage.tsx` (+ test) | remove the button and `PasswordDialog` |
| edit | `frontend/src/i18n/ro.json`, `en.json` | new strings; remove the Examiner's |
| add | `docs/design/mocks/DS-011.html`, `DS-018.html` | drawn and confirmed **before code** |
| edit | `docs/design/mocks/DS-013.html`, `registry.yaml` | button and dialog removed; DS-011 → approved, DS-018 added |
| edit | `docs/API.md`, `docs/agents/CONTRACTS.md`, `CONTEXT.md`, `docs/plans/application-roadmap.md` | see Knowledge used |
| add | `e2e/` screenshots: DS-011, DS-018, DS-013 | light and dark, desktop and 320 px |

## Tests (first)
| # | Behaviour | Test |
|---|---|---|
| 1 | Admin sets a password: 204, flag set, the user's tokens revoked | Pest · Admin/UserTest |
| 2 | Admin endpoint: 422 `required`/`too_short`; 404 for an unknown user; 403 `forbidden_role` for Examiner and Candidate | Pest |
| 3 | Admin list: every user with role and active status, sorted by last name | Pest |
| 4 | Flagged user: login 200 with `must_change_password: true`; `GET /user` 200; other routes 403 `password_change_required` | Pest · ChangePasswordTest |
| 5 | Change: 422 `too_short`, `mismatch`, `same_as_temporary`; on success the flag is cleared, a new token works, the old one doesn't | Pest |
| 6 | Change without the flag: 403 (no voluntary change was asked for) | Pest |
| 7 | `app:create-user` sets the flag | Pest · CreateUserTest |
| 8 | Examiner route gone: `PUT /classes/{id}/candidates/{userId}/password` → 404/405 | Pest · OwnershipTest or ClassTest |
| 9 | Flagged user is sent to `/change-password` from any page; after the change they reach their home | Vitest · ProtectedRoute / ChangePasswordPage |
| 10 | DS-018: fields hidden with show/hide; length, mismatch, same-as-temporary errors | Vitest |
| 11 | DS-011: search; dialog fields hidden; mismatch blocks the PUT; success closes and says so | Vitest |
| 12 | DS-013: no "Parolă nouă" button | Vitest · ClassesPage.test |

**Existing tests removed (approved 2026-11-24):** `SetPasswordTest.php` and the
ClassesPage test "sets a new password for a candidate…" are deleted, because the feature they
test is removed by D-054. No other assertion changes.

## Design
- DS-011 (draft → mock → approved). Scope: users table (name, email, role, active), search,
  "Parolă temporară" per row, the dialog (empty, errors, saving, offline error), success notice,
  long names, 320 px.
- DS-018 (new, `auth-change-password`). Card as in DS-001/DS-002: title, short reason
  ("Parola ta a fost resetată…"), two fields, button; errors; light and dark.
- DS-013: the button and the dialog are removed from the mock.
- Mocks are published to the design board and confirmed by you before any screen code.

## Sequencing
1. Mocks DS-011, DS-018, DS-013 → your confirmation.
2. One builder: backend (tests → code), then frontend, then screenshots.

## Risks
- Pilot on 30 Nov: candidates who forget a password now need you (the Administrator). Create
  your Administrator account on the live site before the pilot.
- Existing accounts keep the flag false (no forced change on deploy).
- The schedule (deadline 3 Dec) gains about one day; P4a/P4b move accordingly.

## Added on 2026-11-24 (your answer)
- DS-011 also creates Examiner accounts (first name, last name, email, temporary password typed
  twice; the account starts with `must_change_password`) and deactivates users (the existing
  `is_active`; tokens are already revoked and login refused). Endpoints in C-003:
  `POST /api/admin/examiners`, `PATCH /api/admin/users/{id}` (`is_active`). Details in the open
  points below. Deactivation (D-056): Candidates and Examiners only (403 `forbidden_target` for an
  Administrator), permanent (`is_active: true` is refused with 422 `invalid`; an already
  deactivated user answers 409 `already_deactivated`).
- Roles are fixed: no role change anywhere (proposed as D-055).

## Out of scope (until you say otherwise)
- Changing roles (fixed); creating Administrators on the screen (stays `app:create-user`);
  DS-012 exam supervision.
- Changing your own password voluntarily.

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-054 | Only the Administrator sets passwords; temporary; forced change, different from the temporary one; no expiry; new Examiner accounts too | the rule this plan builds | approved 2026-11-24 |
| Q-042 | Your answers of 2026-11-24 | source of D-054 | answered |
| C-001 | Auth API | **change approved 2026-11-24:** user gains `must_change_password`; new 403 `password_change_required`; new `PUT /api/user/password`. Consumers: `frontend/src/api/auth.ts`, `api/client.ts` | confirm change |
| C-002 | Classes API incl. set password | **change approved 2026-11-24:** set-password route removed. Consumer: `frontend/src/api/classes.ts` | confirm change |
| C-003 (new, approved 2026-11-24) | Admin API: `GET /api/admin/users`, `PUT /api/admin/users/{id}/password`, `POST /api/admin/examiners`, `PATCH /api/admin/users/{id}` | provided by this plan; consumer `frontend/src/api/admin.ts` | confirm add |
| D-050 | Bearer tokens; password change logs out everywhere | why the change endpoint returns a new token | confirm |
| D-022 | RO/EN UI | new strings in both | confirm |
| D-033, D-035 | Lucide only; warm visual system | mocks and screens | confirm |
| PATTERN-005 | Validation errors as codes | `same_as_temporary`, `password_change_required` | confirm |
| PATTERN-004 | Fixed rules as Postgres constraints | not applied: the flag is a default, not a rule | — |
| Q-041 | DS-013 roster menu | still open; untouched | open |
