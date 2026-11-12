# Open questions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Unknowns. Work that depends on an open question is out of scope until it is
> answered. Only the user answers; an agent never answers by guessing. An agent may
> write a `Proposed answer` the evidence supports; the question stays
> `investigating` until the user confirms it.
> Answered entries stay, with the answer and date, and usually become a D- or PATTERN-.
<!-- graffino-agentic:end -->

## Index
- Q-001 · What web framework and technology stack should be used?
- Q-002 · What testing framework and test runner should be configured?
- Q-003 · What screenshot mechanism should be used for visual regression testing?

---

## Q-001 · What web framework and technology stack should be used?
- **Status:** open
- **Blocks:** Scaffolding the repository, dependencies, and build/run commands
- **Who answers:** Repository owner
- **Proposed answer:** Modern TypeScript web framework (e.g., Next.js / React, Vue, or Svelte)

## Q-002 · What testing framework and test runner should be configured?
- **Status:** open
- **Blocks:** Test command configuration and automated test execution
- **Who answers:** Repository owner
- **Proposed answer:** Vitest or Jest for unit/integration tests and Playwright for E2E tests

## Q-003 · What screenshot mechanism should be used for visual regression testing?
- **Status:** open
- **Blocks:** Visual app screenshot verification command in AGENTS.md
- **Who answers:** Repository owner
- **Proposed answer:** Playwright screenshot automation (`npx playwright test`)
