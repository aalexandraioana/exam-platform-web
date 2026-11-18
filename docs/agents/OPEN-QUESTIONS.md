# Open questions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
- Q-001 · What web framework and technology stack should be used? · _answered_
- Q-002 · What testing framework and test runner should be configured? · _answered_
- Q-003 · What screenshot mechanism should be used for visual regression testing? · _answered_
- Q-004 · How should question parameterization and mathematical constraints be modeled?
- Q-005 · How should cohort-wide general feedback and individual candidate feedback be published? · _answered_

---

## Q-001 · What web framework and technology stack should be used?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** Laravel 11 for the backend REST API, React + Vite for the frontend SPA, and PostgreSQL for the relational database.

## Q-002 · What testing framework and test runner should be configured?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** Pest PHP for backend tests, Vitest for frontend unit/integration tests, and Playwright for E2E user flows.

## Q-003 · What screenshot mechanism should be used for visual regression testing?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** Playwright screenshot automation (`npx playwright test`) executing automated visual regression checks against `docs/design/screens/`.

## Q-004 · How should question parameterization and mathematical constraints be modeled?
- **Status:** open
- **Blocks:** Parameterized question evaluation and question builder data model
- **Who answers:** Client (Mathematics Teacher) & Repository Owner
- **Proposed answer:** Hybrid parameterization model supporting both curated variant tuples (row A / row B) and algorithmic range generation with constraint rules and examiner pre-preview.

## Q-005 · How should cohort-wide general feedback and individual candidate feedback be published?
- **Status:** answered
- **Date:** 2026-11-18
- **Answer:** The Examiner publishes a single global cohort feedback note all at once after full grading is complete. Individual candidates also receive private per-problem partial points and comments on their Subject 2 submissions, visible only after the Examiner explicitly publishes results.
