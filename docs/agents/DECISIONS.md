# Decisions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
### [Accounts and classes](decisions/accounts-and-classes.md)
- D-015 · Classes and Exam publication to classes
- D-028 · Examiner-created classes with join code and approval
- D-049 · A class linked to an Exam can't be deleted
- D-050 · The SPA authenticates with a Sanctum bearer token
- D-053 · A class code at registration that matches no class refuses the registration
- D-054 · Only the Administrator sets a new password, and it is temporary
- D-055 · A user's role is fixed when the account is created
- D-056 · Deactivation is permanent and never applies to Administrators

### [Attempts](decisions/attempts.md)
- D-004 · Authoritative server timer with 30-second expiration grace period
- D-021 · Full duration per Attempt regardless of available_until
- D-026 · Subject 2 photo upload limits
- D-044 · Expired Attempts sealed on read and by a pinged scheduled job
- D-045 · Answer options shuffled per Attempt
- D-048 · Subject II photos in object storage in production

### [Exams](decisions/exams.md)
- D-012 · Configurable attempt limits and score aggregation policy
- D-057 · Exam blueprint drawing from pools by competence, difficulty, type and topic
- D-062 · Fixed Subject II structure: 3 problems of 20 points

### [Grading and results](decisions/grading-and-results.md)
- D-005 · Two-part assessment scoring architecture with zero negative marking
- D-019 · Results and feedback released only on publication
- D-031 · Optional barem for Subject 2 questions
- D-046 · Subject I answer-key corrections recalculate until publication

### [Item analysis](decisions/item-analysis.md)
- D-047 · Weak-item thresholds

### [Platform and delivery](decisions/platform-and-delivery.md)
- D-001 · Agentic plan-then-build workflow
- D-003 · PostgreSQL 16 with local Docker Compose orchestration
- D-008 · Pest PHP, Vitest, and Playwright as automated testing stack
- D-009 · Two-folder monorepo layout (backend/ and frontend/)
- D-014 · Production deployment on Render cloud platform
- D-036 · Laravel 13 REST API backend with React 19 + Vite SPA
- D-037 · GitHub Actions CI on every push
- D-051 · The API is documented in a hand-written docs/API.md
- D-052 · No page may be indexed by search engines
- D-063 · Develop locally in Docker; Render only for grouped releases and the pilot, deployed by hand

### [Question bank](decisions/question-bank.md)
- D-006 · Exact-match numeric tolerance with concrete parameter persistence
- D-013 · Sandboxed PHP mathematical expression library for formula evaluation
- D-017 · Answer matching rules for numbers and text
- D-027 · Private question pools with a shared library
- D-029 · Database as question source, BANK.md as validation and pilot log
- D-040 · Library entries are frozen copies
- D-041 · One bank per Examiner, organised in pools
- D-058 · Examiner-defined competences; one topic per question
- D-059 · Draft and Ready question status

### [Ui and language](decisions/ui-and-language.md)
- D-022 · Bilingual Romanian and English UI
- D-033 · Lucide as the only icon set
- D-035 · Warm, calm visual system with a fresh mint accent
- D-038 · Romanian as the default UI language
- D-061 · Maths as plain text; in the exam room only numbers and formulas in JetBrains Mono

