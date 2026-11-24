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
- **Confirmed:** 2026-11-24
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

## Consumed

## External
