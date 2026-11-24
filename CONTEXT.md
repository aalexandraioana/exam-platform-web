# CONTEXT — exam-platform-web vocabulary

<!-- graffino-agentic:begin v1 -->
> The approved terms for this project. Use each term exactly as defined, in the part
> of speech given. Never swap in a synonym; never use a word on an _Avoid_ line.
<!-- graffino-agentic:end -->

**Exam** (noun) · RO: **Examen** — A structured assessment built from a blueprint of Items drawing from pools (D-057), taken by Candidates of the classes it is published to.
_Avoid_: test (when referring to an exam), quiz (unless formally designated as a quiz); RO: test, testare, lucrare.

**Candidate** (noun) · RO: **Candidat** — A user registered to take Exams, belonging to one or more classes.
_Avoid_: testee, examinee, taker.

**Examiner** (noun) · RO: **Examinator** — A user, created by an Administrator, who builds the question pool and Exams, grades Subject 2, and publishes results.
_Avoid_: teacher (unless role-specific), admin (unless platform administrator); RO: profesor, cadru didactic.

**Attempt** (noun) · RO: **Încercare** — A single instance of a candidate taking an exam.
_Avoid_: session, run.

**Submission** (noun) · RO: **Predare** — The completed set of candidate answers submitted for evaluation.
_Avoid_: turn-in, finished test; RO: lucrare.

**Subject 1** (noun) · RO: **Subiectul I** — The first section of an exam consisting of auto-gradable foundational items evaluating definitions and direct applications without partial credit.
_Avoid_: part 1.

**Subject 2** (noun) · RO: **Subiectul II** — The second section of an exam consisting of multi-step problem-solving questions evaluated manually with partial credit.
_Avoid_: part 2.

**Baseline Points** (noun) · RO: **Punct din oficiu** — Unconditional baseline points (10 points / *punct din oficiu*) added to the exam score to yield a 1 to 10 final grade scale.
_Avoid_: bonus, curve, free points.

**Variant** (noun) · RO: **Variantă** — A question that can be drawn for an Item: a Ready question in the Item's pool with the Item's competence and difficulty, its type and topic unless the Item says "any", and the Exam's grade level; each Attempt gets one per Item, at random, never the same question twice in one Attempt (D-057).
_Avoid_: row, seat version.

**Item Analysis** (noun) · RO: **Analiza itemilor** — Post-examination statistical evaluation measuring item difficulty and discrimination index across attempts.
_Avoid_: question stats.

**Grace Period** (noun) · RO: **Perioadă de toleranță** — The 30-second server buffer accepting in-flight submissions delayed by network latency after timer expiration.
_Avoid_: overtime, extension.

**Administrator** (noun) · RO: **Administrator** — A platform user who creates Examiner accounts, deactivates Candidates and Examiners, and sets temporary passwords (D-054, D-055, D-056).

**Class** (noun) · RO: **Clasă** — A group of Candidates to which Exams are published; its Candidates form the cohort for feedback (D-015, D-019).

**Item** (noun) · RO: **Item** — One slot of an Exam's blueprint, fixing section, points, competence, difficulty, a type and a topic (each may be "any"), drawing from one pool and filled by one Variant per Attempt (D-057).
_Avoid_: slot (in UI copy).

**Competence** (noun) · RO: **Competență** — Something an Examiner wants to assess, written by that Examiner as a short code and a description (e.g. "C1 · knows that the angles of a triangle add up to 180°"); each question and Item is tagged with one (D-058).
_Avoid_: skill, objective; topic (a topic is the question's chapter, not what is assessed).

**Draft** (noun, question status) · RO: **Ciornă** — A saved question that is not yet complete; it needs only its Subject and type, and can't be drawn for any Attempt (D-059).

**Ready** (noun, question status) · RO: **Finalizat** — A question whose required fields are complete (statement, points, competence, topic, grade level, difficulty, and its answer key or barem; for a parameterised question, every named value defined); only Ready questions can be drawn for an Attempt or published to the library (D-059).
_Avoid_: RO: gata.

**Bank** (noun) · RO: **Bancă de întrebări** — All of an Examiner's questions, private to them; the storage place (D-041).
_Avoid_: pool (when meaning the whole bank), database.

**Pool** (noun) · RO: **Set de întrebări** — A named group of questions inside an Examiner's bank, e.g. "Unghiuri – ușor"; a question can be in several pools, and Exam Items draw from pools (D-041, D-057).
_Avoid_: folder, bank (for a group).

**Topic label** (noun) · RO: **Etichetă** — A topic from the Examiner's own list, e.g. "Unghiuri"; each question has exactly one, and an Item can match on it (D-058, D-057).

**Named value** (noun) · RO: **Valoare** — A value written in braces in a parameterised question's statement, e.g. {p}: **fixed** (RO: fixă, one value), **random** (RO: aleatoare, a whole number between min and max, with optional excluded values) or **calculated** (RO: calculată, from the other values). Random and calculated values are stored per Attempt (D-057, D-006).
_Avoid_: tag (several per question), competence.

