# Decisions superseded — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Decisions that no longer apply. **Never obeyed**; read only to explain old code or a
> past choice. Each points to the entry that replaced it. `ledger-lint.py --fix`
> keeps this file in sync: superseded entries move here from `DECISIONS.md`, and
> their index lines move here from its index.
<!-- graffino-agentic:end -->

## Index
- D-010 · Two-step examiner feedback publication after full grading · _superseded-by D-019_
- D-016 · Random question draw per Attempt · _superseded-by D-023_
- D-018 · Fixed questions by default, two parameterization forms · _superseded-by D-024_
- D-023 · Exam blueprint with equivalent alternatives per slot · _superseded-by D-025_
- D-024 · Variants as slot alternatives, letters by alternation with Examiner override · _superseded-by D-025_

---

## D-010 · Two-step examiner feedback publication after full grading
- **Status:** superseded-by D-019
- **Date:** 2026-11-18
- **Rule:** Feedback is published by the Examiner in two channels after full grading is complete: (1) a single global cohort note published all at once, visible to all candidates who took the exam; (2) private per-problem partial points and comments on each Subject 2 submission, released to each candidate only upon explicit publication by the Examiner.
- **Why:** Confirmed by client interview and repository owner; matches Romanian classroom grading practices where general feedback on common errors is shared with the entire cohort, while detailed per-item proof feedback is individual.
- **Rejected:** Real-time feedback before all submissions are graded; publishing partial grades piece-by-piece.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-005, INTERVIEW.md:Q16
- **Source:** user · confidence high

## D-016 · Random question draw per Attempt
- **Status:** superseded-by D-023
- **Date:** 2026-11-22
- **Rule:** Each Attempt draws its own questions from the question pool by rules the Examiner sets on the Exam (rule format: Q-020). The drawn list is stored per Attempt.
- **Why:** Delivers the catalog requirement of Exams generated from question pools and reduces copying.
- **Rejected:** One fixed question list shared by every Attempt; mixing pinned and drawn questions.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-006, README.md §6 (randomized pool criteria)
- **Source:** user · confidence high

## D-018 · Fixed questions by default, two parameterization forms
- **Status:** superseded-by D-024
- **Date:** 2026-11-22
- **Rule:** Questions are fixed by default (`is_parameterized = false`). When parameterized, a question uses either examiner-written Variants (wording or values differ) or values drawn per Attempt from min/max bounds with at most simple conditions (e.g. `a > b`). Drawn values are previewed by the Examiner before the Exam is published. The assigned Variant or drawn values and the expected answer are snapshotted per Attempt (D-006) and evaluated by the sandboxed library (D-013).
- **Why:** The interview showed teachers already use two rows of Variants and fear generated values they cannot check; simple bounds plus a preview keep generated items correct without complex rules.
- **Rejected:** Complex constraint rule languages; parameterization without examiner preview.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-004; INTERVIEW.md:Q5, Q8, Q13
- **Source:** user · confidence high

## D-023 · Exam blueprint with equivalent alternatives per slot
- **Status:** superseded-by D-025
- **Date:** 2026-11-22
- **Rule:** An Exam is a blueprint: an ordered list of slots, each fixing section, specific competence, difficulty and points. Each slot lists one or more equivalent questions (its alternatives, labelled A, B, …); each Attempt gets exactly one question per slot. A one-question slot is the same for everyone. Which alternative an Attempt gets follows the letter rule in D-024. The picked list is stored per Attempt. Item Analysis reports per question and per slot.
- **Why:** Every Attempt must cover all specific competences of the unit within the time limit, with the same difficulty curve, while neighbours get different papers (INTERVIEW.md Q2, Q12, Q13).
- **Rejected:** Free random draw by topic and difficulty (D-016: no coverage guarantee); one fixed list for everyone (loses pool-generated Exams).
- **Evidence:** Conversation 2026-11-22; docs/agents/OPEN-QUESTIONS.md:Q-020
- **Source:** user · confidence high

## D-024 · Variants as slot alternatives, letters by alternation with Examiner override
- **Status:** superseded-by D-025
- **Date:** 2026-11-22
- **Rule:** Questions are fixed by default (`is_parameterized = false`). Written Variants are not a mechanism inside a question: they are equivalent questions placed as alternatives in the same blueprint slot (D-023). Each Attempt gets one letter (A, B, …) used for every slot; letters are handed out alternately in the order Attempts start within a class, and the Examiner can override any Candidate's letter before the Exam starts. Separately, a question may draw values per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`); the Examiner previews the drawn values before publishing. The picked question, the drawn values and the expected answer are snapshotted per Attempt (D-006) and evaluated by the sandboxed library (D-013).
- **Why:** One mechanism for written versions instead of two; an even automatic split with a manual override for classroom seating; a clear letter per Attempt helps spot copying while grading Subject 2 (INTERVIEW.md Q13).
- **Rejected:** Variants inside a question alongside slot alternatives (D-018); random letter per question; Examiner-only assignment.
- **Evidence:** Conversation 2026-11-22; docs/agents/OPEN-QUESTIONS.md:Q-004, Q-016
- **Source:** user · confidence high
