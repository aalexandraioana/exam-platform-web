# Patterns — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Plan-then-build execution · approved

---

## PATTERN-001 · Plan-then-build execution
- **Status:** approved
- **Use when:** Implementing features, refactorings, or modifications spanning multiple files or logic boundaries.
- **How:** Run `/plan` to define size, approach, tests, and files; confirm knowledge; execute via `/build`.
- **Example:** AGENTS.md:23
- **Why:** Prevents implementation drift, unapproved dependencies, and untested code.
- **Source:** user · confidence high
