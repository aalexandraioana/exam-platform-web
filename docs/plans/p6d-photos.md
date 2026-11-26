# Plan — P6d: Subject II photos (D-026, D-048)

Status: approved 2026-11-26 (D-026, D-048, C-006 additions, the assumptions; deleting asks first) · Covers D-004, D-019, D-026, D-044, D-048 · Q-066 answered (Cloudflare
R2), Q-070 · Builds on P6b (autosave, deadline, sealing), P7b–P7d (exam room) · next: P8 (the
Examiner sees and grades the photos)

## Size
M–L. Uploads with HEIC conversion, storage on disk locally and in R2 in production, three
endpoints, the DS-004 photo block, and one new dependency plus one system package.

## Approach
**Part 1 · backend (C-006, additive).**
- **Storage** (D-048): the photos go to Laravel's default disk: `local` in development, `s3` in
  production. Render gets `FILESYSTEM_DISK=s3` plus the `AWS_*` keys you set for R2. No new
  setting: Laravel's own `FILESYSTEM_DISK` switches it.
- **New dependency:** `league/flysystem-aws-s3-v3`, needed for Laravel's `s3` disk to talk to R2.
- **Docker:**
  - `libheif-examples` (the `heif-convert` tool) and `libheif-plugin-libde265` (its HEVC decoder,
    needed for iPhone photos) for the HEIC → JPG conversion (D-026)
  - PHP's upload limits raised to 10 MB per file (the default is 2 MB)
- **Endpoints** (Candidate, own Attempt, a Subject II problem only):
  - `POST /attempts/{id}/items/{position}/images` (one file, `image`) → `201 {image}`.
    - JPG, PNG or HEIC, at most 10 MB, at most 3 per problem.
    - HEIC is converted to JPG on the server.
    - The image takes the lowest free position (1–3).
  - `DELETE /attempts/{id}/items/{position}/images/{imageId}` → 204.
  - `GET /attempts/{id}/images/{imageId}` → the file, for the Candidate's own photos. The app
    fetches it with the token and shows it, since an `<img>` can't send the token.
  - **Refused:**
    - `422 image_type`, `image_too_large`, `not_a_problem`
    - `409 images_full`
    - `409 time_up` / `attempt_submitted`: the same deadline and grace as saving answers (D-004),
      under the Attempt's row lock (PATTERN-007)
- **The read:** `items[].images: [{id, position, name, size}]` for Subject II items.
- `photos_enabled` in the read: false in production until `FILESYSTEM_DISK=s3` **and** all R2 keys are
  set (checked while building: the disk name alone wasn't enough), so the exam room hides the photo block.
- **Answered:** a problem with a photo counts as answered for the navigator, the submit dialog and
  the end screen.

**Part 2 · DS-004 mock additions** (confirmed by you before Part 3). The photo block
("Subiectul II + fotografii (P6d)") is approved. Added:
- an upload refused: wrong type, too large, the network down ("Fotografia nu s-a încărcat …
  Încearcă din nou")
- the confirmation before deleting a photo (the user's choice)
- the Subject II hint back to the approved mock's wording: "Scrie pașii pe scurt. Desenul și
  calculele le poți fotografia mai jos."

**Part 3 · the exam room:**
- **The photo block** under "Pașii rezolvării", as the mock:
  - three slots and "2 din 3"
  - uploaded photos as thumbnails, each with "Șterge"
  - the upload in progress with its progress bar ("Se pregătește imaginea…" while a HEIC is converted)
  - "Fotografiază sau alege": the phone offers the camera or the gallery
  - the limits text
- **Photos are uploaded right away.** They aren't kept on the device like text answers (too large
  for browser storage). Offline, the upload is refused with the retry notice. The text steps stay
  protected by P7d.
- **Deleting** asks first, in a small confirmation dialog ("Ștergi fotografia 2?", "Anulează" / "Șterge"), as the user asked.

**Production check, after you set up R2:** I upload a test photo on the live site with a throwaway
Candidate and check it in R2, then delete it.

Rejected:
- uploads straight from the browser to R2 (it needs CORS on the bucket and pre-signed URLs; HEIC
  conversion must happen on the server anyway)
- converting with the Imagick PHP extension (a compiled extension, and Debian's ImageMagick HEIC
  support is uncertain; `heif-convert` does one job)
- keeping photos on the device offline (browser storage is a few MB)
- resizing photos (not asked for; 10 MB × 3 fits easily in the free tier)

## API (C-006 additions)
| Endpoint | What |
|---|---|
| `POST /attempts/{id}/items/{position}/images` | upload; 201 `{image: {id, position, name, size}}`; 422 `image_type`, `image_too_large`, `not_a_problem`; 409 `images_full`, `time_up`, `attempt_submitted` |
| `DELETE /attempts/{id}/items/{position}/images/{imageId}` | 204; same 409s |
| `GET /attempts/{id}/images/{imageId}` | the file (own Attempt only) |
| `GET /attempts/{id}` | `items[].images`; `photos_enabled` (false in production until R2 is configured) |

Consumers: `frontend/src/api/attempts.ts` (this plan); P8's grading queue later.

## Files
| Action | Path | What |
|---|---|---|
| edit | `backend/composer.json`, `composer.lock` | `league/flysystem-aws-s3-v3` |
| edit | `backend/Dockerfile` (+ `docker/php-uploads.ini`) | `libheif-examples`, `libheif-plugin-libde265`; 10 MB uploads |
| add | `backend/app/Support/Attempts/Photos.php`, `PhotoRefused.php` | checks, HEIC conversion, storing, positions, under the row lock; the refusal codes |
| add | `backend/app/Http/Controllers/AttemptImageController.php` | the three endpoints |
| edit | `backend/routes/api.php`, `Resources/AttemptResource.php`, `Models/Answer.php` | routes, `images` in the read |
| add | `backend/tests/Feature/Attempts/PhotosTest.php`, `tests/fixtures/` (tiny JPG, PNG, HEIC) | below |
| edit | `render.yaml` | `FILESYSTEM_DISK` and the `AWS_*` keys listed as dashboard settings (`sync: false`, no values; region `auto`, bucket name and path style set) |
| edit | `docs/design/mocks/DS-004.html`, `registry.yaml` | Part 2 |
| edit | `frontend/src/api/attempts.ts` | upload (with progress), delete, fetch the image |
| add | `frontend/src/pages/candidate/exam/PhotoTray.tsx` (+ test) | the photo block |
| edit | `frontend/src/pages/candidate/exam/ItemView.tsx`, `useAnswers.ts` (photos count as answered), `i18n/*.json` | |
| edit | `frontend/e2e/exam-room.spec.ts` | DS-004 photo screenshots |
| edit | `docs/API.md`, `CONTRACTS.md` (C-006), `ARCHITECTURE.md`, roadmap | |

## Tests
| # | Behaviour | Test |
|---|---|---|
| 1 | JPG and PNG stored as sent; HEIC converted to JPG (a real HEIC fixture) | Pest (fake disk; conversion with the real tool in Docker) |
| 2 | Refused: wrong type, over 10 MB, a fourth photo, a Subject I item, another Candidate's Attempt (404), after the deadline + grace, after submitting | Pest |
| 3 | Positions: the lowest free one; deleting frees it | Pest |
| 4 | The file is served to its Candidate only; the read lists the images | Pest |
| 5 | Two uploads at once never give 4 photos or the same position (row lock) | Pest (and a parallel check by hand, as in P6a) |
| 6 | Photo block: slots and count, upload with progress, thumbnail, delete, the refusals, offline | Vitest |
| 7 | A problem with only photos counts as answered (navigator, submit dialog) | Vitest |
| 8 | DS-004 photo states, light/dark, 1440/320 | Playwright |

Not automated: the upload to R2 on the live site (checked by hand once your keys are in Render).

## Design
DS-004 "Subiectul II + fotografii" approved, plus the Part 2 refusal states confirmed first. Tokens
only; the slots in a 3-column grid (2 on phones, as the mock). RO/EN.

## Sequencing
Part 1 ∥ Part 2; Part 3 after you confirm Part 2. One builder.

## Risks
- **R2 not ready by the pilot:** the live site can't store photos. Without `FILESYSTEM_DISK=s3`,
  it would write to Render's disk, which is wiped on every deploy (D-048). So the API refuses
  uploads in production while R2 is missing (`503 storage_unavailable`), and the exam room hides
  the photo block. Subject II stays text only.
- **The Docker image gets bigger** (`libheif-examples`). Render's build takes a bit longer.
- **A HEIC variant `heif-convert` can't read:** refused with `image_type`, and the Candidate can
  send a JPG instead (iPhones can share as JPG).

## Out of scope
The Examiner viewing and grading the photos (P8); deleting photos after grading or after the
evaluation; resizing.

## Knowledge used
| Entry | What it says | Why it applies | Call |
|---|---|---|---|
| D-026 | 3 photos per problem, 10 MB, JPG/PNG/HEIC, HEIC converted | the limits and conversion | **confirm** |
| D-048 | photos in object storage in production, local disk in development | the disk switch | **confirm** |
| Q-066 | Cloudflare R2 | production storage | answered today |
| C-006 | Attempts API | three endpoints and `items[].images`; consumers: `api/attempts.ts`, P8 later | **confirm** |
| PATTERN-007 | lock the row a state-dependent write checks | uploads under the Attempt's lock | candidate |
| 5 entries confirmed before, unchanged: D-004, D-019, D-044, Q-070, PATTERN-005 | | the deadline and grace; nothing scored shown; sealing; photos in P6d; error codes | — |

### Considered, not applied
- D-061 (maths font), D-045 (shuffle): unchanged. D-031 (barem): P8.

### Assumptions (no entry behind them)
- A problem with a photo but no text counts as answered.
- Photos upload right away and aren't kept on the device offline.
- Deleting a photo asks for confirmation (user, 2026-11-26).
- In production without R2 configured, uploads are refused and the photo block is hidden.
