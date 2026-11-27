# Contracts — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Promises across a boundary. **Provided:** this repo owns the contract; the text
> lives here only. **Consumed:** a link to the provider's entry plus the fields this
> repo relies on. **External:** what we rely on from a third-party service.
> Changing a provided contract is a PROPOSAL (AGENTS.md → The gate) and the plan
> lists the consumers' files too. Status: `approved` · `proposed` · `superseded-by`.
<!-- graffino-agentic:end -->

## Index
- C-001 · Auth API: register, login, logout, current user · provided
- C-002 · Classes API: classes and join requests · provided
- C-003 · Administrator API: users, temporary passwords, Examiners, deactivation · provided
- C-004 · Question bank API: questions, Ready check, preview, lists, library · provided
- C-005 · Exams API: exams, blueprint Items, publish checks, preview · provided
- C-006 · Attempts API (Candidate): exams, start, read, autosave, submit; sealing cron · provided
- C-007 · Grading API (Examiner): queue, grades, published results, photos · provided

---

## Provided

## C-001 · Auth API: register, login, logout, current user
- **Status:** approved
- **Date:** 2026-11-24 (temporary passwords per docs/plans/p3b-admin-password-reset.md)
- **Confirmed:** 2026-11-24
- **Provider:** `backend/` (routes/api.php, AuthController, EnsurePasswordCurrent)
- **Consumers:** `frontend/src/api/auth.ts`, `frontend/src/api/client.ts`
- **Interface:** [docs/API.md → Users](../API.md#users) and [Errors](../API.md#errors-every-endpoint): `POST /api/register` (`first_name`, `last_name`), `POST /api/login`, `POST /api/logout`, `GET /api/user`, `PUT /api/user/password` (replaces a temporary password, returns a new token; D-054); the user object has `first_name`, `last_name`, `name` ("Prenume Nume") and `must_change_password`; bearer token (D-050); 422 bodies carry error codes per field; 403 bodies carry `code` (`account_inactive`, `forbidden_role`, `password_change_required`, `password_change_not_required`).
- **Evidence:** docs/plans/p2-auth-accounts.md; docs/API.md
- **Source:** user (approved plan, 2026-11-23) · confidence high

## C-002 · Classes API: classes and join requests
- **Status:** approved
- **Date:** 2026-11-24 (set password removed per docs/plans/p3b-admin-password-reset.md)
- **Confirmed:** 2026-11-25
- **Provider:** `backend/` (routes/api.php, ClassController, MembershipController)
- **Consumers:** `frontend/src/api/classes.ts`; P7's Candidate dashboard will consume `POST /api/memberships`
- **Interface:** [docs/API.md → Classes](../API.md#classes) and [Joining a class](../API.md#joining-a-class-candidate): Examiner-only class routes (list, create, show, rename, new join code, delete, accept/decline; setting a password moved to C-003, D-054); Candidate objects carry `first_name`, `last_name` and `name`, rosters sorted by last name; Candidate `POST /api/memberships`; another Examiner's resources answer 404; 409 codes `already_decided`, `class_has_published_exam`.
- **Evidence:** docs/plans/p3-classes.md; docs/API.md
- **Source:** user (approved plan, 2026-11-23) · confidence high

## C-003 · Administrator API: users, temporary passwords, Examiners, deactivation
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-24
- **Provider:** `backend/` (routes/api.php, Admin/UserController)
- **Consumers:** `frontend/src/api/admin.ts`
- **Interface:** [docs/API.md → Administrator](../API.md#administrator): `GET /api/admin/users`, `POST /api/admin/examiners`, `PUT /api/admin/users/{id}/password`, `PATCH /api/admin/users/{id}` (`is_active: false` only); 403 `forbidden_target` (own account; an Administrator), 409 `already_deactivated` (D-054, D-055, D-056).
- **Evidence:** docs/plans/p3b-admin-password-reset.md; docs/API.md
- **Source:** user (approved plan, 2026-11-24) · confidence high

## C-004 · Question bank API: questions, Ready check, preview, lists, library
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-27
- **Provider:** `backend/` (routes/api.php, QuestionController, LibraryController, BankListController, Support/Questions/Readiness)
- **Consumers:** `frontend/src/api/questions.ts` (P4b Part 3)
- **Interface:** [docs/API.md → Question bank](../API.md#question-bank): the Examiner's own questions (list with filters, create with a typed code, show with `problems`, edit, Ready/Draft, delete), preview of named values and answer checking (P4a engine), competences/topics/pools (list, create), library (publish as `LIB-<code>`, browse, copy). 422 bodies carry codes; `status: not_ready` comes with `problems`; 409 codes `question_drawn`, `already_published`. Barem steps carry ids and are kept by id; a barem edit recalculates graded answers of exams whose results aren't published and flags them for re-check (D-031), reported as `regraded`; a question drawn in an exam with published results refuses barem and answer-key changes (`barem_locked`, `answer_key_locked`) (P8a). P8c: a corrected Subject I key on a drawn question re-grades the unpublished Attempts from their snapshots and is logged (`regraded`, `key_corrections`); once drawn, `type_locked`, `options_locked` and `parameters_locked` (D-046, Q-087–Q-089, Q-092).
- **Evidence:** docs/plans/p4b-question-bank.md; docs/API.md
- **Source:** user (approved plan, 2026-11-24) · confidence high

## C-005 · Exams API: exams, blueprint Items, publish checks, preview
- **Status:** approved
- **Date:** 2026-11-27 (Q-081 end locked after results)
- **Confirmed:** 2026-11-27
- **Provider:** `backend/` (routes/api.php, ExamController, ExamItemController, Support/Exams/Blueprint, Support/Exams/PublishChecks)
- **Consumers:** `frontend/src/api/exams.ts` (P5 Part 3); P6 reuses `Blueprint::assign` server-side
- **Interface:** [docs/API.md → Exams](../API.md#exams): the Examiner's exams (list, create, show with `checks`, edit settings, delete a draft), Items (add, edit, delete, reorder; `type`/`topic` null = any; `eligible` count), match count for unsaved criteria, publish (422 `not_publishable` with `problems`), preview draw. After publishing only title, description and `available_until` change (409 `exam_published`); once results are published `available_until` is locked too (409 `results_published`, Q-081).
- **Evidence:** docs/plans/p5-exam-builder.md; docs/API.md
- **Source:** user (approved plan, 2026-11-24) · confidence high

## C-006 · Attempts API (Candidate): exams, start, read, autosave, submit; sealing cron
- **Status:** approved
- **Date:** 2026-11-25
- **Confirmed:** 2026-11-27
- **Provider:** `backend/` (routes/api.php, CandidateExamController, AttemptController, CronController, Support/Attempts/Starter, Saver, Sealer)
- **Consumers:** `frontend/src/api/attempts.ts` (P7a dashboard; P7b–P7d exam room), `frontend/src/api/results.ts` (P8b); cron-job.org (the seal endpoint)
- **Interface:** [docs/API.md → Attempts (Candidate)](../API.md#attempts-candidate) and [→ Cron](../API.md#cron): `GET /api/candidate/exams` (with `server_time`, `classes`, `topics`, `item_counts`, `open_attempt`, `submitted` since P7a), `POST /api/candidate/exams/{id}/attempts` (409 `attempt_open` with `attempt_id`, `no_attempts_left`, `not_available`), `GET /api/attempts/{id}` (the snapshot as shown, saved answers, `server_time`, `exam.max_attempts` since P7c, `accepts_answers_until` since P7d; never the key or a score), `PUT /api/attempts/{id}/items/{position}/answer` (versioned, idempotent; 409 `time_up`, `attempt_submitted`; 422 `invalid_answer`), `POST /api/attempts/{id}/submit` (idempotent), Subject II photos since P6d (`POST`/`DELETE …/items/{position}/images`, `GET …/images/{imageId}`; `items[].images`, `photos_enabled`), `POST /api/cron/seal-expired` (`X-Cron-Secret`). P6c–P6d extend it. P8b: `GET /api/candidate/exams/{id}/results` (409 `results_not_published`; Attempts with grade and `counted`, Subject I correct answer and explanation, Subject II comment and barem steps earned; no class statistics) and `grade` on each exam once results are published.
- **Evidence:** docs/plans/p6a-start-and-draw.md, docs/plans/p6b-timer-autosave-submit.md, docs/plans/p7a-dashboard.md; docs/API.md
- **Source:** user (approved plans, 2026-11-25) · confidence high

## C-007 · Grading API (Examiner): queue, grades, published results, photos
- **Status:** approved
- **Date:** 2026-11-27 (Q-079 re-check blocks publishing)
- **Confirmed:** 2026-11-27
- **Provider:** `backend/` (routes/api.php, GradingController, Requests/Grading, Support/Grading/Scorer)
- **Consumers:** `frontend/src/api/grading.ts` (P8a, DS-009)
- **Interface:** [docs/API.md → Grading (Examiner)](../API.md#grading-examiner): `GET /api/exams/{id}/grading` (queue, counts, publish readiness, mean and median), `GET`/`PUT /api/grading/items/{attemptItemId}` (one answer; barem steps or one score, adjustment, comment; 422 `steps`, `points`, `adjustment: out_of_range`; 409 `results_published`, `attempt_open`), `POST /api/exams/{id}/results` (cohort note; 422 `results_not_ready` with `missing`: `ungraded`, `recheck` (Q-079), `open_attempts`, `window_open`; 409 `results_published`), `GET /api/grading/images/{imageId}`.
- **Evidence:** docs/plans/p8a-grading-and-publishing.md; docs/API.md
- **Source:** user (approved plan, 2026-11-26) · confidence high

## Consumed

## External
