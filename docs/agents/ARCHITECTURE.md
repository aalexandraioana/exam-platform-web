# Architecture — exam-platform-web

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
exam-platform-web is a web-based examination platform designed for administering and taking online tests and exams.
Detailed architecture will be populated once technology stack and initial scaffolding are established.

```text
[Browser / Candidate & Examiner UI] --> [Web Application Frontend] --> [Backend API / Services]
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Web UI | `src/` (planned) | User interface for candidates and examiners | Backend API |

## Data flow
1. User Authentication: User logs in -> authentication token issued -> user dashboard presented.
2. Exam Taking: Candidate launches exam -> questions fetched -> responses saved -> submission recorded.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| User session | LocalStorage / Cookies | Web Client | Authentication session |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
<!-- names only, never values -->
| API_BASE_URL | Environment | Web Client | Backend API endpoint |

## Build, deploy, runtime
Build, deploy, and runtime specifications will be established when the framework is selected (see [AGENTS.md](../../AGENTS.md) sections 2 and 5).

## Boundaries
Trust and security boundaries to be established alongside authentication and backend integration.
