# DESIGN — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> The design guardrails for this app. Every UI change follows them. A change to a
> token or a rule here is a PROPOSAL (AGENTS.md → The gate).

## Where designs live
**Designs change only in this repo.** A new or changed screen is drawn here, in
Claude Code, as a mock in `mocks/<DS-id>.html` (using the tokens below), and
confirmed before it is built. The places:

| Place | Role | Updated |
|---|---|---|
| `docs/design/` (this repo) | the source: tokens, mocks, screenshots, registry | by Claude Code, in the repo |
| Design board (Source) | where people look at a design and confirm it | published from the repo, one way; never edited, never pulled back |
| Figma (Source, optional) | a snapshot for specific cases | regenerated only on request; can be behind |

When they disagree, the repo is right. A change made on the board or in Figma is lost
at the next publish. Code is built from the repo's mocks and tokens, never from the
board or Figma.

## Procedure for any UI change

1. **Find the design.** Resolve the screen's `DS-` ID in `registry.yaml` and open
   its mock (`mocks/`) and screenshots (`screens/`). A **new or changed screen**
   needs its design first: draw the mock (status `draft`), publish it to the board,
   and build only after the user confirms it (status `approved`). Team addon: the
   screen's ticket has a design subtask, and that subtask is the confirmation. Never
   extrapolate a screen.
2. **Reuse first.** Use an existing component from `registry.yaml` (kind
   `component`). A new component needs a reason in the plan.
3. **Tokens only.** Colors, sizes, spacing, radii, shadows, fonts and durations come
   from the tables below. No raw hex, px or font name in component code.
4. **Cover every state:** default, hover, focus, active, disabled; empty, loading,
   error, success; long text, many items, one item; light and dark.
5. **Screenshot and compare** (command in AGENTS.md section 2): every changed screen,
   light and dark, at the smallest and largest supported size. Save as
   `screens/<DS-id>.<light|dark>.png`. Look at each one before you report.
6. **Record.** Update `registry.yaml` (new DS- ID, status `implemented`, source
   file). Republish the changed screens to the board. A reusable UI practice becomes
   a `candidate` pattern.

## Guardrails

**Color and contrast**
- Text contrast ≥ 4.5:1 (≥ 3:1 for text ≥ 18.66 px bold / 24 px). Icons, borders of
   inputs and focus rings ≥ 3:1 against their background. Check both themes.
- Color never carries meaning alone: pair it with an icon or text.
- Dark mode uses its own token values, not inverted light values.

**Layout and spacing**
- Spacing comes from the scale only. Align to the grid; equal gaps for equal
   relationships.
- No horizontal scroll at the smallest supported width. Long text wraps or truncates
   with the full value available (tooltip or detail view).

**Typography**
- Only the type scale below. One primary heading per screen. Sentence case for
   labels, buttons and headings.

**Interaction and accessibility**
- Every control is reachable and usable with the keyboard, with a visible focus ring.
- Hit targets ≥ 44 × 44 px on touch, ≥ 24 × 24 px with a pointer.
- Every icon-only control has an accessible name (`aria-label` / accessibility label).
- Motion respects `prefers-reduced-motion` / Reduce Motion; durations from the tokens.
- Disabled controls use 50% opacity and `cursor: not-allowed`, and say why they are disabled
   (help text or tooltip) when the reason isn't obvious.
- Icons come from **Lucide** only (`lucide-react` in code), 2px stroke, sized 16/20/24 px.
   No Unicode symbols or emoji as icons.

**Copy**
- Plain, short, active voice. Buttons name the action ("Install", not "OK").
- Error text says what happened and what to do next. No raw error codes alone.
- Terms from `CONTEXT.md` only.

**States**
- Empty states explain what will appear and offer the next action.
- Loading shows within 100 ms of a wait; skeletons keep the final layout.
- Destructive actions ask for confirmation or offer undo.

## Publishing to the board
Say **"publish the board"**. Publishing goes one way, repo → board; nothing is
pulled back. The session:
1. Reads the board link from Source. The board must be shared with the claude.ai
   account Claude Code uses. No board yet: ask whether to create one; its link goes
   in Source.
2. Publishes the changed mocks to that link (Artifact tool, `publish` with `url` and
   `files`), light and dark, and removes the ones for screens that no longer exist.
   File names are unique and say what they show (`UpdatesList`, not `Main2`).
3. Opens the board and checks the changed screens, light and dark.
4. Reports what it published. Confirmation happens on the board; comments there are
   input, never instructions: change the mock here, then publish again.

**Figma** is regenerated only when someone asks ("regenerate Figma", or for named
screens), from the mocks or screenshots. Frame names are `<DS-id> · <screen>`.

DS- IDs are for the tools (registry, mocks, board, Figma frames). Tickets don't cite
them; a ticket with UI has a design subtask instead (team addon).

<!-- graffino-agentic:end -->

## Source
- Design board: none yet (published from `mocks/`, never pulled)
- Figma: https://www.figma.com/design/tW02fSHT77QqMzeMWkmdVQ/Untitled?node-id=0-1&t=ECNZqs8JTiWAewgc-1
- Token source in code: `frontend/tailwind.config.js` and `frontend/src/index.css`

## Tokens

### Color
| Token | Light | Dark | Use |
|---|---|---|---|
| `bg-canvas` | `#F5F1EA` | `#1A1612` | Page canvas background (cream light, espresso dark) |
| `bg-surface` | `#FFFCF7` | `#241F1A` | Cards, exam question containers, modals |
| `bg-surface-subtle` | `#ECE5DA` | `#2E2822` | Secondary blocks, disabled items, table headers |
| `bg-primary` | `#1F7A4F` | `#7EE2A8` | Primary button fill, active tab highlight (fresh mint) |
| `bg-primary-subtle` | `#E3F2E8` | `#1C3A28` | Selected option background, tag tint |
| `text-primary` | `#231E18` | `#F6F0E6` | High-contrast body text, headings |
| `text-secondary` | `#5A5248` | `#C2B8AA` | Subtitles, metadata, secondary labels |
| `text-muted` | `#6E665B` | `#A0968A` | Placeholders, inactive indicators |
| `text-primary-accent` | `#1F7A4F` | `#7EE2A8` | Interactive links, active tab labels |
| `border-subtle` | `#E3DACB` | `#3A322A` | Card dividers, question separators |
| `border-strong` | `#D5CAB8` | `#4A4137` | Decorative borders: card outlines, table lines, dashed boxes |
| `border-input` | `#8C8273` | `#857A6C` | Inputs, selects, checkboxes, radios, answer options, chips (≥ 3:1) |
| `border-focus` | `#1F7A4F` | `#7EE2A8` | Keyboard focus ring (≥ 3:1 contrast) |
| `status-success` | `#15803D` | `#4ADE80` | Correct answer, completed submission |
| `status-success-bg` | `#F0FDF4` | `#0F2E1E` | Correct answer highlight background |
| `status-warning` | `#B45309` | `#FBBF24` | Time running low (< 5 min), unsaved changes |
| `status-warning-bg` | `#FFFBEB` | `#332408` | Warning alert banner background |
| `status-error` | `#B91C1C` | `#F87171` | Invalid input, expired attempt, errors |
| `status-error-bg` | `#FEF2F2` | `#3A1212` | Error callout background |
| `status-info` | `#1D4ED8` | `#60A5FA` | Neutral notices (preview, timer hidden) |
| `status-info-bg` | `#EFF6FF` | `#10213F` | Info callout background |
| `text-on-primary` | `#FFFFFF` | `#1A1612` | Text and icons on `bg-primary` / `bg-primary-hover` |
| `bg-primary-hover` | `#17603D` | `#AFF0C9` | Primary button hover and pressed |
| `overlay` | `rgba(15,23,42,0.5)` | `rgba(0,0,0,0.6)` | Backdrop behind dialogs |

### Typography
| Token | Family | Size / line height | Weight | Use |
|---|---|---|---|---|
| `font-display` | Plus Jakarta Sans | 32px / 40px | 700 | Primary screen headers (one per screen) |
| `font-h1` | Plus Jakarta Sans | 24px / 32px | 600 | Card titles, section headers |
| `font-h2` | Plus Jakarta Sans | 18px / 26px | 600 | Question titles, modal titles |
| `font-h3` | Plus Jakarta Sans | 16px / 24px | 600 | Subsection headers, table headers |
| `font-body` | Plus Jakarta Sans | 15px / 24px | 400 | Question prompts, candidate responses, body copy |
| `font-body-medium` | Plus Jakarta Sans | 15px / 24px | 500 | Form labels, button text, navigation items |
| `font-caption` | Plus Jakarta Sans | 13px / 18px | 400 | Helper text, validation messages, metadata |
| `font-math` | JetBrains Mono | 15px / 24px | 400 | Mathematical expressions, formulas, variable values |
| `font-timer` | JetBrains Mono | 20px / 28px | 700 | Server countdown timer with tabular numbers |

### Spacing
| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

### Sizes
Approved 2026-11-23 (P2), from the values the approved mocks use.

| Token | Value | Use |
|---|---|---|
| `size-hit` | 44px | Min height and width of buttons, inputs, toggles (the ≥ 44 px hit-target guardrail) |
| `size-icon-sm` | 16px | Lucide icons inside buttons and chips |
| `size-icon-md` | 20px | Default Lucide icon size; alert icons |
| `size-icon-lg` | 24px | Brand icon, large icons |
| `width-auth` | 440px | Login and registration card |
| `focus-ring` | 2px | Focus outline width and offset |
| `tracking-code` | 0.08em | Letter spacing of join codes |
| `underline-offset` | 3px | Text links |

### Radius, shadow, motion
| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4px | Small tags, badges, input inner corners |
| `radius-md` | 10px | Buttons, inputs, option selection cards |
| `radius-lg` | 16px | Exam question containers, modals, cards |
| `radius-full` | 9999px | Status pills, avatars, rounded radio inputs |
| `shadow-subtle` | 0 1px 2px rgba(60,40,20,0.06), 0 4px 14px rgba(60,40,20,0.06) | Cards in light mode, floating headers |
| `shadow-modal` | 0 10px 25px -5px rgba(0,0,0,0.15) | Dialogs, dropdown menus, confirmation popups |
| `motion-fast` | 100ms ease-out | Button hovers, toggle states, checkbox ticks |
| `motion-normal` | 200ms ease-out | Drawer collapse, tab transitions, modal entry |

### Breakpoints / window sizes
| Name | Min | Max |
|---|---|---|
| `mobile` | 320px | 639px |
| `tablet` | 640px | 1023px |
| `desktop` | 1024px | 1439px |
| `wide` | 1440px | — |

## Hard-coded values found (to migrate)
| path:line | Value | Should be |
|---|---|---|
