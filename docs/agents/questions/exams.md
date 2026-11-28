# Open questions · Exams

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-006 · How are an Exam's questions chosen for each Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Random draw per Attempt: the Examiner sets rules (e.g. topic, difficulty, count) and each Attempt draws its own questions from the question pool. The rule format is open (Q-020).

## Q-016 · How is an examiner-written Variant (A/B) assigned to an Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** At random: when an Attempt starts, the server picks one Variant per Item at random, independently per Item (D-025). Supersedes the earlier letter-by-alternation answer, which misread the intent.

## Q-020 · What rules define the random draw of questions for an Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** A blueprint of ordered Items, each fixing section, competence, difficulty and points, with one or more equivalent questions per Item; one question per Item per Attempt, picked at random (D-025).

## Q-024 · What happens when an Item has fewer Variants than the letter an Attempt got?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Not applicable: D-025 removed letters; each Item picks its Variant at random, so no letter can be missing.

## Q-029 · Are Items and answer options shown in random order per Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P5 (exam builder), P6 (attempt start)
- **Context:** The catalog asks for random order of questions and of options ("ordine aleatoare a întrebărilor și a variantelor"). D-025 defines an ordered list of Items and says nothing about shuffling options in choice questions. INTERVIEW.md (parameter order matters in many exercises) is a reason not to assume.
- **Answer:** Only the answer options of dual, single and multiple choice questions are shuffled per Attempt, and the order is stored with the Attempt; Items keep the blueprint order (D-045). (Answered 2026-11-22.)

## Q-036 · Must a question drawn for an Item match the Item?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Yes. An Item draws only from the pool's Ready questions whose competence and difficulty match the Item's (D-043).

## Q-037 · Can the same question appear twice in one Attempt?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** No, also when several Items draw from the same pool. An Exam can be published only if every Item can get its own distinct eligible question (D-043).

## Q-045 · Does an Item still draw from a pool once it also matches type and topic?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5 (exam builder, DS-008), P6 (draw)
- **Context:** The user said Items draw questions "from the pool based on selected difficulty, type, topic and competence". D-043 has each Item pick one of the Examiner's pools and match competence and difficulty inside it. Options: keep the pool and add type and topic to the match, or drop the pool from Items and draw from the whole bank (pools then only organise the bank, D-041).
- **Answer:** The Item keeps its pool and matches inside it. (Answered 2026-11-24.)

## Q-059 · Where does an Examiner see their exams?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** DS-008 is the builder of one exam ("← Examene"); no mock shows the list, and DS-006 (dashboard) is a draft for P11.
- **Answer:** A simple Examene list drawn as an extra DS-008 state: title, status, classes, availability window, "+ Examen nou". (Answered 2026-11-24.)

## Q-060 · What can change after an Exam is published?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** The roadmap locks the Items and classes once published.
- **Answer:** Only the title, the description and the end of the window (available_until). Duration, attempts and score policy are locked too. (Answered 2026-11-24.)

## Q-061 · Can an Exam be unpublished or deleted?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** Results and Attempts point to a published Exam.
- **Answer:** A draft can be deleted after a confirmation; a published Exam can't be unpublished or deleted. (Answered 2026-11-24.)

## Q-062 · What is the "departajare" label on DS-008's Item 9?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** Nothing in the ledger defines it.
- **Answer:** Dropped; difficulty already shows "Dificil". (Answered 2026-11-24.)

## Q-063 · Which competences should an Exam cover (DS-008 coverage warning)?
- **Status:** answered
- **Date:** 2026-11-24
- **Blocks:** P5
- **Context:** DS-008 warns about a competence with no Item.
- **Answer:** Every competence of the Examiner that has at least one Ready question for the Exam's grade level; a missing one is a warning, not a block. (Answered 2026-11-24.)

## Q-098 · What does the Administrator's exam supervision (DS-012) show, and can the Administrator act on exams?
- **Status:** answered
- **Date:** 2026-11-28
- **Blocks:** P11 (DS-012)
- **Context:** The README promises "a platform-wide directory of all active and archived exams" and "lifecycle management"; there is no archive feature, and D-054–D-056 give the Administrator no power over exams.
- **Answer:** A read-only list of every exam, drafts included, with a state filter: All / Active (upcoming and open) / Archived (closed: the window has ended) / Drafts. No actions on exams. (User, 2026-11-28.)
