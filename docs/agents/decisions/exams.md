# Decisions · Exams

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-012 · Configurable attempt limits and score aggregation policy
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-26
- **Rule:** The platform supports configurable attempt limits per Exam (single or multiple attempts) defined by the Examiner, with score aggregation policy (e.g., highest score or latest score).
- **Why:** Satisfies the catalog requirement for configurable attempts, providing flexibility for both summative graded exams (1 attempt) and formative practice modules.
- **Rejected:** Hardcoded single-attempt restriction across all exams.
- **Evidence:** README.md:37, catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-016 · Random question draw per Attempt
- **Status:** superseded-by D-023
- **Date:** 2026-11-22
- **Rule:** Each Attempt draws its own questions from the question pool by rules the Examiner sets on the Exam (rule format: Q-020). The drawn list is stored per Attempt.
- **Why:** Delivers the catalog requirement of Exams generated from question pools and reduces copying.
- **Rejected:** One fixed question list shared by every Attempt; mixing pinned and drawn questions.
- **Evidence:** docs/agents/questions/exams.md:Q-006, README.md §6 (randomized pool criteria)
- **Source:** user · confidence high

## D-023 · Exam blueprint with equivalent alternatives per slot
- **Status:** superseded-by D-025
- **Date:** 2026-11-22
- **Rule:** An Exam is a blueprint: an ordered list of slots, each fixing section, specific competence, difficulty and points. Each slot lists one or more equivalent questions (its alternatives, labelled A, B, …); each Attempt gets exactly one question per slot. A one-question slot is the same for everyone. Which alternative an Attempt gets follows the letter rule in D-024. The picked list is stored per Attempt. Item Analysis reports per question and per slot.
- **Why:** Every Attempt must cover all specific competences of the unit within the time limit, with the same difficulty curve, while neighbours get different papers (INTERVIEW.md Q2, Q12, Q13).
- **Rejected:** Free random draw by topic and difficulty (D-016: no coverage guarantee); one fixed list for everyone (loses pool-generated Exams).
- **Evidence:** Conversation 2026-11-22; docs/agents/questions/exams.md:Q-020
- **Source:** user · confidence high

## D-024 · Variants as slot alternatives, letters by alternation with Examiner override
- **Status:** superseded-by D-025
- **Date:** 2026-11-22
- **Rule:** Questions are fixed by default (`is_parameterized = false`). Written Variants are not a mechanism inside a question: they are equivalent questions placed as alternatives in the same blueprint slot (D-023). Each Attempt gets one letter (A, B, …) used for every slot; letters are handed out alternately in the order Attempts start within a class, and the Examiner can override any Candidate's letter before the Exam starts. Separately, a question may draw values per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`); the Examiner previews the drawn values before publishing. The picked question, the drawn values and the expected answer are snapshotted per Attempt (D-006) and evaluated by the sandboxed library (D-013).
- **Why:** One mechanism for written versions instead of two; an even automatic split with a manual override for classroom seating; a clear letter per Attempt helps spot copying while grading Subject 2 (INTERVIEW.md Q13).
- **Rejected:** Variants inside a question alongside slot alternatives (D-018); random letter per question; Examiner-only assignment.
- **Evidence:** Conversation 2026-11-22; docs/agents/questions/question-bank.md:Q-004, Q-016
- **Source:** user · confidence high

## D-025 · Exam blueprint with a random Variant per Item
- **Status:** superseded-by D-043
- **Date:** 2026-11-22
- **Rule:** An Exam is a blueprint: an ordered list of Items, each fixing section, competence (the Examiner's own, D-039), difficulty and points. Each Item holds one or more similar, equivalent questions (its Variants). When an Attempt starts, the server picks one Variant per Item at random, independently per Item; an Item with one question is the same for everyone. There are no letters, rows or manual assignment. Questions are fixed by default; a question may also draw values per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`), which the Examiner previews before publishing. The picked questions, any drawn values and the expected answers are stored per Attempt (D-006, D-013), so the Examiner sees which Variant each Candidate got. Item Analysis reports per question and per Item.
- **Why:** Every Attempt covers all competences with the same difficulty curve (INTERVIEW.md Q2, Q12), while similar questions are randomly assigned to different Candidates to make copying harder (INTERVIEW.md Q13).
- **Rejected:** Free random draw by topic (D-016, no coverage guarantee); one letter per Attempt by alternation with Examiner override (D-024); a fixed list for everyone.
- **Evidence:** Conversation 2026-11-22; docs/agents/questions/exams.md:Q-016, Q-020, Q-023
- **Source:** user · confidence high

## D-043 · Exam blueprint drawing from pools
- **Status:** superseded-by D-057
- **Date:** 2026-11-22
- **Rule:** An Exam is a blueprint of ordered Items. Each Item fixes section, competence (the Examiner's own, D-039), difficulty and points, and draws from one of the Examiner's pools (D-041). When an Attempt starts, the server picks for each Item one random Ready question from that pool whose competence and difficulty match the Item's. No question appears twice in the same Attempt, also when several Items draw from the same pool. An Exam can be published only if every Item can get its own distinct eligible question. Questions are fixed by default; a question may also draw values per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`), which the Examiner previews before publishing. The picked question, any drawn values and the expected answer are stored per Attempt (D-006, D-013), so the Examiner sees which question each Candidate got. Item Analysis reports per question and per Item. "8 easy questions from pool A" = 8 Items on pool A.
- **Why:** Every Attempt covers all competences with the same difficulty curve (INTERVIEW.md Q2, Q12), similar questions go to different Candidates (Q13), and it delivers the catalog's "8 întrebări din pool-ul A (ușor), 4 din B (greu)".
- **Rejected:** Hand-listed Variants per Item (D-025); a blueprint row drawing N questions from a pool (weakens per-Item coverage); repeats within one Attempt.
- **Evidence:** Conversation 2026-11-22 (P1b plan gate); docs/agents/questions/exams.md:Q-036, Q-037; catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-057 · Exam blueprint drawing from pools by competence, difficulty, type and topic
- **Status:** approved
- **Date:** 2026-11-24
- **Confirmed:** 2026-11-27
- **Rule:** An Exam is a blueprint of ordered Items. Each Item fixes section, points, competence (the Examiner's own, D-058), difficulty and one of the Examiner's pools (D-041), plus a question type and a topic, each of which may be "any". When an Attempt starts, the server picks for each Item one random Ready question from that pool whose competence and difficulty match the Item's, whose type and topic match unless the Item says "any", and whose grade level matches the Exam's. No question appears twice in the same Attempt, also when several Items draw from the same pool. An Exam can be published only if every Item can get its own distinct eligible question. Questions are fixed by default. A parameterised question names its values in braces in the statement ({p}); each named value is fixed (one value), random (a whole number between min and max, with optional excluded values, under simple conditions such as `a > b`) or calculated from the others (D-013). The Examiner previews sample values before saving. The picked question, its values and the expected answer are stored per Attempt (D-006), so the Examiner sees which question each Candidate got. Item Analysis reports per question and per Item. "8 easy questions from pool A" = 8 Items on pool A.
- **Why:** The user's description of the exam template (2026-11-24): Items draw by difficulty, type, topic and competence; values are marked as fixed, random or calculated. Keeps D-043's coverage: every Attempt has the same competences and difficulty curve, and similar questions go to different Candidates.
- **Rejected:** Drawing from the whole bank without a pool (Q-045); decimal values, steps or value lists (Q-048); fixed numbers as unnamed text (Q-047); hand-listed Variants per Item (D-025); repeats within one Attempt.
- **Evidence:** docs/agents/questions/exams.md:Q-045, Q-046, Q-047, Q-048; supersedes D-043
- **Source:** user · confidence high

## D-062 · Fixed Subject II structure: 3 problems of 20 points
- **Status:** approved
- **Date:** 2026-11-26
- **Confirmed:** 2026-11-26
- **Rule:** An Exam's Subject II has exactly 3 Items (problems) of 20 points each. A Subject II question can be Ready only when it is worth 20 points, so its barem adds up to 20 (D-031). Subject I is unchanged (D-057: any Item points, Subject total 30). D-057 and D-059 stay approved; this adds to them.
- **Why:** Grading needs the barem and the Item on the same scale (Q-075); the user chose a fixed structure, matching the 6th-grade exam model (D-005) and the DS-009 mock (items 7–9 at 20 points).
- **Rejected:** Matching a Subject II Item only to questions of equal points with any Item value (agent proposal); scaling a question's score to the Item's points; grading on the Item's points with the barem scaled.
- **Evidence:** docs/agents/questions/grading-and-results.md:Q-075; docs/plans/p8a-grading-and-publishing.md
- **Source:** user · confidence high
