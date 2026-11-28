# Decisions · Attempts

> Entries of [DECISIONS.md](../DECISIONS.md) (live) and [DECISIONS-SUPERSEDED.md](../DECISIONS-SUPERSEDED.md) (never obeyed; kept to explain old code). IDs never change.


## D-004 · Authoritative server timer with 30-second expiration grace period
- **Status:** approved
- **Date:** 2026-11-18
- **Confirmed:** 2026-11-25
- **Rule:** Exam duration is strictly enforced on the server, with a 30-second grace period buffer after timer expiration to accept in-flight submissions delayed by network latency before rejecting subsequent answers.
- **Why:** Eliminates client-side timer tampering while maintaining fairness for candidates on school or mobile networks.
- **Rejected:** Client-side only countdown timer; strict 0-second cutoff without latency tolerance.
- **Evidence:** README.md:32
- **Source:** user · confidence high

## D-011 · Subject 2 handwritten solution photo upload alongside text
- **Status:** superseded-by D-048
- **Date:** 2026-11-18
- **Rule:** Subject 2 solutions allow candidates to submit step-by-step reasoning text alongside uploaded photos/images of their handwritten work (geometric drawings and algebraic proofs), stored securely on server disk and presented in the Examiner's manual grading queue.
- **Why:** 6th-grade geometric proofs and complex calculations require natural handwritten sketches and intermediate steps that are impractical to type solely in text inputs.
- **Rejected:** Plain text-only submissions; mandatory LaTeX code entry for 6th-grade students.
- **Evidence:** README.md:84, docs/agents/ARCHITECTURE.md:24
- **Source:** user · confidence high

## D-021 · Full duration per Attempt regardless of available_until
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-24
- **Rule:** Every Attempt gets the Exam's full duration from its own start, plus the Grace Period (D-004). The Exam's `available_until` only stops new Attempts from starting.
- **Why:** The interview asks for the timer to start per device when the Candidate connects, for fairness.
- **Rejected:** Cutting Attempts at `available_until`.
- **Evidence:** docs/agents/questions/attempts.md:Q-014; INTERVIEW.md:Q14
- **Source:** user · confidence high

## D-026 · Subject 2 photo upload limits
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** A Candidate can upload up to 3 images per Subject 2 problem, 10 MB each, in JPG, PNG or HEIC. HEIC is converted to JPG on the server so the Examiner's browser can display it. D-048 still holds (photos in object storage in production).
- **Why:** Multi-page handwritten solutions from phones (often HEIC on iPhones) must reach the Examiner readable.
- **Rejected:** 5 images per problem; 5 MB JPG/PNG only without HEIC conversion; 1 image per problem.
- **Evidence:** docs/agents/questions/attempts.md:Q-018
- **Source:** user · confidence high

## D-044 · Expired Attempts sealed on read and by a pinged scheduled job
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-25
- **Rule:** Any request that touches an Attempt, or lists Attempts, first seals those past their duration plus the Grace Period (D-004, D-021). A Laravel scheduled job seals the rest; a free external cron service triggers it every few minutes through a secret-protected endpoint, which also keeps the free API awake. Correctness never depends on the job running on time.
- **Why:** Render's cron jobs and workers are paid and the free API sleeps after 15 minutes idle, while the catalog requires a scheduled job that submits expired Attempts even when the browser is closed.
- **Rejected:** A Render cron job or worker (paid); sealing only on read (no real scheduled job).
- **Evidence:** docs/agents/questions/attempts.md:Q-028; catalog-de-proiecte-web.md (P13 technical requirements)
- **Source:** user · confidence high

## D-045 · Answer options shuffled per Attempt
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-25
- **Rule:** The options of dual, single and multiple choice questions are shuffled per Attempt, and the order is stored with the Attempt so review and contests show exactly what the Candidate saw. Items keep the blueprint order (D-043).
- **Why:** Delivers the catalog's random order without changing item numbers in grading or the shared difficulty curve.
- **Rejected:** Also shuffling Items within each Subject; no shuffling.
- **Evidence:** docs/agents/questions/exams.md:Q-029; catalog-de-proiecte-web.md:893
- **Source:** user · confidence high

## D-048 · Subject II photos in object storage in production
- **Status:** approved
- **Date:** 2026-11-22
- **Confirmed:** 2026-11-26
- **Rule:** Subject II solutions keep their step-by-step text and up to 3 handwritten photos per problem (D-011, D-026). In production the photos are stored in S3-compatible object storage with a free tier (provider chosen in P6); in development they stay on the local disk. The Examiner's grading queue shows them either way.
- **Why:** Render's free web service loses its disk on every deploy, so photos uploaded in the pilot would be deleted before grading (Q-027).
- **Rejected:** Local disk on Render with no deploys between pilot and grading; a paid Render persistent disk.
- **Evidence:** docs/agents/questions/attempts.md:Q-027; conversation 2026-11-22
- **Source:** user · confidence high
