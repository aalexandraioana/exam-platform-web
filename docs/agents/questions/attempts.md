# Open questions · Attempts

> Entries of [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) (the index and the rules). IDs never change.


## Q-014 · What happens when an Attempt starts close to the Exam's end_time (`available_until`)?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Every Attempt gets the full duration from its own start (plus the Grace Period). `end_time` (the `available_until` column) only stops new Attempts from starting.

## Q-018 · What are the limits for Subject 2 photo uploads?
- **Status:** answered
- **Date:** 2026-11-22
- **Answer:** Up to 3 images per Subject 2 problem, 10 MB each, in JPG, PNG or HEIC; HEIC is converted to JPG on the server so the Examiner's browser can display it. (The current `responses.uploaded_image_path` holds one path only.)

## Q-027 · Where are Subject 2 photos stored in production?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P6 (attempt engine: uploads)
- **Context:** D-011 says photos are "stored securely on server disk", but the Render web service's disk is wiped on every deploy (D-014), so uploads would be lost. Options: a Render persistent disk (paid plan) or object storage (e.g. S3, R2). The answer may need a change to D-011 (PROPOSAL).
- **Answer:** S3-compatible object storage with a free tier in production (provider chosen in P6, e.g. Cloudflare R2 or Supabase Storage); local disk in development. Chosen over local disk on Render, where every deploy would delete the pilot's photos before grading. Supersedes D-011 (D-048). (Answered 2026-11-22.)

## Q-028 · How does the scheduled auto-submit job run on Render?
- **Status:** answered
- **Date:** 2026-11-22
- **Blocks:** P6 (sealing expired Attempts)
- **Context:** The catalog requires a scheduled job that submits expired Attempts even when the browser is closed. `php artisan schedule:run` needs a cron job or worker on Render (may be paid), and free web services sleep after 15 minutes idle. Options: a Render cron job, a background worker, or checking expiry whenever an Attempt is read plus an external ping.
- **Answer:** Expired Attempts are sealed whenever a request touches or lists them, and a Laravel scheduled job seals the rest; a free external cron service triggers it every few minutes through a secret-protected endpoint, which also keeps the free API awake (D-044). (Answered 2026-11-22.)

## Q-064 · Where do Candidates see an Exam's description?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7 (Candidate dashboard DS-003, exam room DS-004)
- **Context:** An Exam has an optional description, edited in the builder (DS-008 "Setări", added 2026-11-25). No Candidate screen shows it yet. Options: on the dashboard card, on the screen before the Attempt starts, or nowhere (a note for the Examiner only).

- **Answer:** On the exam card on the Candidate dashboard, under the title, as the DS-003 mock shows. (Answered 2026-11-25.)

## Q-065 · Is P6 built in one piece?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6
- **Context:** P6 covers the whole attempt engine plus Subject II photo uploads, which need ImageMagick in the Docker image, an S3 library and an object storage account (D-048).
- **Answer:** Split in four: P6a start and draw (twist: reproducible parameters), P6b timer, autosave and submit (twist: server timer), P6c Subject I grading, P6d Subject II photos and storage. (Answered 2026-11-25; first in two, then split further.)

## Q-066 · Which object storage provider holds Subject II photos in production?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6d
- **Context:** D-048 left the provider to P6. Candidates: Supabase Storage (1 GB free, S3-compatible) or Cloudflare R2 (10 GB free, may need a payment card). The free tiers are to be verified before choosing. The user creates the account; its keys go in Render's settings, never in the repo. Needed by about 28 Nov for the 30 Nov pilot (Q-039).
- **Answer:** Cloudflare R2, set up by the user on 2026-11-26: a private bucket and an API token limited to it; the keys only in Render's settings (`AWS_*`, Laravel's `s3` disk), never in the repo or the conversation. (Answered 2026-11-26.)

## Q-067 · Who sets up the external cron that seals expired Attempts?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6b (sealing endpoint), P12 (pilot)
- **Context:** D-044 needs a free external service calling a secret-protected endpoint every few minutes; reads seal expired Attempts anyway, so correctness doesn't depend on it.
- **Proposed answer:** P6b builds the endpoint (secret in Render's settings); after deploy the user creates a free cron-job.org job calling it every 5 minutes, with steps provided.
- **Answer:** Yes, cron-job.org; it can be removed later (sealing on read keeps results correct without it). Chosen also to keep the free API awake for the pilot, the demo and the evaluation. (Answered 2026-11-25.)

## Q-068 · What separates the "started" and "in_progress" Attempt states?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P6b (state machine)
- **Context:** The schema has started, in_progress, submitted, graded.
- **Proposed answer:** "started" when the Attempt is created, "in_progress" from the first saved answer, so the Examiner can tell who opened the exam but answered nothing.
- **Answer:** Yes, as proposed (confirmed in the P6b plan, 2026-11-25).

## Q-069 · Which labels does an exam card on the Candidate dashboard show?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7 (DS-003)
- **Context:** The approved DS-003 mock shows competence codes and topics ("C3 · C4 · Geometrie"); the API sends neither.
- **Answer:** Only the topics of the exam's Items; no competence codes. (Answered 2026-11-25.)

## Q-070 · Does P7 include Subject II photos and the submitted-exams table?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7 (DS-003, DS-004)
- **Context:** Photo uploads need P6d and a storage provider (Q-066); the DS-003 "Examene predate" table shows scores, which come with P9.
- **Answer:** P7 is built without the photo block (P6d adds it as the approved DS-004 shows) and without the "Examene predate" table (it comes with P9). (Answered 2026-11-25.)

## Q-071 · Is P7 built in one piece?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7
- **Context:** P7 covers two screens, an offline-safe answer queue, a server-synced timer, API additions, mock additions and the catalog's refresh and lost-connection tests.
- **Answer:** Split in four, built in order before the 30 Nov pilot: P7a dashboard (DS-003, join dialog, exam-list API additions), P7b exam room reading and answering (DS-004 additions, inputs, navigation, navigator, mark for review, direct saving), P7c timer and submit, P7d offline and resume (answer queue, resume, Playwright refresh and lost-connection tests). (Answered 2026-11-25; first in three, then P7b split further.)

## Q-072 · How many items does the exam room show at once?
- **Status:** answered
- **Date:** 2026-11-25
- **Blocks:** P7b (DS-004)
- **Context:** The approved DS-004 mock shows items 3 and 4 together in Subject I but item 8 alone in Subject II.
- **Answer:** One item per screen, in both Subjects; "← Itemul n" / "Itemul n →" move between items and the navigator jumps to any item. (Answered 2026-11-25.)
