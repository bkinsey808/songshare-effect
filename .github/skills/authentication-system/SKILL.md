---
name: authentication-system
description: Dual JWT authentication system (visitor + user tokens) with Supabase and Row Level Security. Use when implementing auth flows, token management, RLS policies, or working with Realtime subscriptions.
license: MIT
compatibility: Supabase, Node.js 20+, React 18+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Authentication System Skill

## What This Skill Does

Implements SongShare's dual authentication architecture:

- **Two-token system** - Visitor tokens (anonymous) and user tokens (authenticated)
- **Single Supabase auth user** - The "visitor" account provides transport layer for Realtime
- **Dynamic JWT metadata** - `app_metadata` updated to include user context for RLS enforcement
- **Automatic token switching** - Client selects appropriate token based on sign-in state
- **Row Level Security** - Database policies check JWT claims to control access
- **In-memory token storage** - Secure client-side token caching (no localStorage)

## When to Use

- Implementing OAuth sign-in flows (Google, GitHub)
- Fetching or managing authentication tokens
- Creating or testing RLS policies
- Debugging Realtime subscription issues
- Implementing user sign-out or token refresh
- Writing components that check authentication state

## Key Architecture

### Two-Token System

**Visitor Token** (anonymous access):

- Uses shared "visitor" Supabase account
- JWT has `app_metadata: { visitor_id: "uuid" }`
- Read-only access to `*_public` tables
- No user data access

**User Token** (authenticated access):

- Uses same "visitor" account with updated metadata
- JWT has `app_metadata: { visitor_id: "uuid", user: { user_id: "app-uuid" } }`
- Full CRUD on user's own data
- Read access to public data

### Why Single Supabase Auth User?

Supabase Realtime requires authenticated JWT tokens (cannot subscribe without authentication). The single visitor account:

1. **Provides transport layer** - Valid JWTs enable WebSocket connections
2. **Enables RLS** - `app_metadata` claims distinguish visitors from users
3. **Simplifies infrastructure** - No need for separate auth systems

### Automatic Token Selection

Client-side flow:

```typescript
// Frontend token selection
const token = await getSupabaseAuthToken();
// If user signed in → fetch from /api/auth/user/token
// If user signed out → fetch from /api/auth/visitor
// Cache tokens until expiry
```

## Implementation Patterns

### 1. Server-Side Token Generation

**Visitor Token** (anonymous):

```typescript
// api/src/supabase/getSupabaseClientToken.ts
/**
 * Generate a JWT token for anonymous visitor access to Supabase.
 *
 * @returns - JWT access token with visitor metadata
 */
export async function getSupabaseClientToken(): Promise<string> {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Sign in as visitor
  const { data, error } = await client.auth.signInWithPassword({
    email: VISITOR_EMAIL,
    password: VISITOR_PASSWORD,
  });

  if (error) throw error;

  // Ensure visitor_id in metadata
  if (!data.user.user_metadata?.visitor_id) {
    await client.auth.updateUser({
      data: { visitor_id: crypto.randomUUID() },
    });

    // Re-sign to get fresh JWT with updated metadata
    const { data: fresh } = await client.auth.signInWithPassword({
      email: VISITOR_EMAIL,
      password: VISITOR_PASSWORD,
    });
    return fresh.session.access_token;
  }

  return data.session.access_token;
}
```

**User Token** (authenticated):

```typescript
// api/src/user-session/getUserToken.ts
/**
 * Generate a JWT token for authenticated user access to Supabase.
 *
 * @param userId - The application user ID to include in token metadata
 * @returns - JWT access token with user context in app_metadata
 */
export async function getUserToken(userId: string): Promise<string> {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Sign in as visitor
  let { data, error } = await client.auth.signInWithPassword({
    email: VISITOR_EMAIL,
    password: VISITOR_PASSWORD,
  });

  if (error) throw error;

  // Update metadata with user context
  const { error: updateError } = await client.auth.updateUser({
    data: {
      visitor_id: data.user.user_metadata?.visitor_id,
      user: { user_id: userId },
    },
  });

  if (updateError) throw updateError;

  // Re-sign to get fresh JWT with user metadata
  const { data: fresh, error: signError } = await client.auth.signInWithPassword(
    { email: VISITOR_EMAIL, password: VISITOR_PASSWORD },
  );

  if (signError) throw signError;
  return fresh.session.access_token;
}
```

### 2. Client-Side Token Management

**Token Selection Logic**:

```typescript
// react/src/supabase/getSupabaseAuthToken.ts
/**
 * Select and fetch the appropriate auth token based on user sign-in state.
 *
 * @returns - JWT access token for current auth context (user or visitor), or undefined on error
 */
export async function getSupabaseAuthToken(): Promise<string | undefined> {
  const isSignedIn = useAppStore((state) => state.auth.isSignedIn);

  if (isSignedIn) {
    // Fetch user token
    const response = await fetch("/api/auth/user/token");
    const { access_token } = await response.json();
    return access_token;
  } else {
    // Fetch visitor token
    const response = await fetch("/api/auth/visitor");
    const { access_token } = await response.json();
    return access_token;
  }
}
```

**In-Memory Token Caching:**

```typescript
// Cache with expiry tracking
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Fetch and cache the auth token, returning cached token if still valid.
 *
 * @returns - Valid JWT access token, refreshing if expired
 */
export async function getCachedToken(): Promise<string> {
  const now = Date.now() / 1000;

  // Return cached token if still valid
  if (cachedToken && tokenExpiresAt > now) {
    return cachedToken;
  }

  // Fetch fresh token
  const token = await getSupabaseAuthToken();
  const payload = JSON.parse(atob(token.split(".")[1]));

  cachedToken = token;
  tokenExpiresAt = payload.exp;

  return token;
}
```

### 3. RLS Policies

**Public table access** (visitors and users):

```sql
CREATE POLICY "song_public_read" ON song_public FOR SELECT TO authenticated
USING (
  -- Visitor access
  (auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
  OR
  -- User access
  (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL
);
```

**Private table access** (users only):

```sql
CREATE POLICY "song_private_read" ON song FOR SELECT TO authenticated
USING (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
);
```

### 4. Realtime Subscriptions

Subscribe to changes (RLS automatically filters):

```typescript
const client = await getSupabaseClientWithAuth();

const channel = client
  .channel("song_changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "song_library" },
    (payload) => {
      console.log("Change:", payload);
    },
  )
  .subscribe();
```

## Common Patterns

### Check Current Auth State

```typescript
import useAppStore from "@/react/app/useAppStore";

function MyComponent(): ReactElement {
  const isSignedIn = useAppStore((state) => state.auth.isSignedIn);

  if (isSignedIn) {
    return <p>Welcome back!</p>;
  }
  return <p>Sign in to access your library</p>;
}
```

### Sign In User

```typescript
const { signIn } = useAppStore((state) => state.auth);

async function handleGoogleSignIn(): Promise<void> {
  try {
    await signIn(); // Fetches and caches user token
    // User token now used for all queries
  } catch (error) {
    console.error("Sign in failed:", error);
  }
}
```

### Sign Out User

```typescript
const { signOut } = useAppStore((state) => state.auth);

function handleSignOut(): void {
  signOut(); // Clears cached token, falls back to visitor
  // Next query uses visitor token
}
```

## Common Pitfalls

### ❌ Storing tokens in localStorage

```typescript
// Bad: XSS vulnerability
localStorage.setItem("token", token);
```

**✅ Better:** Use in-memory storage only, refresh on each page load if needed.

### ❌ Not handling token expiry

```typescript
// Bad: token expires during user session
const token = cachedToken; // May be expired!
```

**✅ Better:** Check expiry before using:

```typescript
const now = Date.now() / 1000;
if (tokenExpiresAt < now) {
  token = await getSupabaseAuthToken(); // Refresh
}
```

### ❌ Wrong RLS policy syntax

```sql
-- Bad: checks JWT without app_metadata
WHERE user_id = auth.uid()
```

**✅ Better:** Extract from app_metadata:

```sql
WHERE user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
```

### ❌ Forgetting to set token on Supabase client

```typescript
// Bad: client uses old/no token
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data } = await client.from("song_library").select();
```

**✅ Better:** Use helper that sets current token:

```typescript
const client = await getSupabaseClientWithAuth();
const { data } = await client.from("song_library").select();
```

## Debugging

### Check Current Token Claims

```typescript
const token = await getSupabaseAuthToken();
const payload = JSON.parse(atob(token.split(".")[1]));
console.log("JWT claims:", payload);
console.log("Visitor ID:", payload.app_metadata.visitor_id);
console.log("User ID:", payload.app_metadata.user?.user_id);
```

### Verify RLS Enforcement

```typescript
const client = await getSupabaseClientWithAuth();

// This should only return user's own data
const { data, error } = await client.from("song").select("*");
console.log("User songs:", data);
console.log("RLS error (if access denied):", error);
```

### Monitor Auth State

```typescript
// Watch sign-in changes
useEffect(() => {
  const unsubscribe = useAppStore.subscribe(
    (state) => state.auth.isSignedIn,
    (isSignedIn) => {
      console.log("[Auth] Signed in:", isSignedIn);
    },
  );
  return unsubscribe;
}, []);
```

## Deep Reference

For detailed technical reference on JWT structures, RLS policy syntax, token generation, client configuration, OAuth setup, and debugging utilities, see [the reference guide](references/REFERENCE.md).

## Validation Commands

```bash
# Verify token structure
node -e "const t = process.argv[1]; console.log(JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString()))" YOUR_TOKEN_HERE

# Run integration tests
npm run test:e2e:dev

# Check Realtime subscriptions
npm run dev:all  # Check browser console for subscription logs
```

## References

- Reference guide: [references/REFERENCE.md](references/REFERENCE.md) - Detailed technical patterns
- Full technical guide: [docs/authentication-system.md](../../../docs/authentication-system.md)
- Realtime & RLS details: [docs/realtime-rls-architecture.md](../../../docs/realtime-rls-architecture.md)
- Token generation: `api/src/supabase/getSupabaseClientToken.ts`, `api/src/user-session/getUserToken.ts`
- Client setup: `react/src/supabase/supabaseClient.ts`
- Auth state: `react/src/auth/auth-slice.ts`
- Supabase docs: https://supabase.com/docs/guides/auth
