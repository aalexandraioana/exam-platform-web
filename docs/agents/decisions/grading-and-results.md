# Decisions · Grading and results

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-005 · Two-part assessment scoring architecture with zero negative marking
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-26
- **Rule:** The scoring engine enforces a two-part assessment model: 10 baseline points (din oficiu) + Subject 1 (30 pts, auto-graded, binary 0 or full points, no partial credit) + Subject 2 (60 pts, manual grading queue for the examiner with partial credit support). Negative marking is strictly disallowed across all question types.
- **Why:** Directly models the 6th-grade mathematics examination structure validated during the client interview.
- **Rejected:** Negative marking for incorrect answers; automated grading for Subject 2 proofs/multi-step reasoning.
- **Evidence:** README.md:26
- **Source:** user · confidence high

## D-010 · Two-step examiner feedback publication after full grading
- **Status:** superseded-by D-019
- **Date:** 2026-11-18
- **Rule:** Feedback is published by the Examiner in two channels after full grading is complete: (1) a single global cohort note published all at once, visible to all candidates who took the exam; (2) private per-problem partial points and comments on each Subject 2 submission, released to each candidate only upon explicit publication by the Examiner.
- **Why:** Confirmed by client interview and repository owner; matches Romanian classroom grading practices where general feedback on common errors is shared with the entire cohort, while detailed per-item proof feedback is individual.
- **Rejected:** Real-time feedback before all submissions are graded; publishing partial grades piece-by-piece.
- **Evidence:** docs/agents/questions/grading-and-results.md:Q-005, INTERVIEW.md:Q16
- **Source:** user · confidence high

## D-019 · Results and feedback released only on publication
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** After full grading the Examiner publishes, in two channels: (1) one cohort note, visible to the whole cohort (D-015); (2) private per-problem partial points and comments on each Subject 2 answer. No score, Subject 1 included, is visible to a Candidate before publication; until then the Candidate sees "submitted, awaiting grading".
- **Why:** Keeps D-010's classroom practice and closes the gap about the instantly auto-graded Subject 1 score.
- **Rejected:** Showing the Subject 1 score at Submission; publishing grades piece by piece.
- **Evidence:** docs/agents/questions/grading-and-results.md:Q-005, Q-009; INTERVIEW.md:Q16
- **Source:** user · confidence high

## D-031 · Optional barem for Subject 2 questions
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** A Subject 2 question may have a barem; the Examiner chooses per question whether to use one. A barem is an ordered list of steps, each with a short description and points, summing to the question's points (each Variant has its own). With a barem, the Examiner ticks the steps a Candidate earned or gives part of a step's points (never more than the step is worth); the score is the sum plus an optional manual adjustment, kept between 0 and the question's points (D-005), with a private comment (D-019). The ticked steps and points are stored per answer. Without a barem, the Examiner enters one score between 0 and the question's points, plus the comment. A barem can be edited while grading: scores already given on that question are recalculated from their ticked steps (partial points capped at a step's new maximum, with the affected answers flagged for re-check). Once results are published, the barem is locked.
- **Why:** Matches Romanian barem grading practice and makes grading consistent across Candidates, while leaving Examiners free to grade holistically when a barem does not fit.
- **Rejected:** Mandatory barem for every Subject 2 question; locking the barem at the first graded answer; recalculating after publication.
- **Evidence:** Conversation 2026-11-22; docs/design/research-quiz-platforms.md S-8
- **Source:** user · confidence high

## D-046 · Subject I answer-key corrections recalculate until publication
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-27
- **Rule:** Correcting a Subject I answer key after Attempts were submitted recalculates that question's scores in every Attempt and logs the change. Once results are published, the answer key is locked. Same rule as barem edits (D-031).
- **Why:** The catalog requires recalculation when the teacher corrects a question after the exam; locking at publication keeps published grades stable.
- **Rejected:** Recalculating after publication; no recalculation.
- **Evidence:** docs/agents/questions/grading-and-results.md:Q-030
- **Source:** user · confidence high
