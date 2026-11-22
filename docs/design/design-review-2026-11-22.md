# Design review — 2026-11-22

Scope: the design system in `DESIGN.md` (tokens, guardrails) and the six mocks DS-003,
DS-004, DS-007, DS-008, DS-009, DS-013.

**Method**
- Contrast computed for every key token pair, both themes (WCAG formula).
- 84 desktop screenshots (1440 px): every mock state, light and dark, taken with headless
  Edge.
- 18 mobile screenshots at a true 375 px width (mock loaded in a 375 px frame; headless Edge
  forces at least 504 px otherwise).

The screenshots stay in the session's temp folder. They are not the DoD screenshots, which
come from Playwright once screens are built (D-008).

## Strengths
1. **A coherent, calm token system.** Muted teal on slate neutrals, a midnight dark theme
   with its own values (not inverted), one UI typeface and one mono typeface. It matches
   D-007's low-stress intent.
2. **Strong text contrast.** Primary and secondary text pass 4.5:1 everywhere (secondary
   text is 6.5–7.6:1). Status colors on their tinted backgrounds pass in both themes
   (4.8–9.0:1). The focus ring passes 3:1 against every surface.
3. **Mono for maths and the timer.** JetBrains Mono with tabular numbers keeps values and
   the countdown stable and readable.
4. **States are designed, not left for later.** Every new mock covers empty, loading and
   error, plus domain states (offline, under 5 minutes, barem changed, draft blocking
   Ready).
5. **The domain shapes the layout.** Subiectul I / II structure, a barem beside the answer,
   points per Item, a coverage check per competence. The screens read like the teacher's
   paper workflow.
6. **Accessibility basics are in place.** 44 px targets, visible focus, labels on icon
   buttons, `prefers-reduced-motion` respected, and color paired with text on status badges.
7. **New screens hold up on a phone.** DS-004, DS-007, DS-008, DS-009 and DS-013 fit 375 px
   with no horizontal scroll.

## Weaknesses

### High
| # | Problem | Evidence | Fix |
|---|---|---|---|
| H1 | **Input, checkbox and radio borders fail the 3:1 rule** in DESIGN.md's own guardrails | `border-strong` vs surface: 1.48:1 light, 1.70:1 dark | Token change (proposal): an input-border value of about `#7C8AA0` light / `#5672A0` dark (3.2–3.8:1), keeping `border-strong` for decoration |
| H2 | **DS-003 overflows on a phone** | At 375 px: "Reia examenul" cut off, the name and the class badge overlap in the header, and the results table is cut (status column off-screen) | Move DS-003 to the shared styles; stack the banner; turn table rows into cards below 640 px |
| H3 | **No navigation on mobile** | `.nav` is hidden under 640 px and nothing replaces it, on every Examiner screen | Add a menu button with a drawer (a new shared component) |
| H4 | **The exam room on a phone puts the question about 850 px down** | The sticky header takes about 190 px (4 rows) and the full navigator sits above the question | Compact header (timer + save + menu); navigator as a bottom sheet or drawer, as README already says ("question navigator drawer") |
| H5 | **Answered and unanswered Items differ only by a faint tint** | Navigator squares: light teal fill vs white, with no icon. This breaks "color never carries meaning alone". | A check mark on answered Items and a solid fill; keep the flag icon |

### Medium
| # | Problem | Evidence | Fix |
|---|---|---|---|
| M1 | **Focus and selection look the same** | `border-focus` = selected-option border = accent | Selection: tinted fill and a 1 px accent border; focus: a 2 px ring with offset (already there), never used for selection |
| M2 | **The dark primary is very loud as a large fill** | `#2DD4BF` buttons: three "Acceptă" buttons stacked (DS-013), and a full-width button per card (DS-003) | Use primary for the one main action per view; repeated actions use secondary |
| M3 | **The grading photos are the smallest element** | About 200 px wide in a 3-column layout (DS-009); handwriting is the evidence being graded | Two columns: answer and photos large, barem beside them; the queue as a collapsible list |
| M4 | **A partially awarded step looks "not awarded"** | Step 5 at 4/6 shows an empty checkbox (DS-009) | Three-state control (none / partial / full) with a distinct partial icon |
| M5 | **Missing tokens force workarounds** | No on-primary text, primary hover, overlay, disabled or info tokens; mocks use `opacity` and `rgba(0,0,0,0.4)` | Add these tokens (proposal) |
| M6 | **No icon set** | Unicode glyphs (↻ ⤢ ⋯ ✕ ↑ ↓ ✓) next to inline SVG; rendering differs per OS | Pick one SVG icon set and record it in DESIGN.md |
| M7 | **No theme or language control in the app** | The theme switch exists only in the mock bar; D-022 needs a RO/EN switch; neither is in any header | Add both to the user menu |
| M8 | **DS-003 diverges from the rest** | Own inline CSS; "Subiectul 1" instead of "Subiectul I"; grade as "8.50" instead of "8,50"; English "Status" header | Rebuild DS-003 on the shared styles and the CONTEXT.md terms |
| M9 | **Light `text-muted` on `bg-surface-subtle` is 4.34:1** | Below 4.5:1 | Avoid that pair, or darken light `text-muted` slightly (proposal) |

### Low (mock bugs, no decision needed)
- DS-008: the error text says "Itemul 9" while item 8 is the highlighted one; the missing
  competence C4 is red although it is only a warning; field heights are uneven in Settings.
- DS-007: question codes wrap onto three lines; long barem steps are cut off.
- DS-013: the roster row buttons wrap onto two lines.
- DS-004: the Subiectul I navigator wraps item 6 onto its own row (5 columns for 6 Items).
- DS-007 and DS-009 use a 1279 px breakpoint that isn't in DESIGN.md's breakpoint table.

## Decisions taken (2026-11-22)
- **H1:** new token `border-input` (`#7C8AA0` / `#5672A0`) for controls; `border-strong` stays for decorative borders.
- **M5:** new tokens `text-on-primary`, `bg-primary-hover`, `overlay`, `status-info` and `status-info-bg`. Disabled stays at 50% opacity, now a DESIGN.md rule.
- **M9:** light `text-muted` changed to `#5B6B80`.
- **M6:** Lucide as the only icon set (D-033).

All are applied in DESIGN.md, tokens.json and `mocks/shared/mock.css`. The remaining
items (H2–H5, M1–M4, M7, M8, Low) are mock changes.

## Fixes applied (2026-11-22, waiting for review)
- **H2 / M8 · DS-003** rebuilt on the shared styles. The banner stacks on phones and the
  results table becomes cards below 640 px. CONTEXT.md terms (Subiectul I / II), "8,50",
  Romanian headers. Added the "Am un cod de clasă" action (D-028).
- **H3 / M7:** every app header has RO/EN and theme controls on desktop and a menu button
  with a drawer on phones (navigation, language, theme, sign-out).
- **H4 · DS-004:** compact phone header with an "Itemi 7/9" button. The navigator becomes a
  bottom sheet below 1024 px (new state "Navigator deschis (mobil)").
- **H5 · DS-004:** answered Items carry a check mark. The current Item is underlined
  instead of using the focus ring (also M1). Subiectul I fits one row of 6.
- **M2:** one primary action per view (DS-003 cards, DS-009 pager, DS-013 requests now
  use secondary buttons).
- **M3 · DS-009:** the queue column became a previous / next bar with a collapsible list
  (new state "Listă deschisă"). The photos are about 340 px wide.
- **M4 · DS-009:** barem steps use a Nu / Parțial / Da control.
- **M6:** Unicode glyphs replaced by Lucide icons, rendered by `shared/mock.js`.
- **Low:** DS-008 "Itemul 8", C4 as a warning, even field heights. DS-007 codes on one
  line, two-line barem steps, Type column dropped from the list. DS-013 roster buttons on
  one line. Breakpoints back to the DESIGN.md table.
- **Mock tooling:** mocks accept `?theme=dark&state=<id>&menu=1` for review links.

## Follow-up changes requested by the user (2026-11-22)
- Platform name in the mocks: "Evaluare Digitală" (was "Platforma evaluare"). The lone
  "Tablou de bord" link in the candidate header was removed; the page title stays.
- "Am un cod de clasă" is a primary button (same as "Reia examenul"), by user choice; this
  overrides suggestion M2 for DS-003.
- Every table's action column is titled "Acțiuni" (DS-003, DS-007 library, DS-013 roster).
- **Light palette "Warm and soft" (option C)** replaces the cool slate neutrals: canvas
  `#F5F1EA`, surface `#FFFCF7`, subtle `#ECE5DA`, primary-subtle `#E2F0EB`, text
  `#231E18` / `#5A5248` / `#6E665B`, borders `#E3DACB` / `#D5CAB8`, input border
  `#8C8273`. Radius md 10px, lg 16px; shadow-subtle is warm-tinted. Every text and
  input-border pair passes (text-muted on subtle 4.52:1 is the lowest). Dark mode
  unchanged.
- **Dark palette "Espresso"** replaces midnight navy: canvas `#1A1612`, surface
  `#241F1A`, subtle `#2E2822`, primary-subtle `#1C3530`, text `#F6F0E6` / `#C2B8AA` /
  `#A0968A`, borders `#3A322A` / `#4A4137`, input border `#857A6C`, text-on-primary
  `#1A1612`. All pairs pass, status colors included. This supersedes D-007 with **D-034**
  (warm, calm visual system), approved by the user's choice.
- **Dropdowns restyled:** native selects keep their accessible popup but get the Lucide
  chevron in theme colors, input height and borders, hover and disabled states, and
  `color-scheme: dark` in dark mode (candidate PATTERN-002).
- **Alert icons aligned:** the icon centres on the first text line (2 px offset for a
  20 px icon on a 24 px line); alerts with an action button centre icon, text and button
  on one axis; icons take their alert's status color. Neutral notices (timer hidden,
  preview) use the `status-info` style instead of grey.
- **"Gata" renamed to "Finalizat"** for the Ready question status everywhere (badges,
  counts, filters, the "Marchează ca finalizat" action, builder checks), with agreeing
  forms ("variante finalizate", "întrebările finalizate"). CONTEXT.md now lists Draft
  (Ciornă) and Ready (Finalizat), with "gata" to avoid.
- **Accent changed from teal to "fresh mint"** (D-035 supersedes D-034): light `#1F7A4F`
  (hover `#17603D`, tint `#E3F2E8`), dark `#7EE2A8` (hover `#AFF0C9`, tint `#1C3A28`).
  White text on mint 5.31:1, mint on cream 4.72:1, dark text on mint 11.4:1. Known trade-off:
  the light accent is close to the success green, so status meaning relies on the icon and
  text already paired with every badge.
