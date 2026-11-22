# Specification & Breakdown: Authentication Parts 2 & 3

## Overview
Following the approval of **Part 1 (Backend Foundation & Authentication REST API)**, the frontend authentication implementation is split into two focused, sequential phases:
- **Part 2:** Frontend SPA foundation, API client, `AuthContext`, session management, and route protection (RBAC guards).
- **Part 3:** Authentication UI screens (`DS-001` Login & `DS-002` Register), HTML design mocks, form validation, error states, and visual screenshot tests.

---

## Part 2: Frontend SPA Scaffold, Auth State & Route Protection

### Size: M
Scaffolds React 19 + Vite SPA, Tailwind CSS with design tokens, HTTP client with interceptors, AuthContext, role guards, and Vitest test suite.

### Scope & Encompassed Components
1. **Frontend Project Foundation (`frontend/`):** *Moved to P0 (`docs/plans/p0-foundations.md`): the scaffold, Tailwind tokens and Vitest setup are built there; Part 2 starts from that scaffold. Kept below for reference.*
   - React 19 + TypeScript + Vite initialized.
   - Tailwind CSS configuration mapping all tokens from [`docs/design/DESIGN.md`](../design/DESIGN.md):
     - Colors: all values from DESIGN.md per D-035: fresh mint accent (`#1F7A4F` light, `#7EE2A8` dark), warm cream light neutrals (canvas `#F5F1EA`), espresso dark neutrals (canvas `#1A1612`).
     - Fonts: Plus Jakarta Sans for UI text, JetBrains Mono for numeric/code.
     - Spacing scale: 4px grid (`space-1` = 4px, `space-2` = 8px, etc.).
     - Radii: `rounded-md` (10px), `rounded-lg` (16px) per D-035.
   - Setup React Router DOM for SPA routing.
   - Setup Vitest + `@testing-library/react` + `jsdom`.

2. **HTTP API Client (`frontend/src/api/`):**
   - Configured client (`client.ts`) referencing `VITE_API_BASE_URL` (default `http://localhost:8000/api`).
   - Request Interceptor: Automatically attaches `Authorization: Bearer <token>` from storage.
   - Response Interceptor: Intercepts `401 Unauthorized` responses to clear local auth state and emit logout events.

3. **Authentication State Management (`frontend/src/context/AuthContext.tsx`):**
   - Types (`src/types/auth.ts`):
     - `User`: `{ id: number; name: string; email: string; role: 'candidate' | 'examiner' | 'administrator'; is_active: boolean }`
     - `AuthState`: `{ user: User | null; token: string | null; isAuthenticated: boolean; isLoading: boolean }`
   - Actions:
     - `login(credentials)`: Calls `POST /api/login`, saves token to `localStorage`, populates user state.
     - `register(data)`: Calls `POST /api/register`, saves token, populates candidate state.
     - `logout()`: Calls `POST /api/logout`, cleans up `localStorage` and resets state to null.
     - Initial hydrate: On app mount, if token exists, calls `GET /api/user` to validate session and refresh user role.

4. **Route Protection & RBAC Guards (`frontend/src/components/auth/`):**
   - `ProtectedRoute.tsx`:
     - If `isLoading`: Renders loading skeleton.
     - If not `isAuthenticated`: Redirects to `/login` preserving `location.state.from`.
     - If `allowedRoles` specified and user's role is not included: Redirects to user's home dashboard (`/candidate/dashboard` for candidate, `/examiner/dashboard` for examiner, `/admin/users` for admin).
   - Placeholder dashboard routes to verify redirection:
     - `/candidate/dashboard` (Candidate area)
     - `/examiner/dashboard` (Examiner area)
     - `/admin/users` (Admin area)

5. **Automated Tests (Vitest):**
   - `AuthContext.test.tsx`: Tests login, logout, token persistence, and session hydration from `/api/user`.
   - `ProtectedRoute.test.tsx`: Tests redirect on unauthenticated access, access granted for authorized role, redirect on role mismatch.

---

## Part 3: Authentication UI Screens (Login & Register) & Visual Design

### Size: M
Implements the user-facing screens for `DS-001` (`auth-login`) and `DS-002` (`auth-register`), HTML design mocks, form validation, accessible controls, and Playwright screenshot verification.

### Scope & Encompassed Components
1. **Design System Mocks (`docs/design/mocks/`):**
   - `docs/design/mocks/DS-001.html`: Standalone interactive mock for Login screen featuring theme switcher (Light / Dark) and state switcher (Default, Loading, Validation Error, Account Deactivated).
   - `docs/design/mocks/DS-002.html`: Standalone interactive mock for Candidate Registration screen with theme and state switchers.
   - Registry update: `docs/design/registry.yaml` status updated for `DS-001` and `DS-002`.

2. **Login Screen (`DS-001` · `frontend/src/pages/auth/LoginPage.tsx`):**
   - Form with Email and Password inputs.
   - Accessibility: Visible focus rings (`border-focus`: mint `#1F7A4F` / `#7EE2A8`), touch targets ≥ 44×44px, keyboard navigable.
   - States covered:
     - Default clean layout with calm, low-stress styling per D-007.
     - Loading: Button disabled with loading indicator during API call.
     - Error: Inline field errors and banner alert for invalid credentials or a deactivated account ("This account is deactivated. Contact your administrator.") — no pending-approval state (D-020).
   - Role-based redirect upon login:
     - Candidate → `/candidate/dashboard`
     - Examiner → `/examiner/dashboard`
     - Administrator → `/admin/users`
   - Secondary link: "Don't have an account? Register as Candidate".
   - Helper notice: "Examiner accounts are provisioned and activated by platform administrators."

3. **Candidate Registration Screen (`DS-002` · `frontend/src/pages/auth/RegisterPage.tsx`):**
   - Fields: Full Name, Email, Password, Password Confirmation.
   - Real-time client-side validation:
     - Email syntax.
     - Password length (min 8 characters).
     - Password match confirmation.
   - Server error handling: 422 Unprocessable Entity mapping error messages to fields (e.g. duplicate email).
   - On success: Automatically authenticates candidate and redirects to `/candidate/dashboard`.
   - Secondary link: "Already have an account? Log in".

4. **Visual Regression & E2E Verification (Playwright):**
   - `e2e/auth.spec.ts`:
     - Test candidate self-registration journey.
     - Test candidate login and dashboard redirect.
     - Test examiner login and dashboard redirect.
     - Test admin login and user management redirect.
     - Test validation error presentations.
   - Visual regression screenshots:
     - `docs/design/screens/DS-001.light.png`
     - `docs/design/screens/DS-001.dark.png`
     - `docs/design/screens/DS-002.light.png`
     - `docs/design/screens/DS-002.dark.png`
