# Open questions · Accounts and classes

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-007 · Does the platform have classes, and what is a cohort?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Yes. Candidates belong to classes; an Exam is published to one or more classes; the cohort in D-010 is the Candidates of the class(es) the Exam was published to. Who creates classes and how Candidates join is open (Q-021).

## Q-012 · How are Examiner accounts created?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Only an Administrator creates Examiner accounts. There is no Examiner self-registration and no "pending approval" login state.

## Q-013 · How is a forgotten password handled?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** No email reset. An Administrator (or the Examiner, for their class) sets a new password. The "Forgot Password" screen leaves the README screen list.
- **Note:** 2026-11-24: only the Administrator sets a new password now, and it is temporary (Q-042, D-054).

## Q-021 · Who creates classes, and how does a self-registered Candidate join one?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** The Examiner creates their classes; each class has a short join code. A Candidate enters the code at registration or later from the dashboard and stays pending until the Examiner accepts them.

## Q-026 · Does the SPA authenticate with a Sanctum cookie session or a bearer token?
- **Status:** answered
- **Date:** 2026-11-22
- **Context:** The uncommitted scaffold chose cookie sessions (`SESSION_DRIVER=database`, `SANCTUM_STATEFUL_DOMAINS`, `$middleware->statefulApi()`), while the approved auth plans (docs/plans/auth-part-1-backend.md, auth-parts-2-and-3.md) issue a bearer token stored in localStorage. The SPA and API run on different Render domains (D-014), which affects cookie sessions. P0 leaves `statefulApi()` out; P2 needs the answer.
- **Answer:** A Sanctum bearer token: issued at login, kept by the SPA in localStorage and sent in the `Authorization` header; logout revokes it. Chosen over a cookie session because the site and the API are on different onrender.com domains, and onrender.com is a public suffix, so a session cookie would be cross-site (`SameSite=None`) and blocked by Safari. Matches the approved auth plans (D-050). (Answered 2026-11-23.)

## Q-038 · Can a class linked to a published Exam be deleted?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** No. Raised by the P1c security review: deleting a class removed its links silently, hiding a published Exam and its results from that class's Candidates. The database now refuses deleting a linked class, and P3 unlinks draft Exams first (D-049).

## Q-040 · What happens when the class code entered at registration matches no class?
- **Status:** answered
- **Date:** 2026-11-23
- **Blocks:** P2 (registration, DS-002), P3 (join requests)
- **Context:** D-028 lets a Candidate enter a class code at registration, but says nothing about a code that matches no class. Options: refuse the registration and show the error on the code field (nothing is created; the Candidate fixes the code or clears it), or create the account anyway and tell the Candidate the code was not found. The DS-002 mock shows it in its "Cod greșit" state.
- **Answer:** The registration is refused: nothing is created, and the code field says the code matches no class. The Candidate fixes the code or clears the field (it stays optional) and submits again. Chosen so a typo is caught while the teacher's code is at hand, instead of leaving an account outside its class (D-053). (Answered 2026-11-23.)

## Q-041 · What does the roster's "more options" menu on DS-013 contain, and can a declined Candidate ask to join again?
- **Status:** open
- **Date:** 2026-11-23
- **Blocks:** P3 (roster menu; joining after a decline)
- **Context:** DS-013 shows a "…" button per Candidate in the roster with no menu drawn (removing a Candidate from the class is a likely item). D-028 keeps a declined request's row, one per Candidate and class, and doesn't say whether that Candidate may send a new request. Until answered, the menu is not built and joining after a decline is refused as already decided.
- **Note:** 2026-11-24: the "…" button and the empty "Acțiuni" column left the DS-013 mock and roster (P3b); they come back with the menu once this is answered.

## Q-042 · Who resets a forgotten password, and is the new password temporary?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P3 (DS-013 password dialog), P11 (DS-011 Administrator screen)
- **Context:** D-020 let the Examiner set a new password for a Candidate in their class, in a dialog that showed it in plain text and asked for it once. The user moved resets to the Administrator, with a temporary password, while no Administrator screen exists yet.
- **Answer:** Only the Administrator resets passwords, on an Administrator screen built now (the Administrator screens leave the cut list). The Administrator types the password, hidden and twice. It is temporary for every user whose password an Administrator sets, and for new Examiner accounts: at the next sign-in they must choose a new one, different from the temporary one. A temporary password does not expire. The Examiner's "Parolă nouă" button on DS-013 goes away (D-054). (Answered 2026-11-24.)

## Q-043 · Can the Administrator reactivate a deactivated user?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P3b (DS-011 row actions)
- **Context:** DS-011 deactivates users (existing `is_active`: tokens revoked, login refused). Nothing says whether that can be undone. Until answered, DS-011 has no reactivate action and the mock shows a deactivated user's row without one.
- **Answer:** No. Deactivation is permanent. (Answered 2026-11-24.)

## Q-044 · Who can be deactivated on DS-011: other Administrators, and the Administrator themselves?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P3b (DS-011 row actions, admin endpoint)
- **Context:** Deactivating one's own account would lock the only Administrator out; deactivating another Administrator may or may not be wanted. Until answered, the Deactivate action is drawn only on Candidate and Examiner rows.
- **Answer:** No Administrator account can be deactivated on DS-011, neither another Administrator's nor one's own. Only Candidates and Examiners can. (Answered 2026-11-24.)
