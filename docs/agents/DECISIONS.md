# Decisions — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · Agentic plan-then-build workflow

---

## D-001 · Agentic plan-then-build workflow
- **Status:** approved
- **Date:** 2026-11-12
- **Rule:** Any non-trivial modification, architectural change, or feature implementation must start with an approved plan via `/plan` before building via `/build`.
- **Why:** Inferred — ensures changes are validated against requirements, tests are authored first, and architectural drift is minimized.
- **Rejected:** Ad-hoc unapproved code modifications without prior planning.
- **Evidence:** AGENTS.md:23
- **Source:** user · confidence high
