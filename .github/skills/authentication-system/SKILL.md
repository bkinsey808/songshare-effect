---
name: authentication-system
description: Dual JWT authentication system (visitor + user tokens) with Supabase. Use when implementing auth flows, token management, client-side token selection/caching, or working with auth state in React components.
compatibility: Supabase, Node.js 20+, React 18+
metadata:
  author: bkinsey808
  version: "1.1"
---

# Authentication System Skill

## Use When

Use this skill when:
- Implementing sign-in/sign-out flows or auth-state driven UI behavior.
- Editing token selection, caching, or Supabase auth client wiring in `react/src/lib/supabase/`.

Execution workflow:
1. Preserve dual-token behavior (visitor + user JWT) and token selection semantics.
2. Reuse existing token/cache utilities before introducing new auth helpers.
3. Verify auth edge cases (no user session, stale token, sign-out transitions).
4. Validate with targeted tests first, then `npm run lint`.

Output requirements:
- State which auth paths were changed (visitor token, user token, selection/caching).
- Note any behavior changes affecting RLS or realtime access.

## What This Skill Does

Covers SongShare's dual authentication architecture:

- **Two-token system** — visitor tokens (anonymous) and user tokens (authenticated)
- **Single Supabase auth user** — the "visitor" account provides the transport layer for Realtime
- **In-memory token caching** — `react/src/lib/supabase/token/token-cache.ts`
- **Automatic token selection** — `getSupabaseAuthToken` resolves the right token without hooks

RLS policies and Realtime subscription patterns are in [realtime-rls-architecture skill](../realtime-rls-architecture/SKILL.md).

## Common Scenarios

- Implementing OAuth sign-in flows (Google, GitHub)
- Fetching or managing authentication tokens
- Implementing user sign-out or token refresh
- Writing components that check authentication state

---

## Key Architecture

### Two-Token System

**Visitor Token** (anonymous):

- JWT `app_metadata: { visitor_id: "uuid" }`
- Read-only access to `*_public` tables

**User Token** (authenticated):

- JWT `app_metadata: { visitor_id: "uuid", user: { user_id: "app-uuid" } }`
- Full CRUD on user's own data

Both tokens are issued against a single shared "visitor" Supabase auth account so that Realtime's WebSocket requirement (must have a valid JWT) is always satisfied.

---

## Key Source Files

| Purpose                          | File                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| Select token for Supabase client | `react/src/lib/supabase/auth-token/getSupabaseAuthToken.ts`          |
| Fetch visitor token from API     | `react/src/lib/supabase/auth-token/getSupabaseClientToken.ts`        |
| Fetch user token from API        | `react/src/lib/supabase/auth-token/fetchSupabaseUserTokenFromApi.ts` |
| In-memory token cache            | `react/src/lib/supabase/token/token-cache.ts`                        |
| Authenticated Supabase client    | `react/src/lib/supabase/client/getSupabaseClientWithAuth.ts`         |
| Auth slice (Zustand)             | `react/src/auth/slice/createAuthSlice.ts`                            |
| Auth state types                 | `react/src/auth/slice/auth-slice.types.ts`                           |
| Server: visitor token            | `api/src/supabase/getSupabaseClientToken.ts`                         |
| Server: user token               | `api/src/user-session/getUserToken.ts`                               |

---

## Token Selection (`getSupabaseAuthToken`)

`getSupabaseAuthToken` is a plain async function — **not** a hook. It never calls `useAppStore` directly. It works in three steps:

```typescript
// react/src/lib/supabase/auth-token/getSupabaseAuthToken.ts (simplified)
export default async function getSupabaseAuthToken(): Promise<string | undefined> {
  // 1. Return cached user token if still valid
  const userToken = getCachedUserToken();
  if (userToken !== undefined) return userToken;

  // 2. Try to fetch fresh user token from API (deduplicated in-flight)
  const fetchedUserToken = await fetchSupabaseUserTokenFromApi();
  if (fetchedUserToken !== undefined) return fetchedUserToken;

  // 3. Fall back to visitor (client) token
  return getSupabaseClientToken();
}
```

### Authenticated Supabase Client

Always use the helper — never construct a bare client with the anon key:

```typescript
// ✅ GOOD — token is set on the client
const client = await getSupabaseClientWithAuth();
const { data } = await client.from("song_library").select();

// ❌ BAD — no auth token, RLS will block everything
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## Token Caching

Tokens are cached in memory (never localStorage) in `token-cache.ts`. Export functions:

- `getCachedUserToken()` — returns user token if present and not near-expiry (5 min buffer)
- `cacheUserToken(token, expiryMs)` — store user token with expiry

---

## Auth State in React

```typescript
import useAppStore from "@/react/app/useAppStore";

function MyComponent(): ReactElement {
  const isSignedIn = useAppStore((state) => state.isSignedIn);

  if (isSignedIn) return <p>Welcome back!</p>;
  return <p>Sign in to access your library</p>;
}
```

### Sign In

`signIn` is called from the auth slice with the decoded `UserSessionData`:

```typescript
const signIn = useAppStore((state) => state.signIn);

// signIn receives UserSessionData from the server session response
signIn(userSessionData);
// Internally stores isSignedIn = true and triggers user token fetch
```

### Sign Out

```typescript
const setIsSignedIn = useAppStore((state) => state.setIsSignedIn);
setIsSignedIn(false); // Clears state; next Supabase call falls back to visitor token
```

---

## Server-Side Token Generation

### Visitor Token (`api/src/supabase/getSupabaseClientToken.ts`)

Signs in as the shared visitor account and returns the JWT. If `visitor_id` is missing from metadata, sets it and re-signs.

### User Token (`api/src/user-session/getUserToken.ts`)

Signs in as the visitor account, updates `app_metadata` with `{ user: { user_id } }`, and re-signs to embed the user context into the JWT.

---

## Common Pitfalls

### ❌ Storing tokens in localStorage

```typescript
localStorage.setItem("token", token); // XSS vulnerability
```

Use in-memory cache only — the token cache does this correctly.

### ❌ Using hook inside a token utility function

```typescript
// WRONG — useAppStore cannot be called outside a React component/hook
export async function getToken() {
  const isSignedIn = useAppStore((state) => state.isSignedIn); // ❌
}
```

Check the token cache or fetch from the API directly instead.

---

## References

- Full auth guide: [docs/authentication-system.md](../../../docs/authentication-system.md)
- RLS policy templates: [realtime-rls-architecture skill](../realtime-rls-architecture/SKILL.md)
- Realtime debugging: [realtime-rls-debugging skill](../realtime-rls-debugging/SKILL.md)

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If changes touch React Supabase client selection, also load `supabase-client-patterns`.
- If the task includes RLS/realtime policy behavior, also load `realtime-rls-architecture`.
