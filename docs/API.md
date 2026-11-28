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

## Question bank

Bearer token of an **active Examiner** with a current password. Every route works on the Examiner's
own data: another Examiner's question, competence, topic or pool, and a library entry where a bank
question is expected, answer `404`. C-004, screen DS-007.

A question (list rows carry the first block of fields only):
```json
{ "id": 12, "code": "M6-RP-014", "section": "subject_1", "type": "short_answer", "status": "ready",
  "grade_level": 6, "difficulty": "medium", "statement": "Numerele a și b sunt direct proporționale cu {p} și {q} …",
  "competence": { "id": 3, "code": "C2", "description": "Folosește proporțiile directe" },
  "topic": { "id": 5, "name": "Rapoarte și proporții" }, "pools": [{ "id": 2, "name": "Proporții – mediu" }],
  "points": 5, "explanation": null, "answer_key": { "kind": "number" },
  "parameters": { "values": { "p": { "random": { "min": 2, "max": 5 } }, "k": { "fixed": 4 }, "s": { "calculated": "(p + q) · k" } },
                  "conditions": ["p < q"], "answer": "p · k" },
  "uses_barem": false, "barem": [], "copied_from": null, "published": false, "problems": [] }
```
`answer_key` per type (questions.template.yaml): `dual_choice` `{correct: bool}`; `single_choice`
`{options: [..], correct: n}` (1-based); `multiple_choice` `{options, correct: [n, ..]}`;
`short_answer` `{kind: text, accepted: [..]}` · `{kind: number, value: "2,5"}` (no `value` with
named values) · `{kind: fraction, value: "3/4"}`. `parameters`: D-057 (P4a).

`problems` lists what Ready still needs (D-059), each `{code, field?, name?}`: `required` (field
`statement`, `points`, `grade_level`, `difficulty`, `competence`, `topic`, `answer_key`),
`invalid_answer_key`, `too_few_options`, `empty_option`, `duplicate_options`, `fraction_with_values`,
`barem_incomplete`, `subject_two_points` (field `points`: a Subject II problem is worth 20, D-062), and the named-value codes with field `parameters` (`undefined_value`,
`invalid_value`, `invalid_range`, `all_excluded`, `invalid_formula`, `unknown_name`, `cycle`,
`invalid_condition`, `answer_required`, `values_not_allowed`, `no_valid_draw`).

### GET /api/questions
The bank, by code, without library entries. Filters: `search` (code or text, any case),
`competence_id`, `topic_id`, `pool_id`, `type`, `section`, `grade_level`, `difficulty`, `status`.
`200`: `{ "questions": [ … ] }`.

### POST /api/questions
`{ "code": "M6-UG-001", "section": "subject_1", "type": "single_choice" }` → `201 { "question" }`, a
Draft. The code is typed once and never changes (Q-054): letters, digits, `-` `_` `.`, at most 28.
`422`: `code` (`required`, `invalid`, `taken`), `section`, `type` (`required`, `invalid`; the type
must fit the Subject: `structured_problem` is Subject II's only type).

### GET /api/questions/{id} · PATCH /api/questions/{id}
`PATCH` takes any of: `section`, `type`, `grade_level`, `difficulty`, `competence_id`, `topic_id`,
`points`, `statement`, `explanation`, `answer_key`, `parameters`, `uses_barem`, `barem` (the full
list of `{id?, description, points}`), `pool_ids` (the full list). `code` and `status` are ignored.
Barem steps are kept by `id` (P8a, D-031): a step sent with its id keeps its row and the grades
given on it; one without an id is new; a step left out is deleted with only its grades. When
`barem` is sent, graded answers to the question in exams whose results aren't published are
recalculated (points above a step's new maximum are capped; a removed step that had points, a new
step or a clamped total marks the answer `needs_recheck`), and the response adds
`"regraded": {"answers", "flagged"}`. When `uses_barem` turns on, answers graded with one score are
also marked `needs_recheck` (counted in `flagged`), keeping their points until they are graded on the
steps; publishing waits for them (Q-086, Q-079). P8c (D-046): when a drawn Subject I question's
correct answer changes (`correct`, `kind`, `accepted` or `value`), every Attempt of an exam whose results
aren't published gets the new key in its snapshot, keeping the options it showed; submitted and graded
Attempts are graded again on Subject I, the correction is logged and the response adds
`"regraded": {"answers", "flagged": 0}` (answers re-graded; running Attempts only get the key). A fix
to an option's text alone changes no Attempt. The question carries `key_corrections`: the last 5,
newest first, `{corrected_at, examiner, answers}` (Q-087). `200 { "question" }`. `422`: a field `invalid` (another
Examiner's competence, topic or pool; a barem on Subject I; a barem step id that isn't this
question's); `barem: barem_locked` / `answer_key: answer_key_locked` when an exam that drew the
question has published results and the barem, `uses_barem` or the answer key would change (an
unchanged value is not a change; D-031, D-046); once an Attempt has drawn the question,
`type: type_locked` / `section: type_locked` when its type or Subject would change (Q-092),
`answer_key: options_locked` when options are added, removed or reordered, and `parameters:
parameters_locked` when its named values or formula change (Q-088, Q-089); `status: not_ready` with `problems` when a Ready
question would become incomplete: nothing is saved; move it to Draft first (Q-057).

### POST /api/questions/{id}/ready · POST /api/questions/{id}/draft
Ready: `200 { "question" }`, or `422` `status: not_ready` with `problems`. Draft: always `200`.

### DELETE /api/questions/{id}
`204`. `409 question_drawn` once an Attempt has drawn it (Q-056).

### POST /api/questions/preview
The unsaved `type`, `statement`, `options` and `parameters` → `200 { "problems": [..], "samples": [..] }`,
three samples `{values, statement, options, answer}` drawn with random seeds, or none when there are
problems (`no_valid_draw` when no set of values can be drawn).

### POST /api/questions/check-answer
"Testează un răspuns": `{ "type", "answer_key", "given", "expected"? }` (`expected`: the answer of a
sample draw) → `200 { "accepted": true }` (D-017).

### GET, POST /api/competences · /api/topics · /api/pools
Lists sorted by code or name. Create: `{ "code", "description" }` or `{ "name" }` → `201`
`{ "competence" | "topic" | "pool" }`. `422`: `required`, `invalid`, `taken` (a competence code, or a
topic or pool name ignoring case, already in the Examiner's list). No renaming or deleting (Q-053).

### POST /api/questions/{id}/publish
A Ready question → `201 { "entry" }`, a frozen copy coded `LIB-<code>` (D-040). `422 status:
not_ready`; `409 already_published` (once per question, no withdrawing, Q-058).

### GET /api/library · POST /api/library/{id}/copy
Every entry, by code: `{ id, code, section, type, grade_level, difficulty, statement, competence:
{code, description}, topic: {name}, author, copied_as }` (`copied_as`: the code of your copy, if
any). Copy: `{ "code" }` → `201 { "question" }` in your bank, with the entry's status and barem,
`copied_from` set; the entry's competence (by code) and topic (by name) are added to your lists if
missing. `422`: `code` as for a new question. `404` for anything that isn't a library entry.

## Exams

Bearer token of an **active Examiner** with a current password; own exams only (another Examiner's
exam answers `404`). C-005, screen DS-008.

An exam:
```json
{ "id": 4, "title": "Evaluare Unitatea 3", "status": "draft", "grade_level": 6,
  "available_from": "2026-11-30T08:00:00+00:00", "available_until": "2026-11-30T14:00:00+00:00", "published_at": null,
  "classes": [{ "id": 3, "name": "Clasa a VI-a A" }], "item_count": 8,
  "description": null, "duration_minutes": 50, "max_attempts": 1, "score_policy": "highest", "class_ids": [3],
  "items": [{ "id": 11, "position": 1, "section": "subject_1", "points": 5, "pool": { "id": 2, "name": "Proporții – mediu" },
              "competence": { "id": 3, "code": "C2", "description": "…" }, "difficulty": "medium",
              "type": null, "topic": null, "eligible": 3 }],
  "checks": { "totals": { "subject_1": 30, "subject_2": 60 }, "problems": [], "warnings": [] } }
```
The list (`GET /exams`) carries the first line of fields. An exam also carries `results_published_at` and `cohort_note` (P8a, C-007). An Item's `type` and `topic` null mean
"any"; `eligible` counts the Ready questions it may draw (D-057).

`checks.problems` block publishing: `required` (field `title`, `grade_level`, `duration_minutes`,
`classes`), `subject_total` (`section`, `sum`, `expected`: 30 for Subject I, 60 for Subject II,
D-005), `item_incomplete` (`item` position, field `points`, `pool`, `competence`, `difficulty`),
`subject_two_items` (`count`, `expected`: exactly 3 Subject II problems, D-062), `no_distinct_draw` (`items`: the positions that can't all get their own question). `checks.warnings`:
`competence_missing` for a competence with a Ready question at this grade level but no Item (Q-063).

### GET /api/exams · POST /api/exams
List, newest first. Create: `{ "title" }` → `201 { "exam" }`, a draft. `422`: `title` (`required`).

### GET /api/exams/{id} · PATCH /api/exams/{id} · DELETE /api/exams/{id}
`PATCH` takes any of: `title`, `description`, `grade_level`, `duration_minutes`, `available_from`,
`available_until`, `max_attempts`, `score_policy` (`highest`, `latest`), `class_ids` (the full list).
`422`: a field `invalid` (another Examiner's class; `available_until` not after `available_from`).
Once published, only `title`, `description` and `available_until` change; anything else is
`409 exam_published` (Q-060). Once its results are published, a change to `available_until` is
`409 results_published`; sending the same moment again is accepted (Q-081). `DELETE`: a draft only, `204`; `409 exam_published` (Q-061).

### POST /api/exams/{id}/items · PATCH, DELETE /api/exams/{id}/items/{itemId} · PUT /api/exams/{id}/items/order
Item fields: `section` (required when adding), `points`, `pool_id`, `competence_id`, `difficulty`,
`type`, `topic_id`. Order: `{ "item_ids": [...] }`, every Item once. Each answers with the whole
exam (`201` when adding, else `200`). `422`: a field `invalid` (another Examiner's pool, competence or
topic; a type that doesn't fit the Subject; Subject II `points` other than 20 (empty is allowed while drafting, D-062); an order that isn't every Item). `409 exam_published`.

### POST /api/exams/{id}/match
Unsaved Item criteria → `200 { "count": 3 }`, the live count of the Item dialog.

### POST /api/exams/{id}/publish
`200 { "exam" }` with `status: published`. `422`: `status: not_publishable` with `problems`;
`409 exam_published`. Publishing can't be undone (Q-061).

### GET /api/exams/{id}/preview
One draw as a Candidate would get it, with a random seed: `200 { "items": [{ item_id, position,
question_id, code, competence, eligible, values, statement, options, answer }] }`, every Item its own
question, named values filled (`answer`: the drawn answer, for questions with values). `422 status:
not_publishable` when no draw exists. Options are shuffled per Attempt in P6 (D-045), not here.

## Grading (Examiner)

C-007 (P8a). Subject II grading (D-005, D-031) and publishing the results (D-019). Only the exam's
Examiner: another Examiner's exam, answer or photo is `404`. Points are numbers; a Subject II
problem is worth 20 (D-062).

### GET /api/exams/{id}/grading
The queue. `exam` (`id`, `title`, `classes` names, `available_until`, `submissions` = submitted or
graded Attempts, `results_published_at`, `cohort_note`); `items` per Subject II problem
(`position`, `competence` code, `points`, `graded`, `total`); `answers`, one per Subject II problem
of each handed-in Attempt, unanswered ones included (`attempt_item_id`, `attempt_id`, `candidate`
name, `number` = the Attempt's place in the list, for hidden names, `position`, `question_code`,
`photos` count, `answered`, `status` `to_grade` | `graded` | `recheck`, `awarded_points`);
`counts` (`total`, `graded`, `to_grade`, `recheck`); `publish` (`ready`, `missing` as below,
`mean` and `median` grade 1–10 over each Candidate's counted Attempt by the score policy, D-012;
null before any Attempt is graded).

### GET /api/grading/items/{attemptItemId} · PUT /api/grading/items/{attemptItemId}
`GET` → `{ "item" }`: `attempt_item_id`, `attempt_id`, `position`, `question_id`, `question_code`,
`candidate`, `statement` (the Attempt's snapshot), `points`, `text` (the written steps), `photos`
(`{id, position, name, size}`), `uses_barem`, `barem` (the question's live steps, `{id, description,
points, modified}`; `modified` = changed after this answer was graded), `scores` (step id → points),
`adjustment`, `comment`, `awarded_points`, `needs_recheck`, `graded_at`.
`PUT` with a barem: `{ "steps": [{id, points}], "adjustment"?, "comment"? }`, every step once, each
between 0 and its points; without a barem: `{ "points", "adjustment"?, "comment"? }`, at most the
problem's points. The total (steps or points, plus the adjustment) must stay between 0 and the
problem's points. Saving clears `needs_recheck`; when every Subject II problem of the Attempt is
graded, the Attempt becomes `graded` with `subject_2_score` and `total_score` = 10 + Subject I +
Subject II. `200 { "item" }`. `422`: `steps` `required` / `invalid`, `points` `required` /
`invalid`, `adjustment` `out_of_range`, `comment` `invalid`. `409`: `results_published`,
`attempt_open`.

### POST /api/exams/{id}/results
`{ "cohort_note"? }` → `200 { "exam" }` with `results_published_at` and `cohort_note`. Expired
Attempts are sealed first. `422` `status: results_not_ready` with `missing`: `ungraded` (a submitted
Attempt isn't graded yet), `recheck` (an answer is marked for re-check, Q-079), `open_attempts` (an
Attempt is still running), `window_open`
(`available_until` hasn't passed or isn't set) (Q-076). `409 results_published`. Publishing can't be
undone; afterwards the barem and answer key of the exam's questions are locked (C-004).

### GET /api/grading/images/{imageId}
A Subject II photo of an answer in one of the Examiner's exams, streamed with its type.

## Item Analysis (Examiner)

C-008 (P10). Difficulty, discrimination and distractors of one of the Examiner's exams (D-047), from
each Candidate's counted, graded Attempt: the latest, or the highest total with a tie going to the
later Attempt (D-012, Q-093, Q-097). Ungraded Attempts are left out (Q-094). Available any time,
also before the results are published; computed on every read. Another Examiner's exam is `404`, a
Candidate `403`.

### GET /api/exams/{id}/analysis
- `graded` (graded Attempts), `submissions` (submitted or graded Attempts), `recheck` (answers
  marked for re-check in the counted Attempts; the figures may change once they are graded again),
  `mean` and `median` grade 1–10 (as on the grading screen; null before any Attempt is graded).
- `competences`, by code (D-058): `code`, `description`, `p` (points earned / maximum over its
  Items), `weak` (its Items with a flag), `items`.
- Each Item, by position: `position`, `section`, `points`, `n` (counted Attempts), `p`, `r`,
  `flags`, `not_enough_data`, `questions` (each question drawn for it, by code, on the Attempts that
  drew it: `id`, `code`, `type`, `n`, `p`, `r`, `flags`, `not_enough_data`, `options`).
- `p` = mean points / the item's points, 0–1 (4 decimals); `r` = the correlation of the item's
  points with the rest of the Attempt's score (total − 10 − the item), 4 decimals. Both are `null`
  with fewer than 2 Attempts; `r` is also `null` when the item or the rest doesn't vary (everyone
  correct: `p` 1 and `too_easy`, `r` null; Q-095). `not_enough_data` is true when either is null.
- `flags`, from the unrounded values: `too_hard` (p < 0.20), `too_easy` (p > 0.90),
  `low_discrimination` (r < 0.20), `negative_discrimination` (r < 0: likely a faulty question).
- `options`, for choice questions only (else `null`), in original order (D-045): `option` (1, 2, …;
  `true` / `false` for a true/false question), `label`, `correct`, `count` (Candidates who chose it;
  each ticked option of a multiple choice answer), `share` (of the Candidates who got the
  question, unanswered included), `unused` (a wrong option with a share under 5%).

```json
{
  "exam": { "id": 12, "title": "Evaluare Unitatea 3" },
  "graded": 14, "submissions": 14, "recheck": 0, "mean": 7.2, "median": 7.5,
  "competences": [{
    "code": "C1", "description": "Calculează fracții dintr-un număr", "p": 0.71, "weak": 1,
    "items": [{
      "position": 1, "section": "subject_1", "points": 5, "n": 14, "p": 0.9286, "r": 0.1203,
      "flags": ["too_easy", "low_discrimination"], "not_enough_data": false,
      "questions": [{
        "id": 31, "code": "M6-FR-001", "type": "single_choice", "n": 14, "p": 0.9286, "r": 0.1203,
        "flags": ["too_easy", "low_discrimination"], "not_enough_data": false,
        "options": [
          { "option": 1, "label": "12", "correct": false, "count": 1, "share": 0.0714, "unused": false },
          { "option": 2, "label": "36", "correct": true, "count": 13, "share": 0.9286, "unused": false },
          { "option": 3, "label": "32", "correct": false, "count": 0, "share": 0, "unused": true }
        ]
      }]
    }]
  }]
}
```

## Attempts (Candidate)

Bearer token of an **active Candidate** with a current password; own data only. C-006 (P6a: list,
start, read; P6b: autosave, submit, sealing; grading follows in P6c, photos in P6d). Every request
first seals the Candidate's Attempts past their deadline + the Grace Period (D-044).

### GET /api/candidate/exams
Exams published to the classes where the Candidate's place is accepted (D-015, D-028):
```json
{ "exams": [{ "id": 4, "title": "Evaluare Unitatea 3", "description": null, "duration_minutes": 50,
  "available_from": "2026-11-30T06:00:00+00:00", "available_until": "2026-11-30T12:00:00+00:00",
  "max_attempts": 1, "attempts_used": 0, "state": "open", "open_attempt_id": null, "can_start": true,
  "results_published": false }] }
```
`state`: `upcoming` before `available_from`, `closed` from `available_until`, else `open` (either
end may be empty). `can_start`: open, an attempt left (D-012) and none still open.

Since P7a (the dashboard) the answer also has a top-level `server_time`, `classes`
(`{ "accepted": 1, "pending": 0 }`: the Candidate's class requests, for the empty states), and each exam:
`topics` (the distinct topic names of its Items; an Item with "any" topic adds none, Q-069),
`item_counts` (`{ "subject_1": 6, "subject_2": 2 }`), `open_attempt`
(`{ "id", "started_at", "expires_at" }` or `null`, beside `open_attempt_id`) and `submitted`
(the Candidate has a submitted or sealed Attempt of it: "submitted, awaiting grading", D-019).

Since P8b each exam also has `grade`: the grade (1–10, total / 10) of the Candidate's counted
Attempt under the score policy (D-012), only once the results are published; `null` before.

### GET /api/candidate/exams/{id}/results
P8b (DS-005). The Candidate's own results, only after the Examiner published them (D-019).
`409 results_not_published` before; `404` for an Exam not published to one of the Candidate's
classes. `200`:
```json
{ "exam": { "id": 4, "title": "Evaluare Unitatea 3", "score_policy": "highest",
    "results_published_at": "2026-12-01T16:20:00+00:00", "cohort_note": "Scrieți concluzia." },
  "attempts": [{ "id": 51, "attempt_number": 1, "submitted_at": "2026-11-30T07:48:00+00:00",
    "auto_submitted": false, "subject_1_score": 25, "subject_2_score": 44, "total_score": 79,
    "grade": 7.9, "counted": true,
    "items": [
      { "position": 1, "section": "subject_1", "type": "single_choice", "points": 5,
        "statement": "Trei sferturi din 48 reprezintă …", "options": ["12", "36", "32", "64"],
        "answer": 2, "awarded_points": 5, "correct": 2, "explanation": "Un sfert din 48 este 12 …" },
      { "position": 7, "section": "subject_2", "type": "structured_problem", "points": 20,
        "statement": "…", "options": [], "answer": "a) ∢B = 70° …", "awarded_points": 10,
        "images": [{ "id": 9, "position": 1, "name": "pagina-1.jpg", "size": 182044 }],
        "adjustment": 1, "comment": "La b) lipsește concluzia.", "uses_barem": true,
        "barem": [{ "description": "Triunghi isoscel", "points": 6, "earned": 6 }] }] }] }
```
Every Attempt the Candidate submitted, by number; `counted` marks the one whose grade counts
(D-012, Q-084). Subject I items (Q-082): `answer` and `correct` as shown to the Candidate (option
positions in the shown order, D-045; `true`/`false`; or the expected value), `explanation` from the
question (may be `null`). Subject II problems (Q-083): the written steps in `answer`, the Candidate's
photos (bytes from `GET /api/attempts/{id}/images/{imageId}`), `adjustment`, `comment`, and with a
barem each step's `points` and `earned`. No class statistics (Q-085).

### POST /api/candidate/exams/{id}/attempts
Starts an Attempt → `201 { "attempt" }` (below). The Attempt gets a seed; every Item its own Ready
question (D-057); named values drawn (D-006); options shuffled (D-045); all stored, so the same seed
rebuilds exactly what the Candidate saw. Its deadline is the start plus the Exam's full duration
(D-021). `409`: `attempt_open` (with `attempt_id`, to resume it), `no_attempts_left`,
`not_available` (upcoming, closed, or no longer drawable). `404` when the Exam isn't published to
the Candidate's accepted classes.

### GET /api/attempts/{id}
```json
{ "attempt": { "id": 12, "exam": { "id": 4, "title": "Evaluare Unitatea 3", "max_attempts": 1 }, "status": "started",
  "attempt_number": 1, "started_at": "…", "expires_at": "…", "accepts_answers_until": "…", "server_time": "…",
  "items": [{ "position": 1, "section": "subject_1", "type": "single_choice", "points": 5,
              "statement": "Trei sferturi din 48 reprezintă …", "options": ["32", "12", "64", "36"] }] } }
```
`options` in the shown order (empty for true/false and short answers). Never the answer key, the
option order, the drawn values or answer, the seed or a score (D-019). Another Candidate's Attempt
answers `404`.
Since P6b the Attempt also has `submitted_at`, `auto_submitted` (sealed at its deadline), and each
item its saved `answer`: `{ "value": 2, "version": 3, "marked_for_review": false, "saved_at": "…" }`
or `null`, so a refresh or another device resumes exactly where the Candidate stopped.

**Status** (catalog P13, Q-068): `started` until the first saved answer, then `in_progress`;
`submitted` by the Candidate or sealed; `graded` after grading (P8). No other change is possible.

**Deadline** (D-004, D-021): answers are accepted until `expires_at` plus the Grace Period,
`ATTEMPT_GRACE_SECONDS` (30 by default), on the server's clock only.

### PUT /api/attempts/{id}/items/{position}/answer
Autosave. Request: `{ "answer": …, "marked_for_review": false, "version": 3 }`.
- `version`: the client numbers its saves of this answer 1, 2, 3…. A save is stored only when its
  version is higher than the stored one; a repeated or late one changes nothing and still answers
  `200` with what is stored and `"applied": false`. That makes retries safe in any order.
- `answer` by type: true/false a boolean; single choice the shown position (1-based); multiple
  choice distinct shown positions, at least one (`[]` is refused); short answer a string (≤ 200);
  a Subject II problem its step-by-step text (≤ 10 000); only `null` clears it.
- `version`: 1 to 2147483647. `marked_for_review` is optional; left out, the stored mark stays.

`200 { "answer": { … }, "applied": true, "status": "in_progress" }`. `422 invalid_answer` (wrong
shape) or validation errors; `409 time_up` (past the deadline + grace: the Attempt is sealed);
`409 attempt_submitted`; `404` unknown position or another Candidate's Attempt.

### POST /api/attempts/{id}/submit
`200 { "attempt" }` with `status: submitted` and `submitted_at`. Repeating it changes nothing.
After the deadline + grace it seals instead (`auto_submitted: true`, `submitted_at` = `expires_at`);
answers saved in time count.

Whichever way an Attempt becomes submitted (submit, late submit or save, sealing on read or by the
cron), Subject I is graded in the same transaction (P6c): full points or 0 per item from the
Attempt's snapshot, shown positions mapped through the stored option order, short answers checked
against the Attempt's drawn answer (D-005, D-006, D-017). No score or correctness appears in any
response before publication (D-019).

### Subject II photos (P6d, D-026, D-048)
Up to 3 per Subject II problem, 10 MB each, JPG, PNG or HEIC (converted to JPG on the server). The
read gives each Subject II item's `images: [{ "id", "position", "name", "size" }]` (null for other
items) and a top-level `photos_enabled`: false in production until the object storage (Cloudflare
R2) and its keys are configured. Same deadline + grace as answers (409 `time_up`,
`attempt_submitted`).

- `POST /api/attempts/{id}/items/{position}/images` (multipart, field `image`) → `201 { "image": { "id": 31, "position": 2, "name": "IMG_2041.HEIC", "size": 2483312 } }`.
  The lowest free position (1–3). `422 image_type` (not a JPG/PNG/HEIC image), `image_too_large`,
  `not_a_problem` (not a Subject II problem); `409 images_full`; `503 storage_unavailable`.
- `DELETE /api/attempts/{id}/items/{position}/images/{imageId}` → `204`; frees the position.
- `GET /api/attempts/{id}/images/{imageId}` → the file, for the Attempt's own Candidate (an `<img>`
  can't send the token, so the SPA fetches it and shows it). Another Candidate: `404`.

## Cron

### POST /api/cron/seal-expired
For the external cron (D-044, Q-067), every 5 minutes. Header `X-Cron-Secret: <CRON_SECRET>`.
Seals every open Attempt past its deadline + grace → `200 { "sealed": 2 }`. Wrong or missing
header `403`; no `CRON_SECRET` configured `404`. The same Sealer runs as the scheduled command
`php artisan attempts:seal-expired`.

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

## Overview

C-009 (P11). Read-only overviews, computed on every read, with no Candidate data and no scores.

### GET /api/examiner/dashboard
Examiner only (DS-006), over their own exams; another role gets `403 forbidden_role`. `200 OK`:

```json
{
  "counts": { "active_exams": 1, "attempts_in_progress": 4, "awaiting_grading": 7 },
  "exams": [
    { "id": 12, "title": "Evaluare Unitatea 3", "state": "open", "available_until": "2026-11-30T12:00:00+02:00",
      "in_progress": 4, "awaiting_grading": 3, "results_published": false }
  ]
}
```

- `active_exams`: published exams whose window is open now.
- `attempts_in_progress`: Attempts `started` or `in_progress` still taking answers (deadline + the
  grace period, D-004); an expired Attempt not sealed yet (D-044) is not counted.
- `awaiting_grading`: Attempts `submitted` and not yet `graded`.
- `exams`: published exams that are open or have Attempts awaiting grading; open first, then
  newest. `state` is `open` or `closed` (an upcoming exam with nothing to grade isn't listed).

### GET /api/admin/exams
Administrator only (DS-012, Q-098): every exam on the platform, drafts included, newest first.
Read-only: the Administrator can't change an exam. `200 OK`:

```json
{
  "exams": [
    { "id": 12, "title": "Evaluare Unitatea 3", "examiner": { "id": 3, "name": "Ana Popa" },
      "status": "published", "state": "open",
      "available_from": "2026-11-30T09:00:00+02:00", "available_until": "2026-11-30T12:00:00+02:00",
      "results_published_at": null, "classes": [ { "id": 2, "name": "6A" } ],
      "attempts": { "submitted": 9, "graded": 4 } }
  ]
}
```

- `status`: `draft` or `published`; `state`: `upcoming`, `open` or `closed` for a published exam,
  `null` for a draft.
- `attempts.submitted`: submitted or graded Attempts; `attempts.graded`: graded ones.

## Accounts created by the operator
Administrators have no endpoint (D-055). They, and Examiners if needed, are created on the server with:
```bash
php artisan app:create-user examiner maria.popa@exemplu.ro Maria Popa
```
The command asks for the password twice and never takes it as an argument. The password is temporary
(D-054): the new user chooses their own at the first sign-in.
