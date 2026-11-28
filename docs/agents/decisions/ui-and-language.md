# Decisions · UI and language

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-007 · Visual design tokens and calm anxiety-reducing UI system
- **Status:** superseded-by D-034
- **Date:** 2026-11-18
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: Muted Teal/Sage primary accent (`#0F766E` / `#2DD4BF`), midnight-tint dark theme (`#0B132B`), Plus Jakarta Sans for UI copy and headings, JetBrains Mono for formulas, equations, and timers, a 4px grid spacing scale, and subtle non-distracting elevation.
- **Why:** Delivers a calm, low-stress assessment environment for 6th-grade candidates, inspired by Coursera, Quizlet, and Notion, while guaranteeing WCAG AAA/AA contrast.
- **Rejected:** Flashy/overwhelming animations and high-saturation gamified colors; harsh pitch-black dark mode; raw uncurated monospace fonts.
- **Evidence:** docs/design/DESIGN.md:103
- **Source:** user · confidence high

## D-022 · Bilingual Romanian and English UI
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** The UI is available in Romanian and English with a language toggle. CONTEXT.md holds the Romanian and English word for each term (words: Q-017).
- **Why:** Romanian classroom users plus English project documentation and review.
- **Rejected:** Romanian-only or English-only UI.
- **Evidence:** docs/agents/questions/ui-and-language.md:Q-015
- **Source:** user · confidence high

## D-033 · Lucide as the only icon set
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** All UI icons come from Lucide (`lucide-react` in the frontend, imported per icon), 2px stroke, at 16, 20 or 24 px. No Unicode symbols or emoji are used as icons. Icon-only controls keep an accessible name (DESIGN.md).
- **Why:** Mixed hand-copied SVGs and Unicode glyphs render differently per device; Lucide matches the existing outline style (Feather), is free (ISC) and tree-shaken.
- **Rejected:** Heroicons (smaller set), Phosphor (multiple weights invite drift), Tabler Icons (more technical look).
- **Evidence:** docs/design/design-review-2026-11-22.md M6; conversation 2026-11-22
- **Source:** user · confidence high

## D-034 · Warm, calm visual system (cream light, espresso dark)
- **Status:** superseded-by D-035
- **Date:** 2026-11-22
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: Muted Teal primary accent (`#0F766E` light / `#2DD4BF` dark); warm neutrals in both themes, a cream light theme (canvas `#F5F1EA`, surface `#FFFCF7`) and an espresso dark theme (canvas `#1A1612`, surface `#241F1A`); Plus Jakarta Sans for UI copy and headings; JetBrains Mono for formulas, equations and timers; a 4px grid spacing scale; soft rounded shapes (radius 10/16 px) and subtle, warm-tinted elevation.
- **Why:** Keeps D-007's calm, low-stress intent while removing the clinical feel of cool slate neutrals and the midnight navy, as the user asked; every text and input-border pair still meets WCAG AA.
- **Rejected:** Cool slate light theme and midnight navy dark theme (D-007, felt clinical); warm graphite and soft midnight dark options; flashy or gamified colors; pitch-black dark mode.
- **Evidence:** docs/design/design-review-2026-11-22.md; conversation 2026-11-22
- **Source:** user · confidence high

## D-035 · Warm, calm visual system with a fresh mint accent
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** The user interface adheres strictly to the tokens in docs/design/DESIGN.md: a fresh mint primary accent (`#1F7A4F` light / `#7EE2A8` dark, hover `#17603D` / `#AFF0C9`, tint `#E3F2E8` / `#1C3A28`); warm neutrals in both themes, a cream light theme (canvas `#F5F1EA`, surface `#FFFCF7`) and an espresso dark theme (canvas `#1A1612`, surface `#241F1A`); Plus Jakarta Sans for UI copy and headings; JetBrains Mono for formulas, equations and timers; a 4px grid spacing scale; soft rounded shapes (radius 10/16 px) and subtle, warm-tinted elevation.
- **Why:** The user preferred mint green to teal. In light mode the mint is deep enough to carry white text (5.31:1) and links on cream (4.72:1); the bright mint shows in dark mode. Status colors keep their meaning through icons and text, since the accent is close to the success green.
- **Rejected:** Teal accent (D-034); classic and soft sage-mint options; light mint in light mode (fails contrast).
- **Evidence:** docs/design/design-review-2026-11-22.md; conversation 2026-11-22
- **Source:** user · confidence high

## D-038 · Romanian as the default UI language
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-23
- **Rule:** The UI opens in Romanian; English is available through the language toggle (D-022). The backend default locale is `ro` with `en` as fallback.
- **Why:** The users are Romanian classrooms; the backend scaffold already set `APP_LOCALE=ro`, `APP_FALLBACK_LOCALE=en`.
- **Rejected:** English as the default.
- **Evidence:** backend/.env.example:7-8; conversation 2026-11-22 (P0 plan gate, A2)
- **Source:** user · confidence high

## D-060 · Maths as plain text in JetBrains Mono
- **Status:** superseded-by D-061
- **Date:** 2026-11-24
- **Rule:** Question statements, options, answers and barem steps are plain text with Unicode symbols (∢ ° ² ³ · : ≤ ≥ ≠ −), shown in JetBrains Mono (DESIGN.md `font-math`) wherever maths appears. No rendering library (KaTeX, MathJax) and no markup.
- **Why:** The user's answer to Q-032; no new dependency before the 3 Dec deadline, and questions stay easy to type.
- **Rejected:** KaTeX (a new dependency, and `\frac{3}{4}` to type in questions); MathJax.
- **Evidence:** docs/agents/questions/ui-and-language.md:Q-032; docs/design/mocks/DS-007.html
- **Source:** user · confidence high

## D-061 · Maths as plain text; in the exam room only numbers and formulas in JetBrains Mono
- **Status:** approved
- **Date:** 2026-11-25
- **Confirmed:** 2026-11-26
- **Rule:** Question statements, options, answers and barem steps stay plain text with Unicode symbols (∢ ° ² ³ · : ≤ ≥ ≠ −); no rendering library and no markup (as D-060). In the Candidate's exam room (DS-004) only numbers and formulas are shown in JetBrains Mono (DESIGN.md `font-math`), detected automatically: pieces containing a digit or a maths symbol, and single letters or short capital-letter names used as variables or points (not the words "o" and "e"); neighbouring pieces join into one span; words and trailing punctuation stay in the UI font. The Examiner's screens (preview, question editor) keep whole statements in JetBrains Mono for now.
- **Why:** The user found whole statements in the mono font unpleasant to read in the exam room (P7b mock review); the Examiner's screens were left as they are for now.
- **Rejected:** Whole statements in JetBrains Mono in the exam room (D-060 as built); markup for maths in questions; changing the Examiner's screens now.
- **Evidence:** docs/plans/p7b-exam-room-answering.md; conversation 2026-11-25 (P7b mock review)
- **Source:** user · confidence high
