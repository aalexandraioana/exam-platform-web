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
- D-007 · Visual design tokens and calm anxiety-reducing UI system · _superseded-by D-034_
- D-034 · Warm, calm visual system (cream light, espresso dark) · _superseded-by D-035_
- D-002 · Laravel 11 REST API backend with React + Vite SPA · _superseded-by D-036_
- D-030 · Small fixed competence list · _superseded-by D-039_
- D-025 · Exam blueprint with a random Variant per Item · _superseded-by D-043_
- D-032 · Draft and Ready question status · _superseded-by D-042_
- D-011 · Subject 2 handwritten solution photo upload alongside text · _superseded-by D-048_
- D-020 · Admin-created Examiner accounts and manual password reset · _superseded-by D-054_

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

## D-007 · Visual design tokens and calm anxiety-reducing UI system
- **Status:** superseded-by D-034
- **Date:** 2026-11-18
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: Muted Teal/Sage primary accent (`#0F766E` / `#2DD4BF`), midnight-tint dark theme (`#0B132B`), Plus Jakarta Sans for UI copy and headings, JetBrains Mono for formulas, equations, and timers, a 4px grid spacing scale, and subtle non-distracting elevation.
- **Why:** Delivers a calm, low-stress assessment environment for 6th-grade candidates, inspired by Coursera, Quizlet, and Notion, while guaranteeing WCAG AAA/AA contrast.
- **Rejected:** Flashy/overwhelming animations and high-saturation gamified colors; harsh pitch-black dark mode; raw uncurated monospace fonts.
- **Evidence:** docs/design/DESIGN.md:103
- **Source:** user · confidence high

## D-034 · Warm, calm visual system (cream light, espresso dark)
- **Status:** superseded-by D-035
- **Date:** 2026-11-22
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: Muted Teal primary accent (`#0F766E` light / `#2DD4BF` dark); warm neutrals in both themes, a cream light theme (canvas `#F5F1EA`, surface `#FFFCF7`) and an espresso dark theme (canvas `#1A1612`, surface `#241F1A`); Plus Jakarta Sans for UI copy and headings; JetBrains Mono for formulas, equations and timers; a 4px grid spacing scale; soft rounded shapes (radius 10/16 px) and subtle, warm-tinted elevation.
- **Why:** Keeps D-007's calm, low-stress intent while removing the clinical feel of cool slate neutrals and the midnight navy, as the user asked; every text and input-border pair still meets WCAG AA.
- **Rejected:** Cool slate light theme and midnight navy dark theme (D-007, felt clinical); warm graphite and soft midnight dark options; flashy or gamified colors; pitch-black dark mode.
- **Evidence:** docs/design/design-review-2026-11-22.md; conversation 2026-11-22
- **Source:** user · confidence high

## D-002 · Laravel 11 REST API backend with React + Vite SPA
- **Status:** superseded-by D-036
- **Date:** 2026-11-18
- **Rule:** The platform is built as a headless Laravel 11 REST API backend paired with a standalone React + Vite SPA frontend.
- **Why:** Delivers clean separation of concerns, native queuing/scheduling for automated submission sealing, and strictly complies with the catalog requirement for a documented REST API.
- **Rejected:** Monolithic Inertia.js without a standalone API; alternative language runtimes.
- **Evidence:** README.md:40
- **Source:** user · confidence high

## D-030 · Small fixed competence list
- **Status:** superseded-by D-039
- **Date:** 2026-11-22
- **Rule:** Competences come from a small fixed list covering only the planned topics and scope (e.g. C1–C4 per chapter), not the full curriculum. Questions and blueprint Items are tagged from this list, and Item Analysis groups by it.
- **Why:** Enough structure for blueprint coverage (D-025) and Item Analysis without loading and maintaining the full curriculum.
- **Rejected:** The full official curriculum list; each Examiner's own list; free text per question.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-023
- **Source:** user · confidence high

## D-025 · Exam blueprint with a random Variant per Item
- **Status:** superseded-by D-043
- **Date:** 2026-11-22
- **Rule:** An Exam is a blueprint: an ordered list of Items, each fixing section, competence (the Examiner's own, D-039), difficulty and points. Each Item holds one or more similar, equivalent questions (its Variants). When an Attempt starts, the server picks one Variant per Item at random, independently per Item; an Item with one question is the same for everyone. There are no letters, rows or manual assignment. Questions are fixed by default; a question may also draw values per Attempt from simple min/max bounds with at most simple conditions (e.g. `a > b`), which the Examiner previews before publishing. The picked questions, any drawn values and the expected answers are stored per Attempt (D-006, D-013), so the Examiner sees which Variant each Candidate got. Item Analysis reports per question and per Item.
- **Why:** Every Attempt covers all competences with the same difficulty curve (INTERVIEW.md Q2, Q12), while similar questions are randomly assigned to different Candidates to make copying harder (INTERVIEW.md Q13).
- **Rejected:** Free random draw by topic (D-016, no coverage guarantee); one letter per Attempt by alternation with Examiner override (D-024); a fixed list for everyone.
- **Evidence:** Conversation 2026-11-22; docs/agents/OPEN-QUESTIONS.md:Q-016, Q-020, Q-023
- **Source:** user · confidence high

## D-032 · Draft and Ready question status
- **Status:** superseded-by D-042
- **Date:** 2026-11-22
- **Rule:** Each question is Draft or Ready. Only Ready questions can be picked for an Attempt; the Exam builder shows Draft Variants as "not ready", and an Exam cannot be published while an Item has no Ready Variant. A question can be marked Ready only when its required fields are complete: statement, points and competence for every question; an answer key for Subject 1; a complete barem for Subject 2 only if the Examiner chose to use one (D-031).
- **Why:** Random picks (D-025) must never hand a Candidate a half-written question.
- **Rejected:** Treating every saved question as usable.
- **Evidence:** Conversation 2026-11-22; docs/design/research-quiz-platforms.md S-12
- **Source:** user · confidence high

## D-011 · Subject 2 handwritten solution photo upload alongside text
- **Status:** superseded-by D-048
- **Date:** 2026-11-18
- **Rule:** Subject 2 solutions allow candidates to submit step-by-step reasoning text alongside uploaded photos/images of their handwritten work (geometric drawings and algebraic proofs), stored securely on server disk and presented in the Examiner's manual grading queue.
- **Why:** 6th-grade geometric proofs and complex calculations require natural handwritten sketches and intermediate steps that are impractical to type solely in text inputs.
- **Rejected:** Plain text-only submissions; mandatory LaTeX code entry for 6th-grade students.
- **Evidence:** README.md:84, docs/agents/ARCHITECTURE.md:24
- **Source:** user · confidence high

## D-020 · Admin-created Examiner accounts and manual password reset
- **Status:** superseded-by D-054
- **Date:** 2026-11-22
- **Rule:** Only an Administrator creates Examiner accounts; there is no Examiner self-registration and no pending-approval state. There is no email password reset: an Administrator, or the Examiner for Candidates in their class, sets a new password.
- **Why:** Keeps account control with the school and avoids a mail service.
- **Rejected:** Examiner self-registration with approval; email reset links.
- **Evidence:** docs/agents/OPEN-QUESTIONS.md:Q-012, Q-013
- **Source:** user · confidence high
