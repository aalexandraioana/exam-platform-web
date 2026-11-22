# Research — exam and quiz platforms (2026-11-22)

Input for the next mocks: DS-004 exam room, DS-007 question bank, DS-008 exam builder,
DS-009 grading queue, and the Examiner classes screen (no DS- ID yet).

**Status:** suggestions only. Nothing here is in scope until the user accepts it. An item
that changes a token or an approved decision becomes a PROPOSAL (AGENTS.md → The gate).

## Reference class
| Platform | Why it is relevant | Used for |
|---|---|---|
| Moodle Quiz | Question bank, random question per slot, calculated questions, manual grading, timers | DS-004, DS-007, DS-008, DS-009 |
| Gradescope | Grading handwritten work by question, rubrics, anonymous grading | DS-009 |
| Google Forms (quiz mode) | Answer keys, "release grades later" | DS-009, DS-003 |
| Classtime | Classroom assessment, class IDs | Classes screen |
| D2L, Blackboard Ultra, timer research | Exam-room timer and navigator patterns | DS-004 |
| Evaluare Națională papers | Layout candidates already know (Subiectul I / II, barem) | DS-004, DS-009 |

**Left out:** Slido, Mentimeter and Kahoot. They are live, anonymous audience-polling or
gamified tools. Their main patterns (leaderboards, presenter screen, word clouds, speed
points) don't fit timed individual Exams, and gamification goes against D-007.

## Findings and suggestions by screen

### DS-004 · Exam room
- **Finding:** Timer anxiety is real and depends on the design: about a third of students
  report anxiety in online exams, and a red countdown is a common trigger. D2L and Langara
  let students hide the timer.
  - **S-1:** Neutral timer (`font-timer`, text colors). Switch to `status-warning`, with
    text, only below 5 minutes (as DESIGN.md already says). A "hide timer" toggle that still
    shows the 5-minute and 1-minute warnings. *No new tokens.*
- **Finding:** A navigator panel with question status and filters (answered, unanswered,
  flagged) is common (Blackboard Ultra, exam-UX guidance).
  - **S-2:** Navigator showing each Item's status, with a "mark for review" flag
    (*marchează pentru revizuire*). **Accepted 2026-11-22.**
- **Finding:** Moodle auto-submits when time runs out and only answers already saved to the
  server count. No study tests autosave-indicator wording (evidence gap).
  - **S-3:** A save indicator with three states: "Saved · 5 s ago", "Saving…", and
    "Offline — answers are kept on this device and sent when you reconnect". This follows
    D-004 and ARCHITECTURE's local retry queue.
  - **S-4:** Before Submission, a summary: "2 Items unanswered, 1 marked for review".
- **Finding:** Candidates know the Evaluare Națională layout (Subiectul I: short objective
  items, including true/false; Subiectul II: worked problems).
  - **S-5:** Mirror that structure: a Subiectul I / II divider, item numbers like the
    paper, and points shown next to each Item.
- **For D-026 (photos):** an upload tray per problem showing 3 slots with thumbnails,
  upload progress and retry. On phones, open the camera directly. Show HEIC conversion as
  "processing", not as an error.

### DS-009 · Grading queue
- **Finding:** Gradescope's default is grading **by question**, not by student, for
  consistency. Moodle's manual grading report also lists work per question.
  - **S-6:** The default view grades one Subject 2 Item across all Candidates, with a
    switch to "by Candidate". Each answer shows which Variant it got and any drawn values
    (D-025).
- **Finding:** Gradescope hides names during grading to reduce bias.
  - **S-7:** An optional "hide names" toggle. **It conflicts with copy detection**
    (INTERVIEW.md Q13 compares neighbours' papers), so it should be off by default.
    **Accepted 2026-11-22 (off by default).**
- **Finding:** Gradescope uses shared rubric items per question; editing one regrades
  everyone already graded. Romanian practice uses a *barem* with points per step.
  - **S-8:** A barem per Subject 2 question: step lines with points, ticked while grading;
    the score is the sum, with a manual adjustment and a comment. *Changes the data model
    (rubric lines per question) and the grading flow.* **Accepted as D-031 (optional per question; editable while grading, locked at publication).**
- **S-9:** A progress bar ("12 / 25 graded"). "Publish results" stays disabled until
  everything is graded (D-019). The photo viewer has zoom and rotate.

### DS-008 · Exam builder
- **Finding:** Moodle fails at attempt or preview time when a random slot's category has
  too few questions.
  - **S-10:** Validate while building: every Item has at least one Variant, Subiectul I
    totals 30 and Subiectul II 60 (D-005). A coverage strip shows which competences
    (C1–C4, D-030) the blueprint covers and flags missing ones.
  - **S-11:** "Preview as Candidate" with a "new draw" button that shows another random
    pick of Variants and drawn values. This covers D-025's preview of drawn values.
- **Finding:** Moodle gives random slots 1 mark by default, which often surprises teachers.
  - Our Items fix their points explicitly (D-025). Show the points per Item in the list.

### DS-007 · Question bank
- **Finding:** Moodle draws only the latest "Ready" version of a question, and editing a
  question doesn't change past attempts.
  - We already snapshot the question per Attempt (D-025), so past Attempts are safe.
  - **S-12 (optional):** Draft / Ready status, so half-written questions can't be picked.
    **Accepted as D-032.**
- **Finding:** Google Forms answer keys are case-sensitive, so "Photosynthesis" vs
  "photosynthesis" goes ungraded. This confirms D-017 (normalized text matching).
  - **S-13:** The answer-key editor lists all accepted answers and has a "test an answer"
    box that shows whether a typed answer would be accepted.
- **S-14:** Tabs "My questions" / "Shared library" (D-027). Filters for competence,
  difficulty, type, section and "used in Exams". The question code is visible (D-029).

### Classes screen (new, no DS- ID)
- **Finding:** Classtime students join a class with a Class ID. Approval steps exist in
  similar tools (Showbie, Desmos Classroom), not in Classtime.
  - **S-15:** Each class card shows its join code with copy and regenerate. A list of
    pending requests with accept / decline (D-028). Roster with a count.

### General
- Google Forms' "release later" emails Candidates. We have no email (D-020), so
  publication appears in the app only, as a status change on DS-003.

## Gaps
- No study tests autosave-indicator wording or placement (S-3 is reasoned, not
  evidence-based).
- The current Moodle 4.x/5.x behaviour of grace periods and autosave was not confirmed;
  sources are older docs.
- The exact Evaluare Națională Subiectul I wording and points per item were not confirmed.

## Sources
- Moodle: [Random question type](https://docs.moodle.org/en/Random_question_type) ·
  [Add random questions (Waikato)](https://www.waikato.ac.nz/students/eresources/moodle/quizzes/add-random-questions) ·
  [Quiz manual grading report](https://docs.moodle.org/en/Quiz_manual_grading_report) ·
  [Quiz time controls on attempts](https://docs.moodle.org:443/dev/Quiz_time_controls_on_attempts) ·
  [Quiz settings (4.0.2)](https://docs.moodle.org/402/en/admin/setting/modsettingquiz) ·
  [Randomised and multivariable questions (Monash)](https://www.monash.edu/learning-teaching/teachhq/moodle/quiz/how-to/set-up-a-quiz-with-randomised-and-multivariable-questions)
- Gradescope: [Carleton](https://www.carleton.edu/its/services/learning/gradescope/) ·
  [Stanford CTL](https://ctl.stanford.edu/academic-tech/software/gradescope) ·
  [Manchester](https://www.elearning.fse.manchester.ac.uk/getting-started-with-canvas/managing-submissions-and-grading-a-gradescope-homework-assignment/) ·
  [UCT guide](https://cilt.uct.ac.za/sites/default/files/media/documents/cilt_uct_ac_za/2486/CILT%20Guide_%20Gradescope.pdf)
- Google Forms: [Create & grade quizzes](https://support.google.com/docs/answer/7032287?hl=en) ·
  [How to grade Google Forms (Jotform)](https://www.jotform.com/blog/how-to-grade-google-forms/)
- Classtime: [How to join a Class](https://help.classtime.com/en/articles/37988-how-to-join-a-class-from-the-student-portal) ·
  [Do students need an account?](https://help.classtime.com/en/articles/37828-do-students-need-to-register-with-an-account) ·
  [Showbie: approving students](https://support.showbie.com/en/articles/4147411-how-students-join-classes-approving-students-to-join)
- Exam-room UX: [LMU Munich 2025 stress study](https://www.mmi.ifi.lmu.de/pubdb/publications/pub/cherif2025stress/cherif2025stress.pdf) ·
  [D2L quiz student view (Marquette)](https://www.marquette.edu/digital-learning/d2l-quiz-student-view.php) ·
  [Langara quiz timing](https://iweb.langara.ca/lts/?p=4051) ·
  [JHSPH redesigned timer](https://ctl.jhsph.edu/blog/posts/redesigned-countdown-timer/) ·
  [Blackboard Ultra test-taking](https://avion611541538128758490.freshdesk.com/support/solutions/articles/154000132672-there-s-more-to-learn-test-taking-experience-in-blackboard-learn-ultra) ·
  [Janison](https://janison.com/resources/post/minimising-students-stress-during-online-exams-with-intuitive-ux-design)
- Evaluare Națională: [Edupedu, simulare 2024](https://www.edupedu.ro/subiecte-matematica-simulare-evaluarea-nationala-clasa-a-viii-a-2024/) ·
  [Model barem 2027 (alba24)](https://alba24.ro/wp-content/uploads/2026/11/Model-Barem-Matematica-ENVIII-2027.pdf)
