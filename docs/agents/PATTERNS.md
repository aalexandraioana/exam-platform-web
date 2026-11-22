# Patterns — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Plan-then-build execution · approved
- PATTERN-002 · Styled native select · candidate
- PATTERN-003 · Tokens-only Tailwind theme · candidate

---

## PATTERN-001 · Plan-then-build execution
- **Status:** approved
- **Confirmed:** 2026-11-19
- **Use when:** Implementing features, refactorings, or modifications spanning multiple files or logic boundaries.
- **How:** Run `/plan` to define size, approach, tests, and files; confirm knowledge; execute via `/build`.
- **Example:** AGENTS.md:23
- **Why:** Prevents implementation drift, unapproved dependencies, and untested code.
- **Source:** user · confidence high

## PATTERN-002 · Styled native select
- **Status:** candidate
- **Use when:** Any dropdown choice (filters, form fields).
- **How:** Keep the native `<select>` (accessible, phone-friendly popup) but set `appearance: none`; draw the Lucide chevron-down in `text-secondary` as a background icon (a theme-level `--icon-chevron`); same height, padding, radius and `border-input` as text inputs; hover tints the background; disabled at 50% opacity. Set `color-scheme: dark` in the dark theme so the open list and native controls follow it.
- **Example:** docs/design/mocks/shared/mock.css (`.select`, `--icon-chevron`); DS-007 filters, DS-008 settings
- **Why:** Native selects looked out of place in the warm theme and stayed light in dark mode; user feedback 2026-11-22.
- **Source:** user · confidence medium

## PATTERN-003 · Tokens-only Tailwind theme
- **Status:** candidate
- **Use when:** Styling any frontend component.
- **How:** Design tokens live once, as CSS variables in `frontend/src/index.css` (`:root` for light, `[data-theme='dark']` for dark). `frontend/tailwind.config.js` *replaces* (does not extend) the theme keys for colors, spacing, radii, shadows, font sizes and screens with `var(--token)` references, so the default palette and scale are unavailable and a raw value cannot slip in as a utility class. Class names drop the token's group prefix: `bg-surface`, `text-secondary`, `border-input`, `text-h1`, `rounded-lg`, `shadow-subtle`.
- **Example:** frontend/tailwind.config.js; frontend/src/App.tsx
- **Why:** DESIGN.md requires tokens only in component code; dark mode then needs no `dark:` variants because the variables switch.
- **Source:** agent · confidence medium

