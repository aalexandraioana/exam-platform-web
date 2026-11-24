# API — exam-platform-web

The REST API of the Laravel backend (D-051). Every endpoint has a section here with its
method, path, auth and role, a request example, and response examples for success and for
each error status. Each backend part updates this file in the same change; contracts in
[docs/agents/CONTRACTS.md](agents/CONTRACTS.md) link to the sections.

- **Base URL:** `http://localhost:8000/api` locally; `https://exam-platform-api-hwy2.onrender.com/api` live.
- **Format:** JSON. Send `Accept: application/json` and, with a body, `Content-Type: application/json`.
- **Auth:** a Sanctum bearer token (D-050): `Authorization: Bearer <token>`. Login and
  registration return it; it doesn't expire, and logout, deactivation or a password change
  revoke it.

## Errors (every endpoint)
| Status | Body | When |
|---|---|---|
| 401 | `{"message": "Unauthenticated."}` | no token, or a revoked one |
| 403 | `{"code": "account_inactive", "message": "This account is deactivated."}` | the user has `is_active = false` |
| 403 | `{"code": "forbidden_role", "message": "This action is not available for your role."}` | the route is for another role |
| 403 | `{"code": "password_change_required", "message": "Choose a new password first."}` | the password is temporary (D-054); only `GET /user`, `POST /logout` and `PUT /user/password` answer until it is changed |
| 422 | `{"message": "…", "errors": {"<field>": ["<code>"]}}` | validation failed; each field lists **error codes** (below), not sentences, so the SPA shows its own RO/EN text |
| 429 | `{"message": "Too Many Attempts."}` + `Retry-After` header | throttled |

**Validation error codes:** `required`, `invalid` (wrong format), `too_short`, `mismatch`
(confirmation differs), `taken` (already used), `not_found` (no such class code),
`credentials` (login: email or password wrong, always the same for both), `same_as_temporary`
(the new password is the temporary one, D-054).

**409 codes** (`{"code": "…", "message": "…"}`): `already_decided` (a join request that is no longer
pending), `class_has_published_exam` (a class linked to a published Exam, D-049), `already_deactivated`
(the account is deactivated, D-056).

## Users

A user in every response:
```json
{ "id": 7, "first_name": "Ana", "last_name": "Dumitru", "name": "Ana Dumitru", "email": "ana.dumitru@exemplu.ro", "role": "candidate", "is_active": true, "must_change_password": false }
```
`name` is always `first_name` and `last_name` joined with a space, for display. `role` is `candidate`, `examiner` or `administrator`
and never changes (D-055). `must_change_password` is `true` while the password is temporary: set by an
Administrator or by `app:create-user` (D-054); the SPA then shows only DS-018. Emails are stored in lower case and
compared without case.

### POST /api/register
Public. Creates a Candidate and logs them in. Throttled: 10 requests per minute per IP.

Request:
```json
{ "first_name": "Ana", "last_name": "Dumitru", "email": "Ana.Dumitru@exemplu.ro", "password": "lalea-verde-48",
  "password_confirmation": "lalea-verde-48", "class_code": "k7q-4mx" }
```
- `first_name`, `last_name`: required, up to 100 characters each.
- `email`: required, a valid email, not used by another account (any case).
- `password`: required, at least 8 characters; `password_confirmation` must match.
- `class_code`: optional. Case, spaces and hyphens are ignored. When given, it must match a
  class (D-053): otherwise nothing is created. When it matches, the Candidate gets a pending
  request to join that class (D-028).
- Any `role` or `is_active` in the body is ignored.

`201 Created`:
```json
{ "token": "12|q8Jx…", "user": { "id": 7, "first_name": "Ana", "last_name": "Dumitru", "name": "Ana Dumitru", "email": "ana.dumitru@exemplu.ro", "role": "candidate", "is_active": true, "must_change_password": false } }
```
`422`:
```json
{ "message": "The given data was invalid.", "errors": { "email": ["taken"], "class_code": ["not_found"] } }
```
Codes per field: `first_name` and `last_name` (`required`, `invalid`), `email` (`required`, `invalid`, `taken`), `password`
(`required`, `too_short`, `mismatch`), `class_code` (`not_found`).

### POST /api/login
Public. Throttled: 5 failed attempts per minute per email and IP, then `429`.

Request:
```json
{ "email": "ana.dumitru@exemplu.ro", "password": "lalea-verde-48" }
```
`200 OK`: the same body as registration (`token`, `user`).

`422` (wrong password or unknown email, the same answer for both):
```json
{ "message": "The given data was invalid.", "errors": { "email": ["credentials"] } }
```
Missing fields give `required` on `email` or `password`; a malformed email gives `invalid`.

`403` for a deactivated account (no token is issued):
```json
{ "code": "account_inactive", "message": "This account is deactivated." }
```

### POST /api/logout
Bearer token. Revokes the token used for this request.

`204 No Content`. `401` without a valid token.

### GET /api/user
Bearer token, active user. The logged-in user.

`200 OK`:
```json
{ "user": { "id": 7, "first_name": "Ana", "last_name": "Dumitru", "name": "Ana Dumitru", "email": "ana.dumitru@exemplu.ro", "role": "candidate", "is_active": true, "must_change_password": false } }
```
`401` without a valid token; `403 account_inactive` if the account was deactivated.

### PUT /api/user/password
Bearer token, active user with a **temporary password** (D-054). The user chooses their own password.
Every token is revoked (D-050), so the answer carries a new one that replaces the token used here.

Request: `{ "password": "soare-albastru-7", "password_confirmation": "soare-albastru-7" }`.

`200 OK`: the same body as login (`token`, `user` with `must_change_password: false`).
`422`: `password` (`required`, `too_short`, `mismatch`, `same_as_temporary`).
`403 password_change_not_required` when the password is not temporary.

## Classes

An Examiner's own classes (D-015, D-028). Every route here needs a bearer token of an
**active Examiner** (`403 forbidden_role` / `account_inactive` otherwise). Another Examiner's
class, request or Candidate answers `404`, as if it didn't exist.

A class in every response:
```json
{ "id": 3, "name": "Clasa a VI-a A", "join_code": "K7Q-4MX", "pending_count": 3, "candidate_count": 24, "published_exam_count": 2 }
```
`join_code` is generated by the server: 6 characters without 0, O, 1, I or L, shown with a
hyphen. Candidates may type it in any case, with or without the hyphen.

### GET /api/classes
The Examiner's classes, by name. `200 OK`: `{ "classes": [ <class>, … ] }` (empty list when none).

### POST /api/classes
Request: `{ "name": "Clasa a VII-a A" }`. A `join_code` in the body is ignored.

`201 Created`: `{ "class": <class> }`. `422`: `name` (`required`, `invalid` when over 255 characters).

### GET /api/classes/{id}
`200 OK`:
```json
{ "class": { "id": 3, "name": "Clasa a VI-a A", "join_code": "K7Q-4MX", "pending_count": 1, "candidate_count": 1, "published_exam_count": 0 },
  "requests": [ { "id": 41, "candidate": { "id": 7, "first_name": "Matei", "last_name": "Radu", "name": "Matei Radu", "email": "matei.radu@exemplu.ro" }, "requested_at": "2026-11-23T18:40:00+00:00" } ],
  "candidates": [ { "id": 9, "first_name": "Ana", "last_name": "Dumitru", "name": "Ana Dumitru", "email": "ana.d@exemplu.ro", "joined_at": "2026-09-12T08:00:00+00:00" } ] }
```
`requests` are the pending ones, oldest first; `candidates` are the accepted ones, by last name, then first name.

### PATCH /api/classes/{id}
Renames the class. Request: `{ "name": "Clasa a VI-a B" }`. `200 OK`: `{ "class": <class> }`. `422` as for creating.

### POST /api/classes/{id}/join-code
Replaces the join code. The old code stops working at once; requests already sent stay.
`200 OK`: `{ "class": <class> }` with the new `join_code`.

### DELETE /api/classes/{id}
Deletes the class (D-049): it is first unlinked from draft Exams, and its join requests and
memberships go with it. `204 No Content`.

`409` while a published Exam is linked:
```json
{ "code": "class_has_published_exam", "message": "A class linked to a published Exam can't be deleted." }
```

### POST /api/memberships/{id}/accept · POST /api/memberships/{id}/decline
The Examiner decides a pending join request. `200 OK`:
```json
{ "membership": { "id": 41, "status": "accepted", "decided_at": "2026-11-23T18:45:00+00:00" } }
```
`409 already_decided` when the request is no longer pending.

## Joining a class (Candidate)

### POST /api/memberships
Bearer token of an **active Candidate**. Sends a join request with a class code (D-028).

Request: `{ "class_code": "k7q-4mx" }`.

`201 Created` for a new request, `200 OK` when a request for that class is already pending or
accepted (nothing changes):
```json
{ "membership": { "id": 41, "status": "pending", "class": { "id": 3, "name": "Clasa a VI-a A" } } }
```
`422`: `class_code` (`required`, `not_found`). `409 already_decided` when the Examiner declined an
earlier request (until Q-041 is answered).

## Administrator

Bearer token of an **active Administrator** with a current password; other roles get `403 forbidden_role`.
C-003, screen DS-011.

### GET /api/admin/users
Every user, sorted by last name, then first name. `200 OK`: `{ "users": [ <user>, … ] }`.

### POST /api/admin/examiners
Creates an Examiner (D-055) with a temporary password (D-054).

Request: `{ "first_name": "Maria", "last_name": "Popa", "email": "maria.popa@exemplu.ro", "password": "tei-inflorit-21" }`.
Any `role` or `is_active` in the body is ignored.

`201 Created`: `{ "user": <user> }` with `role: "examiner"` and `must_change_password: true`. No token.
`422`: `first_name`, `last_name` (`required`, `invalid`), `email` (`required`, `invalid`, `taken`),
`password` (`required`, `too_short`).

### PUT /api/admin/users/{id}/password
Sets a temporary password for any other active user (D-054). Their old password and all their tokens
stop working, and at the next sign-in they must choose their own.

Request: `{ "password": "lalea-verde-48" }`. `204 No Content`. `422`: `password` (`required`, `too_short`).
`403 forbidden_target` for the Administrator's own account; `409 already_deactivated`; `404` for an unknown user.

### PATCH /api/admin/users/{id}
Deactivates a Candidate or an Examiner (D-056). It is permanent: the user is signed out everywhere and
refused at login; their data stays.

Request: `{ "is_active": false }`. `200 OK`: `{ "user": <user> }`.
`422`: `is_active` (`required`; `invalid` for anything but `false`, so no reactivation).
`403 forbidden_target` for an Administrator (including oneself); `409 already_deactivated`; `404` for an unknown user.

## Accounts created by the operator
Administrators have no endpoint (D-055). They, and Examiners if needed, are created on the server with:
```bash
php artisan app:create-user examiner maria.popa@exemplu.ro Maria Popa
```
The command asks for the password twice and never takes it as an argument. The password is temporary
(D-054): the new user chooses their own at the first sign-in.
