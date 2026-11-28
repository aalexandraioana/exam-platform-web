# Open questions · Grading and results

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-005 · How should cohort-wide general feedback and individual candidate feedback be published?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** The Examiner publishes a single global cohort feedback note all at once after full grading is complete. Individual candidates also receive private per-problem partial points and comments on their Subject 2 submissions, visible only after the Examiner explicitly publishes results.

## Q-009 · When does a Candidate see their Subject 1 score?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Not before publication. After Submission the Candidate sees "submitted, awaiting grading"; Subject 1, Subject 2 and the total appear together when the Examiner publishes results (D-010).

## Q-011 · What does the "Feedback cadru didactic" column on the candidate dashboard (DS-003) show?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Nothing: the column is dropped. The dashboard shows score and status only; all feedback lives in the review screen (DS-005).

## Q-030 · What happens when the Examiner corrects a Subject 1 answer key after Attempts were graded?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P8 (grading and publication)
- **Context:** The catalog requires recalculation when the teacher corrects a question after the exam. D-031 covers barem edits for Subject 2 only (recalculated before publication, locked after). Open: are Subject 1 scores recalculated, and is that allowed after results are published?
- **Answer:** Correcting a Subject I answer key recalculates that question's scores in every Attempt, with the change logged, until results are published; after publication the answer key is locked (D-046). (Answered 2026-11-22.)

## Q-075 · How is a Subject II Item graded when its question's points differ from the Item's?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** P5 lets an Item's points be any positive value (only the Subject totals are checked), but a barem adds up to the question's own points (D-031).
- **Answer:** A fixed Subject II structure: 3 problems of 20 points, and Subject II questions are Ready only at 20 points, so the barem and the Item always match (D-062). (Answered 2026-11-26.)

## Q-076 · When may the Examiner publish an exam's results?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** Publishing can't be undone (D-019); the DS-009 mock says publishing waits until all submissions are graded.
- **Answer:** When every submitted Attempt is graded, no Attempt is still running, and the exam's availability window has closed. (Answered 2026-11-26.)

## Q-077 · Is P8 built in one piece?
- **Status:** answered
- **Date:** 2026-11-26
- **Confirmed:** 2026-11-27
- **Blocks:** P8
- **Context:** P8 is large and Subject II grading happens on 1 Dec (Q-039).
- **Answer:** No. P8a: grading and publishing results (now). P8b: the Candidate's results page (DS-005 mock confirmed first), right after. P8c: answer-key correction recalculation (D-046), after the pilot. (Answered 2026-11-26.)

## Q-078 · Which DS-009 parts may be cut to save time?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** The approved DS-009 mock has a "Pe item" and a "Pe candidat" view and an "Editează baremul" action.
- **Answer:** None: both views are built, and the barem is edited inline on the grading screen, as in the mock. (Answered 2026-11-26.)

## Q-079 · Do answers marked for re-check block publishing results?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** Q-076 requires every submitted Attempt to be graded; a barem edit can flag graded answers for re-check (D-031).
- **Answer:** Yes (user, 2026-11-27): an answer marked for re-check blocks publishing results until the Examiner grades it again. Needs a C-007 change (a `recheck` reason in `missing`) and DS-009 copy.

## Q-080 · Can an exam without an end date publish its results?
- **Status:** answered
- **Date:** 2026-11-26
- **Blocks:** P8a
- **Context:** Q-076 requires the availability window to have closed; `available_until` may be empty.
- **Answer:** No (user, 2026-11-27): before publishing, the Examiner must set an end date ("Disponibil până la") first; publishing never sets it for them. Matches the code (`window_open` when `available_until` is empty or in the future); DS-009 needs copy for the no-end-date case.

## Q-081 · Is "Disponibil până la" locked once results are published?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8a
- **Context:** Q-060 keeps `available_until` editable after an exam is published (`ExamController::EDITABLE_WHEN_PUBLISHED`). After results are published, clearing it or moving it into the future reopens the exam while grades (and later answer keys) are visible.
- **Answer:** Yes (user, 2026-11-27): once results are published, `available_until` is locked; title and description stay editable. Before results are published nothing changes (Q-060). Needs a C-005 change.

## Q-082 · What does a Candidate see for each Subject I item after results are published?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** The question as they saw it, their answer, the correct answer, the points, and the question's explanation when it has one (the editor already promises it after publication). (User, 2026-11-27.)

## Q-083 · What does a Candidate see for each Subject II problem after results are published?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** Their written steps and their own photos, the points out of 20, the Examiner's comment, and the barem steps with the points earned on each; one score when the question has no barem. (User, 2026-11-27.)

## Q-084 · Which Attempts does the results page show when an Exam allowed several?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** All of the Candidate's Attempts at the Exam, each with its grade, the one that counts under the score policy (D-012) marked; each can be opened. (User, 2026-11-27.)

## Q-085 · Does a Candidate see class statistics with their results?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8b
- **Context:** The Candidate's results page (DS-005) has no mock yet; D-019 sets the minimum (cohort note, per-problem points and comments).
- **Answer:** No. Only their own grade, points and comments, plus the cohort note (D-019); the mean and median stay on the Examiner's grading screen. (User, 2026-11-27.)

## Q-086 · What happens to answers graded with one score when the question switches to a barem?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8a (review of PR #16)
- **Context:** D-031 recalculates graded answers after a barem edit from their ticked steps; an answer graded with one score has none, so it kept its points unflagged, and a Candidate would see every barem step at 0 next to those points.
- **Answer:** Every answer graded with one score is marked for re-check when its question switches to a barem (exams whose results aren't published), keeping its points until it is graded again; it goes back to the grading queue, and publishing waits until the Examiner gives points on the barem steps (Q-079), so a Candidate never sees zero barem steps. (User, 2026-11-27.)

## Q-087 · Where is an answer-key correction logged (D-046)?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8c
- **Context:** D-046 requires recalculation when a Subject I answer key is corrected after Attempts were submitted, until results are published; the details were open.
- **Answer:** Stored in the database (who corrected which key, when, the key before and after, how many answers were recalculated) and shown in the question editor as the last corrections, one short line each. (User, 2026-11-27.)

## Q-088 · What may change in a Subject I question's options once it has been drawn?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8c
- **Context:** D-046 requires recalculation when a Subject I answer key is corrected after Attempts were submitted, until results are published; the details were open.
- **Answer:** Which option(s) are correct and the accepted answers or value can be corrected, and re-grade. Option texts can be fixed, but Attempts keep what the Candidate saw. Adding, removing or reordering options is refused, because Attempts store options by their original position. (User, 2026-11-27.)

## Q-089 · Does a formula correction on a drawn question with generated values re-grade?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8c
- **Context:** D-046 requires recalculation when a Subject I answer key is corrected after Attempts were submitted, until results are published; the details were open.
- **Answer:** Not in P8c: it re-grades fixed keys only. A formula change on a drawn question is refused with a clear message; re-grading from each Attempt's drawn values stays open (Q-091). (User, 2026-11-27.)

## Q-090 · Does the question editor say how many Attempts were re-graded after a key correction?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8c
- **Context:** D-046 requires recalculation when a Subject I answer key is corrected after Attempts were submitted, until results are published; the details were open.
- **Answer:** Yes: a success notice after the save, e.g. "Răspunsul corect a fost salvat: 14 încercări recalculate". (User, 2026-11-27.)

## Q-091 · Should correcting the formula of a drawn question with generated values recompute each Attempt's expected answer and re-grade?
- **Status:** investigating
- **Date:** 2026-11-27
- **Confirmed:** 2026-11-27
- **Blocks:** P8c
- **Context:** Out of P8c (Q-089); until answered, such a formula change is refused once the question is drawn.

## Q-092 · Can a drawn question's type or Subject change?
- **Status:** answered
- **Date:** 2026-11-27
- **Blocks:** P8c (review of PR #18)
- **Context:** Each Attempt grades by the type it drew (its snapshot); a later key correction in another type's shape (e.g. single → multiple choice with `correct: [1, 3]`) would re-grade every Attempt wrongly, and a Subject II → I change skipped the Attempt locks.
- **Answer:** No. Once an Attempt has drawn the question, its type and Subject are locked like its options and named values (Q-088, Q-089): the save is refused with a clear message, and another type means a new question. (User, 2026-11-27.)
