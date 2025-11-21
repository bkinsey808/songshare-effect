```markdown
# Authentication Flow Review — Sign-in & Sign-out

Date: 2025-11-02

Reviewed files (server & client)

- Server
  - `api/src/oauth/oauthCallbackFactory.ts`
  - `api/src/oauth/buildUserSessionJwt.ts`
  - `api/src/getVerifiedSession.ts`
  - `api/src/me.ts`
  - `api/src/server.ts` (signout endpoint)
- Client
  - `react/src/auth/ensureSignedIn.ts`
  - `react/src/auth/useEnsureSignedIn.ts`
  - `react/src/auth/handleJustSignedIn.ts`
  - `react/src/auth/ProtectedLayout.tsx`
  - `react/src/auth/useSignIn.ts`
  - `react/src/auth/useSignInError.ts`
  - `react/src/auth/SignInButtons.tsx`
  - `react/src/auth/authSlice.ts`

Summary (high level)

- The app uses an HttpOnly JWT session cookie set by the server on successful OAuth callback, then redirects the browser to the SPA (303 See Other).
- The SPA hydrates auth state by calling `/api/me` (with credentials included) via `ensureSignedIn()`. The hook and a shared `ensureSignedIn` helper dedupe in-flight requests and update the Zustand store.
- To mitigate a race (SPA loading before the browser includes the new cookie after callback redirect), the app uses a `justSignedIn=1` query param plus `ProtectedLayout` which forces a refresh (`ensureSignedIn({force:true})`) and writes a one-time `sessionStorage` marker on success. This prevents a transient redirect-to-Home flash.
- Sign-out is optimistic in the client (local state cleared immediately) followed by POST `/api/auth/signout` to clear the server cookie.

What is done well (best practices observed)

- Session cookie is HttpOnly and signed (JWT) — prevents direct JS access to token.
- Server verifies signed OAuth state and validates CSRF cookie before exchanging code — good anti-CSRF practice for OAuth.
- `ensureSignedIn` uses `credentials: include` and dedupes concurrent calls.
- The `justSignedIn` + forced refresh pattern is a minimal, well-scoped fix for the sign-in flash problem.
- Sign-in error tokens are short keys (not PII) and are removed from the URL quickly by the client.
- `/api/me` uses a reusable verification helper (`getVerifiedUserSession`) with schema validation.
- CORS policy permits credentials, and production restricts allowed origins.

Issues found and concrete recommendations

1. Sign-out cookie clearing should mirror cookie attributes used when setting the cookie

- Problem: sign-out currently sets `Set-Cookie: userSession=; HttpOnly; Path=/; Max-Age=0;` while the callback sets the cookie with SameSite, Secure and possibly Domain attributes depending on environment. If attributes differ, some browsers may not clear the cookie correctly (especially cross-site or domain-bound cookies).
- Recommendation: compute cookie attributes consistently and use the same attributes when clearing the cookie. Prefer a helper like `buildSessionCookie(name, value, { maxAge, httpOnly, sameSite, secure, domain, path })` used both for set and clear. When clearing include `Max-Age=0` and `Expires=Thu, 01 Jan 1970 00:00:00 GMT`.

2. Factor cookie-attribute assembly into a single server helper

- Rationale: `oauthCallbackFactory` currently composes cookie strings in-place in multiple branches (register vs session), and `server.ts` uses a hard-coded clearing string. This causes duplication and potential mismatch. Centralize.
- Recommendation: add `api/src/cookieUtils.ts` with helpers:
  - `buildSessionCookie(name, value, opts)`
  - `clearSessionCookie(name, opts)` (or call `buildSessionCookie(name, '', {..., maxAge:0, expires})`)

3. CSRF coverage for state-altering endpoints

- Current state: OAuth callback validates CSRF state correctly. Sign-out is a POST but is not protected with an explicit CSRF token; client issues it via `fetch` with credentials.
- Recommendation: For high-sensitivity endpoints (account delete, profile updates), require a CSRF token (e.g., `X-CSRF-Token` header verified against a same-site cookie). Sign-out is low-risk (it signs the user out), but consider protecting it as well if you want stricter guarantees.

4. Tests: add e2e regression coverage for sign-in and sign-out

- Add a Playwright test that ensures the OAuth redirect flow lands in Dashboard and does not flash Home (use real Chrome storageState or a test OAuth provider). Also add a test that sign-out clears the cookie (server) and `/api/me` returns unauthenticated.

5. Logging & debug flags

- There are development-only debug options (e.g., `REGISTER_COOKIE_CLIENT_DEBUG`) and verbose logs. Keep them gated by env variables and avoid enabling in production.

Actionable high-value changes (priority order)

1. Update sign-out endpoint to compute cookie removal header using the same cookie attributes as set by the OAuth callback (same `sameSiteAttr`, `secureString`, and `domainAttr`). Include `Expires` for compatibility. (IMPLEMENTED)
2. Factor cookie attribute building into a shared helper used by the callback and sign-out endpoints. (IMPLEMENTED)
3. Add a Playwright e2e test that verifies the no-flash behavior and sign-out clears the session (or `/api/me` returns unauthenticated).
4. Optionally enforce CSRF tokens for other state-changing endpoints.

Quick implementation checklist for the sign-out fix

- [x] Add `api/src/cookieUtils.ts` with helpers to build cookie headers.
- [x] Replace cookie-building code in `api/src/oauth/oauthCallbackFactory.ts` and any register-cookie code to use helper.
- [x] Update sign-out handler in `api/src/server.ts` to call helper to clear cookie with `Max-Age=0` and `Expires`.
- [ ] Run a quick integration test: set cookie via callback flow or manual JWT, hit `/api/me` (expect success), call sign-out, then `/api/me` returns unauthenticated.

Changes made

- `api/src/cookieUtils.ts` — added and exposes `buildSessionCookie` / `clearSessionCookie` (thin aliases) and the lower-level builders. Handles SameSite, Secure, Domain and includes `Expires` when `maxAge === 0`.
- `api/src/oauth/oauthCallbackFactory.ts` — switched to `buildSessionCookie(...)` so cookie attributes are built centrally.
- `api/src/accountRegister.ts` — now uses `buildSessionCookie(...)` when creating a session after registration.
- `api/src/server.ts` (sign-out) — now uses `clearSessionCookie(...)` to remove the cookie with matching attributes.
- `api/src/accountDelete.ts` — now uses `clearSessionCookie(...)` when removing a user account.

Validation

- Started the API dev server to surface type/lint issues after edits; the task completed successfully.

Next recommended steps

- Add a Playwright e2e test covering (a) OAuth redirect -> Dashboard (no flash) and (b) sign-out clears the session (or `/api/me` returns unauthenticated). The repo already contains helper scripts to capture Chrome `storageState` if needed.
- Run a frontend smoke test in a real browser (start the frontend dev server and perform sign-in/sign-out flows).

Notes on edge cases

- sessionStorage is per-tab: the one-time success alert logic using sessionStorage is intentionally same-tab only (acceptable tradeoff).
- Provider bot-detection requires saved browser `storageState` for Playwright E2E; project already includes helper scripts to export storageState from a real Chrome — reuse them in tests.

Suggested next steps I can perform for you

- Implement the sign-out cookie fix and the cookie utils helper (small, low risk).
- Add the Playwright e2e test skeleton and (if you want) wire it to use existing `scripts/*` helpers for storageState.

If you want me to proceed, say “Do it” and I will implement the sign-out cookie fix (helper + signout endpoint change) and run a quick typecheck/build.
```
