# Open questions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
### [Accounts and classes](questions/accounts-and-classes.md)
- Q-007 · Does the platform have classes, and what is a cohort? · _answered_
- Q-012 · How are Examiner accounts created? · _answered_
- Q-013 · How is a forgotten password handled? · _answered_
- Q-021 · Who creates classes, and how does a self-registered Candidate join one? · _answered_
- Q-026 · Does the SPA authenticate with a Sanctum cookie session or a bearer token? · _answered_
- Q-038 · Can a class linked to a published Exam be deleted? · _answered_
- Q-040 · What happens when the class code entered at registration matches no class? · _answered_
- Q-041 · What does the roster's "more options" menu on DS-013 contain, and can a declined Candidate ask to join again?
- Q-042 · Who resets a forgotten password, and is the new password temporary? · _answered_
- Q-043 · Can the Administrator reactivate a deactivated user? · _answered_
- Q-044 · Who can be deactivated on DS-011: other Administrators, and the Administrator themselves? · _answered_

### [Attempts](questions/attempts.md)
- Q-014 · What happens when an Attempt starts close to the Exam's end_time (`available_until`)? · _answered_
- Q-018 · What are the limits for Subject 2 photo uploads? · _answered_
- Q-027 · Where are Subject 2 photos stored in production? · _answered_
- Q-028 · How does the scheduled auto-submit job run on Render? · _answered_
- Q-064 · Where do Candidates see an Exam's description? · _answered_
- Q-065 · Is P6 built in one piece? · _answered_
- Q-066 · Which object storage provider holds Subject II photos in production? · _answered_
- Q-067 · Who sets up the external cron that seals expired Attempts? · _answered_
- Q-068 · What separates the "started" and "in_progress" Attempt states? · _answered_
- Q-069 · Which labels does an exam card on the Candidate dashboard show? · _answered_
- Q-070 · Does P7 include Subject II photos and the submitted-exams table? · _answered_
- Q-071 · Is P7 built in one piece? · _answered_
- Q-072 · How many items does the exam room show at once? · _answered_

### [Exams](questions/exams.md)
- Q-006 · How are an Exam's questions chosen for each Attempt? · _answered_
- Q-016 · How is an examiner-written Variant (A/B) assigned to an Attempt? · _answered_
- Q-020 · What rules define the random draw of questions for an Attempt? · _answered_
- Q-024 · What happens when an Item has fewer Variants than the letter an Attempt got? · _answered_
- Q-029 · Are Items and answer options shown in random order per Attempt? · _answered_
- Q-036 · Must a question drawn for an Item match the Item? · _answered_
- Q-037 · Can the same question appear twice in one Attempt? · _answered_
- Q-045 · Does an Item still draw from a pool once it also matches type and topic? · _answered_
- Q-059 · Where does an Examiner see their exams? · _answered_
- Q-060 · What can change after an Exam is published? · _answered_
- Q-061 · Can an Exam be unpublished or deleted? · _answered_
- Q-062 · What is the "departajare" label on DS-008's Item 9? · _answered_
- Q-063 · Which competences should an Exam cover (DS-008 coverage warning)? · _answered_

### [Grading and results](questions/grading-and-results.md)
- Q-005 · How should cohort-wide general feedback and individual candidate feedback be published? · _answered_
- Q-009 · When does a Candidate see their Subject 1 score? · _answered_
- Q-011 · What does the "Feedback cadru didactic" column on the candidate dashboard (DS-003) show? · _answered_
- Q-030 · What happens when the Examiner corrects a Subject 1 answer key after Attempts were graded? · _answered_
- Q-075 · How is a Subject II Item graded when its question's points differ from the Item's? · _answered_
- Q-076 · When may the Examiner publish an exam's results? · _answered_
- Q-077 · Is P8 built in one piece? · _answered_
- Q-078 · Which DS-009 parts may be cut to save time? · _answered_
- Q-079 · Do answers marked for re-check block publishing results? · _answered_
- Q-080 · Can an exam without an end date publish its results? · _answered_
- Q-081 · Is "Disponibil până la" locked once results are published? · _answered_
- Q-082 · What does a Candidate see for each Subject I item after results are published? · _answered_
- Q-083 · What does a Candidate see for each Subject II problem after results are published? · _answered_
- Q-084 · Which Attempts does the results page show when an Exam allowed several? · _answered_
- Q-085 · Does a Candidate see class statistics with their results? · _answered_
- Q-086 · What happens to answers graded with one score when the question switches to a barem? · _answered_
- Q-087 · Where is an answer-key correction logged (D-046)? · _answered_
- Q-088 · What may change in a Subject I question's options once it has been drawn? · _answered_
- Q-089 · Does a formula correction on a drawn question with generated values re-grade? · _answered_
- Q-090 · Does the question editor say how many Attempts were re-graded after a key correction? · _answered_
- Q-091 · Should correcting the formula of a drawn question with generated values recompute each Attempt's expected answer and re-grade? · _investigating_
- Q-092 · Can a drawn question's type or Subject change? · _answered_

### [Item analysis](questions/item-analysis.md)
- Q-031 · Which thresholds flag an item as weak, and how are partial-credit items measured? · _answered_

### [Platform and delivery](questions/platform-and-delivery.md)
- Q-001 · What web framework and technology stack should be used? · _answered_
- Q-002 · What testing framework and test runner should be configured? · _answered_
- Q-003 · What screenshot mechanism should be used for visual regression testing? · _answered_
- Q-025 · What happens to the uncommitted backend/ scaffold, and where does Laravel run locally? · _answered_
- Q-033 · In which format is the API documented? · _answered_
- Q-034 · Which pages, if any, may search engines index? · _answered_
- Q-039 · Does the 30 Nov pilot include Subject 2? · _answered_
- Q-073 · Does the delivered app move from Render to AWS?

### [Question bank](questions/question-bank.md)
- Q-004 · How should question parameterization and mathematical constraints be modeled? · _answered_
- Q-008 · Which numeric answer formats are accepted? · _answered_
- Q-010 · How are short text answers matched? · _answered_
- Q-019 · Is the question bank shared between Examiners or private to its author? · _answered_
- Q-022 · Where is the question pool of at least 60 verified questions kept? · _answered_
- Q-023 · How is a question's specific competence identified? · _answered_
- Q-035 · Which curriculum topics are seeded? · _answered_
- Q-046 · How does an Item match a question's topics? · _answered_
- Q-047 · Are fixed values in a parameterised question marked too? · _answered_
- Q-048 · What can a value domain be? · _answered_
- Q-049 · Must calculated values and the answer of a parameterised question be whole numbers? · _answered_
- Q-050 · Which question types can use named values? · _answered_
- Q-051 · Can the answer of a parameterised question be a fraction? · _answered_
- Q-052 · Which operations can formulas use? · _answered_
- Q-053 · Where does an Examiner create competences, topics and pools? · _answered_
- Q-054 · Who sets the code of a question created in the app? · _answered_
- Q-055 · What replaces DS-007's "Folosită în" column? · _answered_
- Q-056 · Can a question be deleted? · _answered_
- Q-057 · What happens when a Ready question is edited so it is no longer complete? · _answered_
- Q-058 · Can an Examiner take back an entry they published to the library? · _answered_
- Q-074 · How does questions.yaml get into the live bank? · _answered_

### [Ui and language](questions/ui-and-language.md)
- Q-015 · Which language is the UI in? · _answered_
- Q-017 · Which Romanian and English UI words map to each CONTEXT.md term? · _answered_
- Q-032 · How is mathematical notation shown in question text? · _answered_

