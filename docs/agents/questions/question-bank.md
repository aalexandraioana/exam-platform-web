# Open questions · Question bank

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-004 · How should question parameterization and mathematical constraints be modeled?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Standard fixed questions are the default (`is_parameterized = false`). A per-question toggle enables parameterization in either of two forms: (1) examiner-written Variants (e.g. Variant A and Variant B) that can change the wording or the values of the same exercise; (2) values drawn per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`, to avoid negative results in Grade 5 subtraction). For drawn values the Examiner previews the generated values before the Exam is published. Teachers are not asked to write complex constraint rules. The assigned Variant or drawn values and the expected answer are snapshotted per Attempt, and expressions are evaluated safely on the server. (Clarified 2026-11-22: the earlier text only described form 1; the user confirmed both forms plus the preview step.)

## Q-008 · Which numeric answer formats are accepted?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Both decimal separators are accepted (`2,5` and `2.5`). A fraction answer must be in the form the Examiner expects (e.g. simplified); an equal value in another form is not accepted.

## Q-010 · How are short text answers matched?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Case, extra whitespace and diacritics are ignored, and the Examiner can list several accepted answers per question.

## Q-019 · Is the question bank shared between Examiners or private to its author?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Private, with copy to share: each Examiner sees and uses only their own questions, but can publish a question to a shared library; other Examiners copy it into their own pool (the copy is theirs to edit).

## Q-022 · Where is the question pool of at least 60 verified questions kept?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** The database is the source of truth. The initial pool is loaded once by a seeder from a seed file; the seeder only inserts questions whose stable code is not yet in the database and never updates or deletes, so questions added or edited in the UI are safe. BANK.md does not hold question text: it is the validation and pilot log the catalog requires (per validated question: code, competence, the 2+ colleagues who validated it, when, what they corrected; plus the results of the pilot with 10+ Candidates). Questions added later in the UI need a BANK.md row only if they count toward the validated 60.

## Q-023 · How is a question's specific competence identified?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** A small fixed list of competences covering only the planned topics and scope (e.g. C1–C4 for a chapter), not the full curriculum. Questions and blueprint Items are tagged from this list, and Item Analysis groups by it.

## Q-035 · Which curriculum topics are seeded?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Not applicable. D-039 makes topics the Examiner's own descriptive labels, so there is no curriculum topic list to seed.

## Q-046 · How does an Item match a question's topics?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b (question editor), P5, P6
- **Context:** D-039 lets a question carry several topic labels, which "don't structure anything". If Items match on topic: does a question keep several topics (it matches when the Item's topic is one of them) or get exactly one; is a topic required before Ready (D-042); and may an Item leave topic or type as "any"?
- **Answer:** Exactly one topic per question. An Item may leave topic or type as "any". (Answered 2026-11-24.)

## Q-047 · Are fixed values in a parameterised question marked too?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (math engine), P4b (DS-007 editor)
- **Context:** DS-007 marks values that change with {braces} in the statement: each is either drawn from an interval ("Intervale") or calculated from the drawn ones ("Valori calculate"); a fixed number is plain text. The user said fixed, random and calculated values "need to be marked". Option: fixed values are named too ({k} with one value), so all three kinds are listed and visible in the editor.
- **Answer:** Left to Claude's choice by the user: fixed values are named too ({k} with one value), so the editor lists fixed, random and calculated values side by side. (Answered 2026-11-24.)

## Q-048 · What can a value domain be?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (math engine), P4b (DS-007 editor)
- **Context:** D-043 allows min/max bounds with simple conditions (e.g. `a > b`), and DS-007 draws whole numbers. Open: whole numbers only, or also decimals (how many places) or a step (e.g. multiples of 5); a list of allowed values; excluded values (e.g. not 0).
- **Answer:** Whole numbers only, between min and max, with optional excluded values (e.g. not 0); simple conditions stay (D-043). (Answered 2026-11-24.)

## Q-049 · Must calculated values and the answer of a parameterised question be whole numbers?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (draw), P4b (preview)
- **Context:** Random values are whole numbers (Q-048), but a calculated value or the answer can come out non-whole through division (7 : 2 = 3,5; 1 : 3 = 0,333…). Options: reject such a draw and draw again (only whole results), or allow decimals up to a fixed number of places (shown with a comma) and reject only longer ones.
- **Answer:** Only whole results: a draw whose calculated value or answer isn't a whole number is thrown away and drawn again. (Answered 2026-11-24.)

## Q-050 · Which question types can use named values?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a, P4b
- **Context:** DS-007 shows values for a short-answer question with a numeric answer. Values could also appear in a Subject II problem statement (graded by hand, no computed answer), or in choice options (e.g. options {a}, {a + 1}, which then need distinct values).
- **Answer:** All three: short answer with a numeric answer, Subject II problem statements (no computed answer), and the options of choice questions. (Answered 2026-11-24.)

## Q-051 · Can the answer of a parameterised question be a fraction?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (answer matching)
- **Context:** D-017 accepts a fraction only in the form the Examiner expects. With drawn values the form must be computed (e.g. p/q simplified), which means choosing a rule for "the expected form".
- **Answer:** No. A parameterised question's answer is a number only. (Answered 2026-11-24.)

## Q-052 · Which operations can formulas use?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4a (whitelist, D-013)
- **Context:** The seed template says + - * / and parentheses. 6th-grade problems may also want powers (2³), the remainder of a division, or the absolute value.
- **Answer:** + − · : and parentheses only (`*`, `×` and `/` also accepted as the same operations). No powers, remainder or absolute value. (Answered 2026-11-24.)

## Q-053 · Where does an Examiner create competences, topics and pools?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** DS-007 shows only dropdowns and "+ Adaugă într-un set".
- **Answer:** Inline: each dropdown ends with "+ Competență nouă…" / "+ Temă nouă…" / "+ Set nou…", opening a small dialog. Renaming and deleting come later. (Answered 2026-11-24.)

## Q-054 · Who sets the code of a question created in the app?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** Seeded questions get the code written in questions.yaml (D-029).
- **Answer:** The Examiner types it when creating the question; it must be unique and can't be changed once saved. (Answered 2026-11-24.)

## Q-055 · What replaces DS-007's "Folosită în" column?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** Under D-057 exams draw from pools, not listed questions, so "used in N exams" is no longer a simple fact.
- **Answer:** The question's pools; a usage count may come back with P5. (Answered 2026-11-24.)

## Q-056 · Can a question be deleted?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** DS-007 has no delete action; attempt_items reference questions (restrict on delete).
- **Answer:** Yes, after a confirmation, as long as no Attempt has drawn it. (Answered 2026-11-24.)

## Q-057 · What happens when a Ready question is edited so it is no longer complete?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** D-059 lists what Ready needs.
- **Answer:** Saving is refused and the checklist shows what is missing; the Examiner moves it back to Draft explicitly ("Mută în ciorne"). (Answered 2026-11-24.)

## Q-058 · Can an Examiner take back an entry they published to the library?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P4b
- **Context:** D-040: publishing makes a frozen copy; copies others made are theirs.
- **Answer:** Not in P4b. (Answered 2026-11-24.)

## Q-074 · How does questions.yaml get into the live bank?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P4c
- **Context:** The repo is public, so committed answer keys can be read by pilot Candidates; Render's free plan has no server shell; D-059 decides when a question can be Ready.
- **Answer:** questions.yaml is committed (no .gitignore), knowing its answer keys are public. A question that is well-formed but incomplete loads as Draft, with what it still needs listed; complete ones load as Ready. The live load runs from the user's machine with `app:load-questions <email>` against the live database URL (read with `read -s`, `sslmode=require`). (Answered 2026-11-26.)
