# Plan — P4a: math engine (named values, seeded draws, answer matching)

Status: approved 2026-11-24 (with the knowledge entries and assumptions below); Q-049–Q-052 answered · Covers D-057 (values), D-006, D-013, D-017 · Branch `feat/p4-question-bank`

## Size
M. Four small backend classes with unit tests, one new dependency, the seed template. No API, no
screen, no migration: P4b (editor, "Alte exemple") and P6 (draw at Attempt start, grading) call it.

## Approach
A backend module in `app/Support/Math/` (beside `JoinCode`), pure PHP with no database:
1. **Expression**: checks a formula against a whitelist (whole numbers, the question's value names,
   `+ − · :` and parentheses, with `*`, `×`, `/` accepted as the same signs; Q-052) *before* handing it to `nxp/math-executor`
   (D-013, no `eval`). Anything else is refused with a code, never evaluated.
2. **ValueDefinitions**: reads a question's `parameters` JSON and reports problems as codes
   (PATTERN-005): a `{name}` in the statement with no definition, min > max, every value excluded,
   an unknown name or a cycle in calculated values, an invalid formula or condition.
3. **ValueDrawer**: draws one set of values from a seed with PHP's seeded `Random\Randomizer`
   (Mt19937), so the same seed always gives the same values (D-006 contests). Random values are
   whole numbers in [min, max] minus the excluded ones; calculated values follow in dependency
   order; a draw that breaks a condition, gives a non-whole calculated value or answer (Q-049), or
   makes two choice options read the same is drawn again, up to a
   fixed limit, after which the question is reported as `no_valid_draw` (D-059's preview check).
   It also fills the statement (`{p}` → `3`) and the options of single and multiple choice
   questions, and returns the expected answer.
   Where values can be used (Q-050): short answer with a numeric answer (`answer` formula
   required); Subject II statements (no `answer`, graded by hand); single and multiple choice
   options such as `"{a}"`, `"{b}"` (the correct positions stay fixed; options use names only,
   so `a + 1` is a calculated value). The answer is always a number (Q-051).
4. **AnswerMatcher**: D-017. Numbers: `2,5` = `2.5`, exact (tolerance 0, D-006). Fractions: only
   the expected form (`3/4` ≠ `6/8`), spaces ignored. Text: case, extra spaces and Romanian
   diacritics (both ș/ş and ț/ţ forms) ignored, against the accepted list. True/false and single
   / multiple choice: exact match on the original option positions (shuffling, D-045, is undone
   before matching, in P6).

Rejected: writing our own parser (D-013 asks for a library); `symfony/expression-language`
(general-purpose, evaluates object and method calls, can compile to PHP code); decimals or
fractions as random values (Q-048: whole numbers only).

The `parameters` shape (stored as JSON on the question, and in the seed file):
```yaml
parameters:
  values:
    p: { random: { min: 2, max: 5 } }
    q: { random: { min: 3, max: 9, except: [6] } }
    k: { fixed: 4 }
    s: { calculated: "(p + q) * k" }
  conditions: ["p < q"]          # all must hold; < > <= >= = != (also ≤ ≥ ≠)
  answer: "p * k"
```

## Files
| Action | Path | What |
|---|---|---|
| edit | `backend/composer.json`, `composer.lock` | add `nxp/math-executor` ^2.4 (MIT) |
| add | `backend/app/Support/Math/Expression.php` | whitelist check + evaluation |
| add | `backend/app/Support/Math/ValueDefinitions.php` | read and check `parameters`; problem codes |
| add | `backend/app/Support/Math/ValueDrawer.php` | seeded draw, conditions, statement filling, expected answer |
| add | `backend/app/Support/Math/AnswerMatcher.php` | D-017 matching per answer kind |
| add | `backend/tests/Unit/Math/*Test.php` | the tests below |
| edit | `backend/database/seeders/data/questions.template.yaml` | `topic:` (one, D-058); new `parameters` shape |
| edit | `docs/agents/ARCHITECTURE.md` | the library and the module |

## Tests (Pest, unit, written first)
| # | Behaviour |
|---|---|
| 1 | Evaluates `(p + q) * k`, `p · k`, `a : b`, `2 × p` with given values |
| 2 | Refuses functions, unknown names, `^`, `%`, letters glued to numbers, PHP code, empty formulas |
| 3 | Division by zero is a failed draw, not a crash |
| 4 | Definitions: undefined `{r}` in the statement; min > max; all values excluded; a cycle (`a = b + 1`, `b = a − 1`); unknown name in a formula or condition; each with its code |
| 5 | Same seed → same values, statement and answer; different seeds → (over many) different values |
| 6 | Random values stay in [min, max] and never take an excluded value (over many seeds) |
| 7 | Conditions always hold in drawn sets; impossible conditions (`p < q` with p ≥ 5, q ≤ 3) → `no_valid_draw` |
| 8 | Whole-number rule (Q-049): a set whose calculated value or answer isn't whole is drawn again |
| 8b | Choice options with values: filled per draw; a set where two options read the same is drawn again; the correct positions don't move |
| 8c | Subject II: statement filled, no answer required; short answer without an `answer` formula is a definition problem |
| 9 | Statement filling: every `{name}`, negatives shown as `-3`, other braces left alone |
| 10 | Numbers: `2,5` = `2.5` = `2.50`; `2,4` ≠ `2,5`; `-3` and `−3`; spaces trimmed; `1.000` is 1 (no thousands separators) |
| 11 | Fractions: `3/4` and `3 / 4` accepted, `6/8` and `0,75` refused |
| 12 | Text: `Se injumatatesc ` matches `se înjumătățesc`; ş/ș and ţ/ț both match; a different word doesn't |
| 13 | Choice: true/false, one option, every correct option and nothing else (all or nothing, D-005) |

## Design
None (no screen in P4a). The DS-007 values editor (approved) is built in P4b on top of this.

## Sequencing
One builder.

## Risks
- Floating point: inputs are whole numbers and only `/` makes non-whole numbers; the whole-number
  rule (Q-049) compares results exactly. If you choose decimals instead, results are rounded to the
  chosen places before comparing.
- Draw limit: very strict conditions can make good draws rare. The limit (1000 tries) makes that a
  clear `no_valid_draw` at Ready time, not a failure in the middle of an exam.
- The library is a new dependency; if it misbehaves, the whitelist still blocks anything but
  arithmetic, and it can be swapped behind `Expression`.

## Out of scope
The editor and preview endpoint (P4b), seeding the questions (P4c), drawing at Attempt start and
grading (P6), maths notation on screen (Q-032, open).

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-057 | Named values: fixed, random whole numbers in [min, max] with exclusions, calculated; simple conditions; preview | the core of P4a | confirmed 2026-11-24 |
| D-006 | Exact match (tolerance 0); drawn values stored per Attempt | matching; the drawer's output is what P6 stores | confirm |
| D-013 | Sandboxed maths library with an operation whitelist, no `eval` | the library + whitelist | confirm |
| D-017 | Both decimal separators; fraction in the expected form; text ignores case, spaces, diacritics | AnswerMatcher | confirm |
| D-005 | Subject I is all or nothing | multiple choice matching | confirm |
| D-045 | Options shuffled per Attempt, order stored | matcher uses original positions | confirm |
| D-059 | Parameterised question Ready only if every name is defined and the preview gives valid values | ValueDefinitions + `no_valid_draw` | confirmed 2026-11-24 |
| D-029 | Seed file → database, insert-only | template update | confirm |
| PATTERN-005 | Errors as codes | definition problem codes | confirmed 2026-11-24 |
| Q-032 | Maths notation on screen | open; not needed by P4a | open |
| Q-049–Q-052 | whole results only; values in short answer, Subject II statements and choice options; numeric answers only; + − · : ( ) | answered 2026-11-24 | answered |

### Assumptions (no entry behind them)
- True/false questions don't use values: whether the statement is true could change with the values.
- `·` and `×` mean multiply and `:` means divide in formulas (school notation), besides `*` and `/`.
- Thousands separators are not accepted in answers (`1.000` is 1, as D-017 accepts `.` as decimal).
- Trailing punctuation in text answers is not ignored (D-017 lists case, spaces, diacritics only).
