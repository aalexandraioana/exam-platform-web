# Open questions · Item Analysis

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-031 · Which thresholds flag an item as weak, and how are partial-credit items measured?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P10 (Item Analysis)
- **Context:** The catalog requires weak items to be flagged and the DoD requires at least one weak item found in the pilot. Open: difficulty and discrimination thresholds, and how Subject 2 items with partial credit enter difficulty and point-biserial discrimination.
- **Answer:** Standard thresholds: weak if difficulty p < 0.20 or > 0.90, or discrimination < 0.20; negative discrimination flagged as a likely faulty question; a distractor chosen by fewer than 5% flagged unused; fewer than 2 Attempts or no variation shows "not enough data" (D-047). (Answered 2026-11-22.)

## Q-093 · Which Attempts go into Item Analysis when an Exam allows several?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P10 (Item Analysis)
- **Context:** Several Attempts by one Candidate would weigh them more than once and their answers are correlated.
- **Answer:** One per Candidate: the Attempt that counts under the Exam's score policy (D-012), the same one the grading screen's mean and median use. (User, 2026-11-27.)

## Q-094 · When can the Examiner see Item Analysis, and from which Attempts?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P10 (Item Analysis)
- **Context:** Discrimination needs the whole score, Subject II included; a faulty question can still be corrected before publication (D-046).
- **Answer:** Only graded Attempts, visible to the Examiner any time, also before results are published; the screen shows how many of the submitted Attempts are graded. (User, 2026-11-27.)

## Q-095 · What does an item show when every Candidate scored the same on it?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P10 (Item Analysis)
- **Context:** D-047 shows "not enough data" when there is no variation; the catalog asks that the everyone-correct case is handled.
- **Answer:** Difficulty is shown and flagged as usual (everyone correct: p = 1.00, too easy); discrimination shows "not enough data", since it cannot be computed without variation. With fewer than 2 Attempts both show "not enough data". (User, 2026-11-27.)

## Q-096 · What does a competence group show in Item Analysis?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P10 (Item Analysis)
- **Context:** D-047 and D-058 group Item Analysis by the Examiner's competences without saying what a group shows.
- **Answer:** The competence's code and description, its difficulty over all its Items (points earned / maximum) and how many of its Items are flagged weak; no discrimination at competence level. (User, 2026-11-27.)

## Q-097 · Which Attempt counts when a Candidate's best totals are tied?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P10 (Item Analysis)
- **Context:** Under the highest-score policy two Attempts with the same total have different answers, and the database returns them in no fixed order, so Item Analysis could change between reads.
- **Answer:** The later Attempt (the highest attempt number). (User, 2026-11-27.)
