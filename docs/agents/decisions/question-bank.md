# Decisions · Question bank

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-006 · Exact-match numeric tolerance with concrete parameter persistence
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-26
- **Rule:** Parameterized questions evaluate formulas with exact-match numeric tolerance (tolerance = 0), and each attempt permanently records its concrete generated parameter values.
- **Why:** Matches the precision needed for 6th-grade mathematics problems and guarantees exact auditability and problem reconstruction during grade contests.
- **Rejected:** Loose floating-point percentage tolerance; storing only random seeds without snapshotting evaluated parameters.
- **Evidence:** README.md:35
- **Source:** user · confidence high

## D-013 · Sandboxed PHP mathematical expression library for formula evaluation
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-26
- **Rule:** Parameterized question formulas are evaluated on the backend using a dedicated sandboxed PHP mathematical expression library with an operation whitelist, strictly avoiding native PHP eval().
- **Why:** Meets the catalog security constraint requiring sandboxed formula parsing to prevent arbitrary code execution on dynamically evaluated expressions.
- **Rejected:** Native PHP `eval()`; executing formulas in shell or unverified external processes.
- **Evidence:** README.md:83, catalog-de-proiecte-web.md:905
- **Source:** user · confidence high

## D-017 · Answer matching rules for numbers and text
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** Numeric answers accept both decimal separators ("2,5" and "2.5"); a fraction answer must be in the form the Examiner expects (an equal value in another form is wrong). Text answers are compared after ignoring case, extra whitespace and diacritics, against an Examiner-defined list of accepted answers. D-006 (tolerance 0) still holds.
- **Why:** Romanian notation uses the decimal comma, and 6th-grade ratio work often expects a specific fraction form; short answers such as "se înjumătățesc" are often typed without diacritics.
- **Rejected:** Accepting any equal-valued fraction; strict exact text matching; numeric-only short answers.
- **Evidence:** docs/agents/questions/question-bank.md:Q-008, Q-010; INTERVIEW.md:Q13
- **Source:** user · confidence high

## D-018 · Fixed questions by default, two parameterization forms
- **Status:** superseded-by D-024
- **Date:** 2026-11-22
- **Rule:** Questions are fixed by default (`is_parameterized = false`). When parameterized, a question uses either examiner-written Variants (wording or values differ) or values drawn per Attempt from min/max bounds with at most simple conditions (e.g. `a > b`). Drawn values are previewed by the Examiner before the Exam is published. The assigned Variant or drawn values and the expected answer are snapshotted per Attempt (D-006) and evaluated by the sandboxed library (D-013).
- **Why:** The interview showed teachers already use two rows of Variants and fear generated values they cannot check; simple bounds plus a preview keep generated items correct without complex rules.
- **Rejected:** Complex constraint rule languages; parameterization without examiner preview.
- **Evidence:** docs/agents/questions/question-bank.md:Q-004; INTERVIEW.md:Q5, Q8, Q13
- **Source:** user · confidence high

## D-027 · Private question pools with a shared library
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-24
- **Rule:** Each Examiner's questions are private to them. An Examiner can publish a question to a shared library; other Examiners copy it into their own bank, and the copy is theirs to edit.
- **Why:** Keeps each Examiner in control of their questions while making it easier to fill blueprint Items with Variants.
- **Rejected:** One shared pool where only the author edits; one shared pool anyone edits; fully private pools.
- **Evidence:** docs/agents/questions/question-bank.md:Q-019
- **Source:** user · confidence high

## D-029 · Database as question source, BANK.md as validation and pilot log
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** The database is the source of truth for questions. The initial pool is loaded by an insert-only seeder keyed on a stable, unique question code; it never updates or deletes, so questions added or edited in the UI are safe. BANK.md holds no question text: it is the validation and pilot log (per validated question: code, competence, the 2+ colleagues who validated it, when, what they corrected; plus the results of the pilot with 10+ Candidates).
- **Why:** Avoids two sources of truth while meeting the catalog requirement to record peer validation and pilot results in BANK.md.
- **Rejected:** BANK.md as the re-seeded question source; generating the question list into BANK.md.
- **Evidence:** docs/agents/questions/question-bank.md:Q-022; catalog-de-proiecte-web.md:882, 916
- **Source:** user · confidence high

## D-030 · Small fixed competence list
- **Status:** superseded-by D-039
- **Date:** 2026-11-22
- **Rule:** Competences come from a small fixed list covering only the planned topics and scope (e.g. C1–C4 per chapter), not the full curriculum. Questions and blueprint Items are tagged from this list, and Item Analysis groups by it.
- **Why:** Enough structure for blueprint coverage (D-025) and Item Analysis without loading and maintaining the full curriculum.
- **Rejected:** The full official curriculum list; each Examiner's own list; free text per question.
- **Evidence:** docs/agents/questions/question-bank.md:Q-023
- **Source:** user · confidence high

## D-032 · Draft and Ready question status
- **Status:** superseded-by D-042
- **Date:** 2026-11-22
- **Rule:** Each question is Draft or Ready. Only Ready questions can be picked for an Attempt; the Exam builder shows Draft Variants as "not ready", and an Exam cannot be published while an Item has no Ready Variant. A question can be marked Ready only when its required fields are complete: statement, points and competence for every question; an answer key for Subject 1; a complete barem for Subject 2 only if the Examiner chose to use one (D-031).
- **Why:** Random picks (D-025) must never hand a Candidate a half-written question.
- **Rejected:** Treating every saved question as usable.
- **Evidence:** Conversation 2026-11-22; docs/design/research-quiz-platforms.md S-12
- **Source:** user · confidence high

## D-039 · Examiner-defined competences and topic labels
- **Status:** superseded-by D-058
- **Date:** 2026-11-22
- **Rule:** Each Examiner keeps their own list of competences: a short code (e.g. C1, unique for that Examiner) and a Romanian description of what is assessed (e.g. "knows that the angles of a triangle add up to 180°"). Questions and blueprint Items are tagged with one of the Examiner's competences, and Item Analysis groups by them. Topics are only descriptive labels from the Examiner's own list; a question can have several, and they don't structure anything. Questions and exams carry a grade level (5–8).
- **Why:** Competences are what the teacher decides to assess, not a fixed list; topics (chapters such as Mulțimi de numere întregi, Drepte, Unghiuri) only describe questions, and a bank may mix them.
- **Rejected:** A small fixed competence list (D-030); topics as a seeded curriculum structure that groups competences; competences tied to a topic.
- **Evidence:** Conversation 2026-11-22 (P1 plan gate); INTERVIEW.md Q1 ("competentele specifice din respectiva unitate")
- **Source:** user · confidence high

## D-040 · Library entries are frozen copies
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** Only Ready questions can be published to the shared library (D-027). Publishing makes a frozen copy with its own code, author and publish date; later edits to the author's question don't change it. Copying a library entry into another Examiner's bank creates an independent question that remembers which entry it came from, and also copies its competence and topic labels into the copier's own lists.
- **Why:** Matches DS-007 (separate LIB- codes, "Copiată · M6-TR-011", "Doar întrebările finalizate pot fi publicate") and keeps every Examiner in control of their own questions.
- **Rejected:** The library showing the author's live question; copies without the competence (the copier picks one).
- **Evidence:** Conversation 2026-11-22 (P1 and P1b plan gates); docs/design/mocks/DS-007.html
- **Source:** user · confidence high

## D-041 · One bank per Examiner, organised in pools
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** Each Examiner has one bank: all their questions, private to them (D-027). Inside it they can create named pools; a question can be in several pools or in none, and deleting a pool keeps its questions. Exam Items draw from pools (D-043).
- **Why:** The bank is the storage place; pools are the groups an Examiner builds for exams, as in the catalog's "8 întrebări din pool-ul A (ușor), 4 din B (greu)".
- **Rejected:** Several separate banks per Examiner; a question belonging to exactly one pool; pools only for organising.
- **Evidence:** Conversation 2026-11-22 (P1b plan gate); catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-042 · Draft and Ready question status
- **Status:** superseded-by D-059
- **Date:** 2026-11-22
- **Rule:** Each question is Draft or Ready. A Draft needs only its Subject (I or II) and type. A question can be marked Ready only when its statement, points, competence, grade level and difficulty are set, plus an answer key for Subject I and a complete barem for Subject II if the Examiner chose to use one (D-031). Only Ready questions can be picked for an Attempt or published to the library (D-040); the Exam builder shows Draft questions as "not ready", and an Exam cannot be published unless D-043's publish check passes.
- **Why:** Random picks (D-043) must never hand a Candidate a half-written question, and grade level and difficulty are needed to match questions to Items and filter the bank.
- **Rejected:** Treating every saved question as usable; Ready without grade level and difficulty (D-032).
- **Evidence:** Conversation 2026-11-22 (P1b plan gate); docs/design/research-quiz-platforms.md S-12
- **Source:** user · confidence high

## D-058 · Examiner-defined competences; one topic per question
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-27
- **Rule:** Each Examiner keeps their own list of competences: a short code (e.g. C1, unique for that Examiner) and a Romanian description of what is assessed. Questions and blueprint Items are tagged with one of the Examiner's competences, and Item Analysis groups by them. Each Examiner also keeps their own list of topics (chapters such as Mulțimi de numere întregi, Drepte, Unghiuri); a question has exactly one topic, and Items can match on it (D-057). Questions and exams carry a grade level (5–8).
- **Why:** Competences are what the teacher decides to assess; the user wants Items to draw by topic, with one topic per question (Q-046).
- **Rejected:** Several topics per question (D-039); a small fixed competence list (D-030); topics as a seeded curriculum structure; competences tied to a topic.
- **Evidence:** docs/agents/questions/question-bank.md:Q-046; supersedes D-039
- **Source:** user · confidence high

## D-059 · Draft and Ready question status
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-26
- **Rule:** Each question is Draft or Ready. A Draft needs only its Subject (I or II) and type. A question can be marked Ready only when its statement, points, competence, topic, grade level and difficulty are set, plus an answer key for Subject I and a complete barem for Subject II if the Examiner chose to use one (D-031). A parameterised question is Ready only when every {name} in its statement is defined and its preview produces valid values. Only Ready questions can be picked for an Attempt or published to the library (D-040); the Exam builder shows Draft questions as "not ready", and an Exam cannot be published unless D-057's publish check passes.
- **Why:** Random picks (D-057) must never hand a Candidate a half-written question, and every field an Item can match on must be set.
- **Rejected:** Ready without a topic (a question could then only match Items set to "any"); treating every saved question as usable.
- **Evidence:** supersedes D-042; D-057, D-058
- **Source:** user (approved proposal, 2026-11-24) · confidence high
