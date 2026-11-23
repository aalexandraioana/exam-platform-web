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
| 422 | `{"message": "…", "errors": {"<field>": ["<code>"]}}` | validation failed; each field lists **error codes** (below), not sentences, so the SPA shows its own RO/EN text |
| 429 | `{"message": "Too Many Attempts."}` + `Retry-After` header | throttled |

**Validation error codes:** `required`, `invalid` (wrong format), `too_short`, `mismatch`
(confirmation differs), `taken` (already used), `not_found` (no such class code),
`credentials` (login: email or password wrong, always the same for both).

## Users

A user in every response:
```json
{ "id": 7, "name": "Ana Dumitru", "email": "ana.dumitru@exemplu.ro", "role": "candidate", "is_active": true }
```
`role` is `candidate`, `examiner` or `administrator`. Emails are stored in lower case and
compared without case.

### POST /api/register
Public. Creates a Candidate and logs them in. Throttled: 10 requests per minute per IP.

Request:
```json
{ "name": "Ana Dumitru", "email": "Ana.Dumitru@exemplu.ro", "password": "lalea-verde-48",
  "password_confirmation": "lalea-verde-48", "class_code": "k7q-4mx" }
```
- `name`: required, up to 255 characters.
- `email`: required, a valid email, not used by another account (any case).
- `password`: required, at least 8 characters; `password_confirmation` must match.
- `class_code`: optional. Case, spaces and hyphens are ignored. When given, it must match a
  class (D-053): otherwise nothing is created. When it matches, the Candidate gets a pending
  request to join that class (D-028).
- Any `role` or `is_active` in the body is ignored.

`201 Created`:
```json
{ "token": "12|q8Jx…", "user": { "id": 7, "name": "Ana Dumitru", "email": "ana.dumitru@exemplu.ro", "role": "candidate", "is_active": true } }
```
`422`:
```json
{ "message": "The given data was invalid.", "errors": { "email": ["taken"], "class_code": ["not_found"] } }
```
Codes per field: `name` (`required`), `email` (`required`, `invalid`, `taken`), `password`
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
{ "user": { "id": 7, "name": "Ana Dumitru", "email": "ana.dumitru@exemplu.ro", "role": "candidate", "is_active": true } }
```
`401` without a valid token; `403 account_inactive` if the account was deactivated.

## Accounts created by the operator
Examiners and Administrators have no endpoint yet (DS-011 comes in P11). They are created on
the server with:
```bash
php artisan app:create-user examiner maria.popa@exemplu.ro "Maria Popa"
```
The command asks for the password twice and never takes it as an argument.
