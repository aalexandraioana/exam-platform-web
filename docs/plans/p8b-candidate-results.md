# P8b: the Candidate's results page (DS-005)

Approved by the user on 2026-11-27. Part of P8 (Q-077); P8a (grading and publishing) comes before it, P8c (answer-key correction, D-046) after the pilot.

## Size
M: one new read-only endpoint, one new screen (DS-005, mock first), a small change to the dashboard card. Nothing new is stored.

## Approach
- **New endpoint:** `GET /api/candidate/exams/{id}/results`, part of C-006. It returns `409 results_not_published` until the Examiner publishes (D-019), and 404 for an Exam the Candidate can't see.
- **What it returns:**
  - Every submitted Attempt of the Candidate, with the grade (total / 10), the Subject I and Subject II scores, and which Attempt counts under the score policy (D-012, Q-084); also the cohort note.
  - **Subject I (Q-082):** the question as shown, the Candidate's answer, the correct answer, the points and the question's explanation. The correct answer comes from the snapshot through the stored option order (D-045); for generated values, it is the Attempt's own answer.
  - **Subject II (Q-083):** the written steps, the Candidate's own photos (served by the existing photo route), the points out of 20, the comment and the adjustment. With a barem, the steps with the points earned on each.
  - No class statistics (Q-085).
- **Exam list:** `GET /candidate/exams` gains `grade` (the counted grade), only once results are published. The dashboard card then shows the grade and **Vezi rezultatele**.
- **Frontend:** `/candidate/exams/:id/results`, reusing the exam room's number-and-formula display (D-061) and the grading screen's barem layout.
- **Rejected:**
  - Extending `GET /attempts/{id}`: that route is the exam room's and never carries the key or scores.
  - Storing the explanation in the snapshot: it would need a migration for little gain.

## Files
| Action | Path | What |
|---|---|---|
| add | `backend/app/Http/Controllers/CandidateResultsController.php`, `Http/Resources/ResultsResource.php` | results endpoint |
| edit | `backend/app/Http/Controllers/CandidateExamController.php` | `grade` once published |
| edit | `backend/routes/api.php`, `docs/API.md`, `docs/agents/CONTRACTS.md` (C-006) | route, documentation, contract |
| add | `backend/tests/Feature/Results/CandidateResultsTest.php` | Pest tests |
| add | `docs/design/mocks/DS-005.html` | mock, confirmed before screen code |
| add | `frontend/src/api/results.ts`, `frontend/src/pages/candidate/ResultsPage.tsx` (+ `results/`), tests | DS-005 |
| edit | `frontend/src/pages/candidate/ExamCard.tsx`, `src/api/attempts.ts`, `App.tsx`, `src/i18n/{ro,en}.json` | card, route, RO/EN text |
| add/edit | `frontend/e2e/results.spec.ts`, `docs/design/screens/DS-005.*`, `DS-003.*`, `registry.yaml` | screenshots and registry |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | Before publication: 409, with no score, key or comment; the list has no `grade` | Pest |
| 2 | Another class's Exam: 404; a classmate's Attempt never appears | Pest |
| 3 | Subject I: correct answer in the shown option order (single, multiple, true/false), accepted short answer, a generated value's answer, explanation | Pest |
| 4 | Subject II: barem steps with points earned, adjustment, comment; one score without a barem; only the Candidate's own photos | Pest |
| 5 | Several Attempts: all listed, the counted one marked by highest and by latest; grade = total / 10 | Pest |
| 6 | No class statistics in the response | Pest |
| 7 | Page: grade, cohort note, Subject I and II detail, switching Attempts, unanswered items, error and retry | Vitest |
| 8 | Dashboard card: grade and **Vezi rezultatele** after publication, the old text before | Vitest |
| 9 | Screenshots, light and dark, at 1440 and 320 px | Playwright (Docker) |

## Sequencing
One builder: backend (tests first), then the DS-005 and DS-003 mocks for the user's confirmation, then the frontend. Branch `feat/p8b-results` from the P8a branch; released to `main` together with P8a under D-063, before or after the pilot, never during it.

## Risks
- **Early leak of scores or keys:** guarded by `results_published_at`; tests 1, 2 and 6 cover it.
- **The explanation can still change** after publication (not locked); the page shows the current text. The answer key and barem are locked (C-004).

## Out of scope
P8c (D-046), contesting a grade, notifications, class statistics (Q-085).

## Knowledge used
Confirmed and unchanged: D-012, D-015, D-019, D-022, D-031, D-038, D-045, D-051, D-052, D-061, D-062, C-007. Confirmed 2026-11-27: C-006 (changed by this plan), PATTERN-005, PATTERN-010, Q-077, D-063 (on PR #15). Answered 2026-11-27: Q-082–Q-085. Considered, not applied: C-004.

Assumptions:
- The grade shown is total / 10 with two decimals.
- An unanswered item shows "Fără răspuns" with 0 points.
- No new navigation link; the page opens from the dashboard card.
