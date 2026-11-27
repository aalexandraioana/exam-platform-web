# Patterns — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Plan-then-build execution · approved
- PATTERN-002 · Styled native select · candidate
- PATTERN-003 · Tokens-only Tailwind theme · candidate
- PATTERN-004 · Fixed data rules as Postgres constraints, tested by refusal · candidate
- PATTERN-005 · Validation errors as codes, not sentences · candidate
- PATTERN-006 · An account state that blocks the app: one API refusal code, one SPA screen · candidate
- PATTERN-007 · A write that depends on a row's state locks that row first · candidate
- PATTERN-008 · Dialog buttons in equal halves through DialogActions · candidate
- PATTERN-009 · A file import checks the whole file, then inserts in one transaction · candidate
- PATTERN-010 · Frontend tests run in the users' time zone · candidate

---

## PATTERN-001 · Plan-then-build execution
- **Status:** approved
- **Confirmed:** 2026-11-26
- **Use when:** Implementing features, refactorings, or modifications spanning multiple files or logic boundaries.
- **How:** Run `/plan` to define size, approach, tests, and files; confirm knowledge; execute via `/build`.
- **Example:** AGENTS.md:23
- **Why:** Prevents implementation drift, unapproved dependencies, and untested code.
- **Source:** user · confidence high

## PATTERN-002 · Styled native select
- **Status:** candidate
- **Use when:** Any dropdown choice (filters, form fields).
- **How:** Keep the native `<select>` (accessible, phone-friendly popup) but set `appearance: none`; draw the Lucide chevron-down in `text-secondary` as a background icon (a theme-level `--icon-chevron`); same height, padding, radius and `border-input` as text inputs; hover tints the background; disabled at 50% opacity. Set `color-scheme: dark` in the dark theme so the open list and native controls follow it.
- **Example:** docs/design/mocks/shared/mock.css (`.select`, `--icon-chevron`); frontend/src/components/SelectField.tsx (`select-native` in index.css); DS-007 filters and editor
- **Why:** Native selects looked out of place in the warm theme and stayed light in dark mode; user feedback 2026-11-22.
- **Source:** user · confidence medium

## PATTERN-003 · Tokens-only Tailwind theme
- **Status:** candidate
- **Confirmed:** 2026-11-26
- **Use when:** Styling any frontend component.
- **How:** Design tokens live once, as CSS variables in `frontend/src/index.css` (`:root` for light, `[data-theme='dark']` for dark). `frontend/tailwind.config.js` *replaces* (does not extend) the theme keys for colors, spacing, radii, shadows, font sizes and screens with `var(--token)` references, so the default palette and scale are unavailable and a raw value cannot slip in as a utility class. Class names drop the token's group prefix: `bg-surface`, `text-secondary`, `border-input`, `text-h1`, `rounded-lg`, `shadow-subtle`.
- **Example:** frontend/tailwind.config.js; frontend/src/App.tsx
- **Why:** DESIGN.md requires tokens only in component code; dark mode then needs no `dark:` variants because the variables switch.
- **Source:** agent · confidence medium

## PATTERN-004 · Fixed data rules as Postgres constraints, tested by refusal
- **Status:** candidate
- **Confirmed:** 2026-11-26
- **Use when:** A data rule is simple and never depends on who is asking: allowed values, ranges, "if X then Y must be set", uniqueness, delete behaviour.
- **How:** Enforce it in the migration: `enum` columns (CHECK constraints) with values from the PHP enum's `values()` (`App\Enums\Concerns\HasValues`), named `ALTER TABLE … ADD CONSTRAINT … CHECK (…)` for conditions, unique keys (an expression index for case-insensitive names), and explicit `restrictOnDelete` / `cascadeOnDelete` / `nullOnDelete`. Index every foreign key that no unique key leads with (Postgres doesn't index foreign keys). Test each rule with `expectRefused()` from `tests/Pest.php` (it wraps the statement in a savepoint, so the test continues), and send invalid values with `DB::table()` so the model's enum cast doesn't refuse them first. Rules that depend on the user or on several rows (ownership, sums) stay in application code.
- **Example:** backend/database/migrations/2026_11_22_190002_create_questions_table.php; backend/tests/Feature/Schema/QuestionBankSchemaTest.php
- **Why:** The database refuses bad data whatever code path writes it, and the review of PR #1 found two unindexed foreign keys.
- **Source:** agent · confidence medium

## PATTERN-005 · Validation errors as codes, not sentences
- **Status:** candidate
- **Confirmed:** 2026-11-27
- **Use when:** An API request is validated (FormRequest or a thrown `ValidationException`).
- **How:** `messages()` maps each rule to a code from docs/API.md → Errors (`required`, `invalid`, `too_short`, `mismatch`, `taken`, `not_found`, `credentials`); `bootstrap/app.php` renders every API `ValidationException` as `{"message": "The given data was invalid.", "errors": {field: [code]}}`. The SPA turns codes into RO/EN text. A new code is added to docs/API.md in the same change. Tests assert the code (`assertJsonPath('errors.email.0', 'taken')`).
- **Example:** backend/app/Http/Requests/Auth/RegisterRequest.php; backend/tests/Feature/Auth/RegisterTest.php
- **Why:** The UI is bilingual (D-022) and its texts live in the SPA; codes keep the API language-neutral and the contract testable.
- **Source:** agent · confidence medium

## PATTERN-006 · An account state that blocks the app: one API refusal code, one SPA screen
- **Status:** candidate
- **Use when:** A user must do one thing before using the app (e.g. replace a temporary password, D-054).
- **How:** A boolean on `users`, set only by trusted code and exposed on the user object. A route middleware (`EnsurePasswordCurrent`, alias `password.current`) wraps every route except `GET /user`, `POST /logout` and the one action, and answers `403` with its own `code` (docs/API.md → Errors). The SPA reads the flag: `ProtectedRoute` and `RootRedirect` send the user to the single screen (`landingPath`), and `AppHeader` shows the signed-out header there. Tests: each role is refused elsewhere with the code; the screen is reached from any protected path.
- **Example:** backend/app/Http/Middleware/EnsurePasswordCurrent.php; backend/tests/Feature/Auth/ChangePasswordTest.php; frontend/src/auth/ProtectedRoute.tsx; frontend/src/pages/ChangePasswordPage.tsx
- **Why:** The server enforces the state even for a client that ignores it, and the SPA needs one check, not one per page.
- **Source:** agent · confidence medium


## PATTERN-007 · A write that depends on a row's state locks that row first
- **Status:** candidate
- **Confirmed:** 2026-11-26
- **Use when:** Concurrent requests may both pass a check on the same record (one open Attempt, its deadline, its status) before either writes.
- **How:** In one `DB::transaction`, re-read the record with `lockForUpdate()`, check, write, return. A refusal that must persist (e.g. sealing on `time_up`) is returned from the transaction and thrown after it commits. Keep the database's own unique keys behind it and map their violation to the same `409` code. Verify with a parallel run (20 requests through `php artisan serve` with `PHP_CLI_SERVER_WORKERS`), once with the lock removed as a control.
- **Example:** backend/app/Support/Attempts/Starter.php (start), Saver.php (autosave), Sealer.php (submit, seal)
- **Why:** Pest runs requests one at a time, so only the lock and the unique key make the checks hold under load; checked 2026-11-25 (start: 1 × 201 and 19 × 409; saves: highest version kept, no 500s).
- **Source:** agent · confidence medium

## PATTERN-008 · Dialog buttons in equal halves through DialogActions
- **Status:** candidate
- **Confirmed:** 2026-11-26
- **Use when:** A dialog ends with its actions (cancel and confirm, or cancel and a destructive action).
- **How:** Wrap the buttons in `components/DialogActions` (mock.css `.modal-actions`): a two-column grid, each button full width and centred. A third action, such as delete in an edit dialog, gets `className="col-span-2"` and sits on its own row above. Cancel comes first, the main action second. Never a bare `justify-end` row.
- **Example:** frontend/src/components/DialogActions.tsx; frontend/src/pages/admin/UsersPage.tsx; frontend/src/pages/examiner/exams/ItemDialog.tsx
- **Why:** Buttons as wide as their labels looked unbalanced next to each other (user, 2026-11-25); one component keeps all dialogs alike.
- **Source:** user · confidence high

## PATTERN-009 · A file import checks the whole file, then inserts in one transaction
- **Status:** candidate
- **Use when:** Data is loaded into the database from a file a person writes (an artisan command, not an API request).
- **How:** First pass: parse the file and check every record's shape with `Validator::make`, reusing the request rules (`CodeRules`, `TypeFitsSection`); collect every error, labelled by the record's code, and stop with nothing written if there is one. Second pass, inside `DB::transaction`: insert-only, keyed on the stable code (an existing code is skipped and reported, never updated); find-or-create the owner's own lists; let the domain check (`Readiness`) decide the status rather than refusing. Print one line per fact, so tests can match each with `expectsOutputToContain` (it consumes a line per match). Tests write fixtures with `tempnam` and pass them through a `--file` option.
- **Example:** backend/app/Console/Commands/LoadQuestions.php; backend/tests/Feature/Console/LoadQuestionsTest.php
- **Why:** A half-loaded file is worse than none, and re-running must be safe (D-029).
- **Source:** agent · confidence medium

## PATTERN-010 · Frontend tests run in the users' time zone
- **Status:** candidate
- **Confirmed:** 2026-11-27
- **Use when:** A Vitest test checks a date or time as the user sees it (for example "30.11.2026, 14:00").
- **How:** Write the fixture in UTC (`2026-11-30T12:00:00+00:00`) and assert the Romanian local time (14:00). `vitest.config.ts` sets `process.env.TZ = 'Europe/Bucharest'` before the workers start, as `playwright.config.ts` sets `timezoneId`. Never rely on the machine's own zone.
- **Example:** frontend/vitest.config.ts; frontend/src/pages/examiner/GradingPage.test.tsx
- **Why:** The DS-009 tests passed on a laptop in Romania and failed on CI in UTC (PR #14, 2026-11-27).
- **Source:** agent · confidence medium
