# Decisions · Accounts and classes

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-015 · Classes and Exam publication to classes
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** Candidates belong to classes. An Exam is published to one or more classes, and only Candidates of those classes see it. The cohort for feedback (D-019) is the Candidates of the classes the Exam was published to.
- **Why:** Matches the classroom reality from the interview and the approved DS-003 mock ("Clasa a VI-a B", "pentru clasa ta").
- **Rejected:** Published Exams visible to every Candidate; grade level as the only filter.
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-007
- **Source:** user · confidence high

## D-020 · Admin-created Examiner accounts and manual password reset
- **Status:** superseded-by D-054
- **Date:** 2026-11-22
- **Rule:** Only an Administrator creates Examiner accounts; there is no Examiner self-registration and no pending-approval state. There is no email password reset: an Administrator, or the Examiner for Candidates in their class, sets a new password.
- **Why:** Keeps account control with the school and avoids a mail service.
- **Rejected:** Examiner self-registration with approval; email reset links.
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-012, Q-013
- **Source:** user · confidence high

## D-028 · Examiner-created classes with join code and approval
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-25
- **Rule:** Examiners create their classes; each class has a short join code. A Candidate enters the code at registration or later from the dashboard and stays pending until the Examiner accepts them. D-015 still holds.
- **Why:** Self-registered Candidates need a way into a class, and approval blocks strangers who got the code.
- **Rejected:** Join code without approval; Examiner adds Candidates by email; Administrator-managed classes.
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-021
- **Source:** user · confidence high

## D-049 · A class linked to an Exam can't be deleted
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-24
- **Rule:** The database refuses to delete a class that is still linked to any Exam. Deleting a class first unlinks it from draft (unpublished) Exams; a class linked to a published Exam can't be deleted, so its Candidates keep seeing the Exam and its results (D-015, D-019).
- **Why:** Deleting a class used to remove its links silently, hiding a published Exam and its results from that class's Candidates.
- **Rejected:** Deleting the class and its links silently (the earlier P1c rule).
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-038; P1c review 2026-11-22
- **Source:** user · confidence high

## D-050 · The SPA authenticates with a Sanctum bearer token
- **Status:** approved
- **Date:** 2026-11-23
- **Confirmed:** 2026-11-26
- **Rule:** Login and registration return a Sanctum personal access token. The SPA stores it in localStorage and sends it as `Authorization: Bearer <token>` on every API request; protected routes use `auth:sanctum`. Logout revokes the current token. The API does not use `statefulApi()` or session cookies.
- **Why:** The site and the API run on different onrender.com domains (D-014). onrender.com is a public suffix, so a session cookie would be cross-site (`SameSite=None`), which Safari blocks.
- **Rejected:** Sanctum SPA cookie session (needs one custom domain for the site and the API).
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-026; docs/plans/auth-part-1-backend.md
- **Source:** user · confidence high

## D-053 · A class code at registration that matches no class refuses the registration
- **Status:** approved
- **Date:** 2026-11-23
- **Confirmed:** 2026-11-23
- **Rule:** The class code at registration is optional. When one is entered and matches no class, the registration is refused with a validation error on the code field and no account is created. When it matches, the account is created with a pending join request for that class (D-028).
- **Why:** A mistyped code is caught while the teacher's code is still at hand, so no Candidate ends up outside their class unnoticed.
- **Rejected:** Creating the account anyway and telling the Candidate the code was not found.
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-040; docs/design/mocks/DS-002.html
- **Source:** user · confidence high

## D-054 · Only the Administrator sets a new password, and it is temporary
- **Status:** approved
- **Date:** 2026-11-24
- **Rule:** Only an Administrator creates Examiner accounts (no self-registration, no pending approval) and only an Administrator sets a new password, for any user, on the Administrator screen (DS-011). There is no email reset. The Administrator types the password twice, hidden, with show/hide. A password set by the Administrator, including the first password of an account created with `app:create-user`, is temporary: at the next sign-in the user must choose a new password, different from the temporary one, before doing anything else. A temporary password does not expire. Examiners no longer set passwords for Candidates.
- **Why:** Keeps password resets with one role, and a password someone else knows does not stay in use.
- **Rejected:** Examiner sets a Candidate's password (D-020); a password generated by the system; expiring temporary passwords; email reset links.
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-042, Q-013
- **Source:** user · confidence high

## D-055 · A user's role is fixed when the account is created
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-26
- **Rule:** A user's role never changes after the account is created. Candidates register themselves; an Administrator creates Examiners (DS-011 or `app:create-user`); Administrators are created only with `app:create-user`. No screen or endpoint changes a role.
- **Why:** The user fixed roles while scoping the Administrator screen (P3b).
- **Rejected:** A role control on DS-011.
- **Evidence:** docs/plans/p3b-admin-password-reset.md; backend/app/Models/User.php (`role` not fillable)
- **Source:** user · confidence high

## D-056 · Deactivation is permanent and never applies to Administrators
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-26
- **Rule:** An Administrator can deactivate Candidates and Examiners only. A deactivated account can't be reactivated: it is signed out everywhere and refused at login, and its data stays. The API refuses deactivating an Administrator (403) and reactivating anyone.
- **Why:** The user's answers to Q-043 and Q-044.
- **Rejected:** Reactivation; deactivating Administrators, including oneself.
- **Evidence:** docs/agents/questions/accounts-and-classes.md:Q-043, Q-044; docs/design/mocks/DS-011.html
- **Source:** user · confidence high
