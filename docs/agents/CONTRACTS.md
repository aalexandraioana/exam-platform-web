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
- C-002 · Classes API: classes, join requests, new Candidate password · provided

---

## Provided

## C-001 · Auth API: register, login, logout, current user
- **Status:** approved
- **Date:** 2026-11-23
- **Provider:** `backend/` (routes/api.php, AuthController)
- **Consumers:** `frontend/src/api/auth.ts`, `frontend/src/api/client.ts`
- **Interface:** [docs/API.md → Users](../API.md#users) and [Errors](../API.md#errors-every-endpoint): `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/user`; bearer token (D-050); 422 bodies carry error codes per field; 403 bodies carry `code` (`account_inactive`, `forbidden_role`).
- **Evidence:** docs/plans/p2-auth-accounts.md; docs/API.md
- **Source:** user (approved plan, 2026-11-23) · confidence high

## C-002 · Classes API: classes, join requests, new Candidate password
- **Status:** approved
- **Date:** 2026-11-23
- **Provider:** `backend/` (routes/api.php, ClassController, MembershipController)
- **Consumers:** `frontend/src/api/classes.ts`; P7's Candidate dashboard will consume `POST /api/memberships`
- **Interface:** [docs/API.md → Classes](../API.md#classes) and [Joining a class](../API.md#joining-a-class-candidate): Examiner-only class routes (list, create, show, rename, new join code, delete, accept/decline, set password); Candidate `POST /api/memberships`; another Examiner's resources answer 404; 409 codes `already_decided`, `class_has_published_exam`.
- **Evidence:** docs/plans/p3-classes.md; docs/API.md
- **Source:** user (approved plan, 2026-11-23) · confidence high

## Consumed

## External
