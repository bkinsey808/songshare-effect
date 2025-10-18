Login flow for SongShare (client + API)

This document describes the end-to-end login flow used by the SongShare project. It covers the responsibilities of the client and server, the `/api/me` contract, the `justSignedIn` marker used to trigger a forced client refresh after OAuth callbacks, and recommended QA/test steps.

Overview

- Client: React + Zustand. Key pieces:
  - `useEnsureSignedIn` (client hook) — performs a deduped fetch to `/api/me` and updates the Zustand `userSessionData` and `isSignedIn` state.
  - `HydratedLayout` — waits for store hydration and runs `useEnsureSignedIn()` once on first render to set initial auth state.
  - `ProtectedLayout` — guards protected routes, handles `?justSignedIn=1` marker, and calls `useEnsureSignedIn({ force: true })` when redirected from the OAuth server callback.
  - `dashboardPath` — route segment for the dashboard ("dashboard").

- Server: Hono handlers. Key pieces:
  - `/api/oauth/signin` — starts OAuth sign-in by redirecting to provider with CSRF/state.
  - `/api/oauth/callback` — provider redirect target. Exchanges code for user info, creates a server session token, sets an HttpOnly `userSession` cookie, and issues a 303 redirect to the dashboard with `?justSignedIn=1` appended.
  - `/api/me` — validates `userSession` cookie and returns the `UserSessionData` JSON object on success, or a 401/204/clear-cookie when there's no valid session.

Goals and contracts

- Single initial fetch: On first app start (after hydration), the client should call `/api/me` exactly once to determine signed-in state. `HydratedLayout` performs this initial call.

- Forced refresh after OAuth: Since the OAuth callback sets an HttpOnly cookie server-side and then redirects the browser to the dashboard, the client cannot see the cookie until it issues a request. To ensure the client picks up the signed-in session immediately, the server appends `?justSignedIn=1` to the final redirect; `ProtectedLayout` detects this query param and calls `useEnsureSignedIn({ force: true })` to force a fresh `/api/me` fetch.

- Deduping: `useEnsureSignedIn` dedupes in-flight `/api/me` requests using a module-level `globalInFlight` promise so concurrent calls share the same network request.

- Session token: The server stores session data in an HttpOnly `userSession` cookie. The client never reads this cookie directly; it only calls `/api/me` to validate the session and receive the session payload.

Client details

useEnsureSignedIn

- Purpose: ensure client has up-to-date `userSessionData` and `isSignedIn` in Zustand.
- Behavior:
  - Exposes a hook: `useEnsureSignedIn(options?: { force?: boolean })` that triggers a deduped call to `/api/me`.
  - `force: true` instructs the hook to bypass the module-level cache and perform a fresh fetch.
  - Internally it:
    - Creates an AbortController to cancel the request on unmount.
    - Sets `inFlightRef` so the calling component can interrupt/cleanup if necessary.
    - Updates Zustand store with either user session data on success or sets `isSignedIn=false` on 401/204.

HydratedLayout

- Waits for the persisted store (Zustand) to hydrate.
- Calls `useEnsureSignedIn()` once when hydration completes. This is the global initial `/api/me` call that should happen once per full-page load.

ProtectedLayout

- Purpose: guard protected routes and centralize the "just signed in" refresh behavior.
- Behavior:
  - On mount, reads `justSignedIn` from `useSearchParams()`.
  - If `justSignedIn === '1'`, it calls `useEnsureSignedIn({ force: true })` to force a fresh `/api/me` fetch so the client sees the HttpOnly cookie set by the server. After the call is scheduled, it removes the `justSignedIn` param from the URL using `replace()` so refreshes won't retrigger it.
  - If `isSignedIn` is undefined it renders a minimal loading state (avoid flashing the protected UI).
  - If `isSignedIn === false` it redirects to the public home page.
  - If `isSignedIn === true` it renders the protected content (Outlet).

Server details

/POST /api/oauth/callback (server-side)

- Exchanges provider code for user info.
- Creates a server-side session token (JWT), signs it with server-side secret, and sets the `Set-Cookie: userSession=...; HttpOnly; Path=/; SameSite=Lax; Secure` header.
- Returns a 303 redirect to the dashboard path with `?justSignedIn=1` appended. This is crucial so the client knows to force a fresh `/api/me`.

/api/me

- Reads `userSession` cookie.
- Verifies JWT signature and payload using server secret.
- Optionally validates IP match (if enforced).
- Returns 200 + JSON body of `UserSessionData` on success. Returns 401/204 with `Set-Cookie: userSession=; Max-Age=0` when token invalid/expired or secret missing.

Security considerations

- HttpOnly cookie ensures JS on the client cannot read or tamper with the session token. The only way for the client to learn session state is via `/api/me`.

- CSRF protection for OAuth state is handled by the server issuing a signed CSRF cookie during `/api/oauth/signin` and verifying it on callback.

- SameSite: Lax is a pragmatic default for many hosting scenarios. If you deploy across cross-site contexts or if you embed the app in iframes, evaluate `SameSite=None; Secure` carefully.

- The server should set cookie `Secure` in production to avoid leaking cookies over plain HTTP.

Edge cases and behavior

- Race: If the user is already signed in and initial `useEnsureSignedIn()` is running while a `ProtectedLayout` also triggers `force: true`, the module-level dedupe ensures only one network request is made (unless `force: true` is requested which intentionally bypasses any existing cached promise).

- Network failure: `useEnsureSignedIn` catches errors, logs to console, and leaves `isSignedIn` unchanged (or sets false if a 401/204 response is returned). The UI should gracefully handle `isSignedIn === undefined` as "loading".

- Multiple tabs: Each tab performs its own initial `/api/me` on first load after hydration. When one tab signs the user in, other tabs will not automatically pick it up until they either reload or navigate to a protected route that uses `justSignedIn` (or implement a cross-tab broadcast using BroadcastChannel to notify other tabs to re-check).

QA / Testing checklist

- Happy path:
  1. Start with no session cookie.
  2. Click "Sign in with <provider>".
  3. Complete provider consent. Server callback sets cookie and redirects the browser to `/<lang>/dashboard?justSignedIn=1` (where `<lang>` is e.g. `en`).
  4. `ProtectedLayout` sees `justSignedIn` and calls `useEnsureSignedIn({ force: true })`.
  5. `/api/me` returns session payload and Zustand `isSignedIn` becomes `true`. Dashboard UI renders.

- Invalid token flow:
  1. Server sets a malformed token or there's a signature mismatch.
  2. `/api/me` returns 401 and clears the cookie.
  3. Client sets `isSignedIn=false` and the protected route redirects to home.

- Network failure:
  1. Simulate network error on `/api/me` (throttle/block).
  2. Client logs error. The UI shows a loading/unknown signed-in state; protect routes should continue to show a loading state until fetch completes.

- Multiple tabs:
  1. Sign in on one tab. Server sets cookie and redirects that tab to dashboard with `justSignedIn`.
  2. Other tabs remain unaware until reload or navigation to a protected route (or BroadcastChannel is implemented).

Implementation notes for contributors

- When modifying the OAuth callback handler: always include `?justSignedIn=1` in the final redirect to ensure the single-page app aggressively picks up the new HTTP-only session cookie.

- The `useEnsureSignedIn` hook intentionally keeps a module-level dedupe promise to avoid excess `/api/me` requests. Only pass `force: true` when you need to guarantee the request bypasses that dedupe (the OAuth redirect case).

- If you change the `userSession` cookie name or structure, update the `api/me` handler and the server's cookie-setting logic accordingly.

- Consider adding a BroadcastChannel to notify other tabs when a sign-in occurs so multi-tab UX is smoother.

Appendix: Quick contract summary

GET /api/me

- Success (200): JSON UserSessionData
- No session (204/401): No body, `Set-Cookie: userSession=; Max-Age=0` to clear

GET /api/oauth/callback

- On success: 303 redirect to `/<lang>/dashboard?justSignedIn=1` with `Set-Cookie: userSession=...; HttpOnly; Path=/; SameSite=Lax; Secure` (secure in prod)

QA commands

Start dev servers (workspace tasks):

```bash
# Start both servers (runs frontend + api)
./scripts/npm-wrapper.sh run dev:all
```

Manual verification tips

- Use your browser devtools -> Application -> Cookies to verify the `userSession` cookie is present after callback and has HttpOnly set (you won't be able to inspect its value in JS).
- Inspect network tab to confirm the client calls `/api/me` and receives a 200 JSON response after redirect.

Document history

- Created: 2025-10-14
- Author: automated assistant
