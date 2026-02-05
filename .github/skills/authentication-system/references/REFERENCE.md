# Authentication System Reference

Technical reference for JWT tokens, RLS policies, Supabase configuration, and Realtime subscriptions.

## JWT Structure & Claims

### Visitor Token Structure

```json
{
  "iss": "https://your-project.supabase.co/auth/v1",
  "sub": "visitor-user-uuid",
  "aud": "authenticated",
  "exp": 1707043200,
  "iat": 1707039600,
  "email": "visitor@yourdomain.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "visitor_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "user_metadata": {
    "visitor_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

### User Token Structure

```json
{
  "iss": "https://your-project.supabase.co/auth/v1",
  "sub": "visitor-user-uuid",
  "aud": "authenticated",
  "exp": 1707043200,
  "iat": 1707039600,
  "email": "visitor@yourdomain.com",
  "app_metadata": {
    "provider": "email",
    "visitor_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user": {
      "user_id": "app-user-uuid-12345"
    }
  },
  "user_metadata": {
    "visitor_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user": {
      "user_id": "app-user-uuid-12345"
    }
  }
}
```

## Decoding & Inspecting Tokens

### Client-Side Decode

```typescript
/**
 * Decode a JWT token to inspect its claims without verification.
 *
 * @param token - The JWT token string to decode
 * @returns - Parsed JWT payload object with all claims
 */
function decodeJWT(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const payload = parts[1];
  // Add padding if needed
  const padded = payload + "=".repeat(4 - (payload.length % 4));

  return JSON.parse(atob(padded));
}

// Usage
const token = await getSupabaseAuthToken();
const claims = decodeJWT(token);

console.log("JWT Claims:", claims);
console.log("Visitor ID:", claims.app_metadata.visitor_id);
console.log("User ID:", claims.app_metadata.user?.user_id);
```

### Server-Side Decode (Node.js)

```typescript
import { jwtVerify } from "@supabase/supabase-js";

const secret = process.env.SUPABASE_JWT_SECRET;
const token = request.headers.get("Authorization")?.split(" ")[1];

if (!token) throw new Error("Missing token");

const { payload } = await jwtVerify(token, secret);
console.log("Verified claims:", payload);
```

## RLS Policy Syntax

### Public Access (Visitor + User)

```sql
-- Allow both visitors and authenticated users to read public data
CREATE POLICY "song_public_read" ON song_public FOR SELECT TO authenticated
USING (
  -- Visitor access (has visitor_id in app_metadata)
  (auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
  OR
  -- User access (has user.user_id in app_metadata)
  (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL
);
```

### User-Only Access (Private Data)

```sql
-- Allow only authenticated app users to access their own data
CREATE POLICY "song_private_read_own" ON song FOR SELECT TO authenticated
USING (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
);

CREATE POLICY "song_private_insert_own" ON song FOR INSERT TO authenticated
WITH CHECK (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
);

CREATE POLICY "song_private_update_own" ON song FOR UPDATE TO authenticated
USING (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
)
WITH CHECK (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
);

CREATE POLICY "song_private_delete_own" ON song FOR DELETE TO authenticated
USING (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
);
```

### Visitor Check Pattern

```sql
-- Check if user is a visitor (no user context)
CREATE POLICY "visitor_only" ON visitor_content FOR SELECT TO authenticated
USING (
  -- Only if NO user_id is present (visitor token)
  (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NULL
  AND
  (auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
);
```

## Token Generation Implementation

### Server-Side Visitor Token

```typescript
// api/src/supabase/getSupabaseClientToken.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Generate a JWT token for anonymous visitor access to Supabase.
 *
 * @returns - JWT access token with visitor metadata
 */
export async function getSupabaseClientToken(): Promise<string> {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Sign in as visitor
  const { data, error } = await client.auth.signInWithPassword({
    email: SUPABASE_VISITOR_EMAIL,
    password: SUPABASE_VISITOR_PASSWORD,
  });

  if (error) throw new Error(`Visitor auth failed: ${error.message}`);

  // Check and ensure visitor_id in metadata
  if (!data.user.user_metadata?.visitor_id) {
    const newVisitorId = crypto.randomUUID();

    await client.auth.updateUser({
      data: { visitor_id: newVisitorId },
    });

    // Re-sign to get fresh JWT with updated metadata
    const { data: fresh, error: signError } = await client.auth.signInWithPassword({
      email: SUPABASE_VISITOR_EMAIL,
      password: SUPABASE_VISITOR_PASSWORD,
    });

    if (signError) throw signError;
    return fresh.session.access_token;
  }

  return data.session.access_token;
}
```

### Server-Side User Token

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

  // Sign in as visitor first
  let { data, error } = await client.auth.signInWithPassword({
    email: SUPABASE_VISITOR_EMAIL,
    password: SUPABASE_VISITOR_PASSWORD,
  });

  if (error) throw new Error(`Visitor auth failed: ${error.message}`);

  // Get existing visitor_id or create new one
  const visitorId = data.user.user_metadata?.visitor_id || crypto.randomUUID();

  // Update metadata with user context
  const { error: updateError } = await client.auth.updateUser({
    data: {
      visitor_id: visitorId,
      user: { user_id: userId },
    },
  });

  if (updateError) throw new Error(`Metadata update failed: ${updateError.message}`);

  // Re-sign to get fresh JWT with both visitor_id and user context
  const { data: fresh, error: signError } = await client.auth.signInWithPassword({
    email: SUPABASE_VISITOR_EMAIL,
    password: SUPABASE_VISITOR_PASSWORD,
  });

  if (signError) throw signError;
  return fresh.session.access_token;
}
```

## Client-Side Token Management

### Token Selection Logic

```typescript
// react/src/supabase/getSupabaseAuthToken.ts
import { useAppStore } from "@/react/app/useAppStore";

/**
 * Select and fetch the appropriate auth token based on user sign-in state.
 *
 * @returns - JWT access token for current auth context (user or visitor), or undefined on error
 */
export async function getSupabaseAuthToken(): Promise<string | undefined> {
  const isSignedIn = useAppStore((state) => state.auth.isSignedIn);

  try {
    if (isSignedIn) {
      // Fetch user token
      const response = await fetch("/api/auth/user/token");
      if (!response.ok) throw new Error("Failed to fetch user token");

      const { access_token } = await response.json();
      return access_token;
    } else {
      // Fetch visitor token
      const response = await fetch("/api/auth/visitor");
      if (!response.ok) throw new Error("Failed to fetch visitor token");

      const { access_token } = await response.json();
      return access_token;
    }
  } catch (error) {
    console.error("[getSupabaseAuthToken] Error:", error);
    return undefined;
  }
}
```

### In-Memory Token Cache

```typescript
// Cache tokens to avoid redundant fetches
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Fetch and cache the auth token, returning cached token if still valid.
 *
 * @returns - Valid JWT access token, refreshing if expired
 */
export async function getCachedToken(): Promise<string> {
  const now = Date.now() / 1000; // Current time in seconds

  // Return cached token if still valid (refresh 5 minutes before expiry)
  if (cachedToken && tokenExpiresAt > now + 300) {
    return cachedToken;
  }

  // Fetch fresh token
  const token = await getSupabaseAuthToken();
  if (!token) throw new Error("Failed to get authentication token");

  // Decode expiry time from token
  const payload = JSON.parse(atob(token.split(".")[1]));

  cachedToken = token;
  tokenExpiresAt = payload.exp;

  return token;
}
```

## Supabase Client Configuration

### With Automatic Token

```typescript
// react/src/supabase/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with the current auth token automatically configured.
 *
 * @returns - Configured Supabase client with auth token, or undefined if no token available
 */
export async function getSupabaseClientWithAuth() {
  const token = await getCachedToken();

  if (!token) {
    console.warn("[getSupabaseClientWithAuth] No token available");
    return undefined;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Set the token for all future requests
  client.realtime.setAuth(token);

  return client;
}
```

## Realtime Subscriptions with RLS

### Subscribe to Changes

```typescript
const client = await getSupabaseClientWithAuth();

const channel = client
  .channel("song_library_changes", {
    config: {
      broadcast: { self: true },
      presence: { key: "user" },
      postgres_changes: {
        event: "*", // All events: INSERT, UPDATE, DELETE
        schema: "public",
        table: "song_library",
        // RLS automatically filters based on JWT
      },
    },
  })
  .on("postgres_changes", (payload) => {
    console.log("[Realtime] Change:", payload);
    // RLS has already filtered this - user only sees their own data
  })
  .subscribe((status) => {
    console.log("[Realtime] Subscription status:", status);
  });

// Cleanup
return () => {
  channel.unsubscribe();
};
```

### Presence Tracking

```typescript
const channel = client
  .channel("user_presence")
  .on("presence", { event: "sync" }, () => {
    const presenceState = channel.presenceState() as Record<string, unknown[]>;
    console.log("Active users:", presenceState);
  })
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        user_id: userId,
        online_at: new Date(),
      });
    }
  });
```

## OAuth Configuration

### Google OAuth Redirect URIs

```env
# In Google Cloud Console, register both:
# For development with HTTP:
http://localhost:5173/api/oauth/callback

# For development with HTTPS (mkcert):
https://localhost:5173/api/oauth/callback

# For production:
https://yourdomain.com/api/oauth/callback
```

### Supabase OAuth Provider Setup

```sql
-- Enable Google provider in Supabase Auth
-- Dashboard: Authentication > Providers > Google
-- Set: Client ID and Client Secret from Google Cloud Console

-- Redirect URL: https://your-project.supabase.co/auth/v1/callback
```

## Debugging & Troubleshooting

### Token Validation Script

```typescript
// scripts/validate-token.ts
import Bun from "bun";

const token = process.argv[2];
if (!token) {
  console.error("Usage: bun validate-token.ts <token>");
  process.exit(1);
}

const parts = token.split(".");
if (parts.length !== 3) {
  console.error("Invalid JWT format");
  process.exit(1);
}

const header = JSON.parse(atob(parts[0]));
const payload = JSON.parse(atob(parts[1]));

console.log("Header:", JSON.stringify(header, null, 2));
console.log("\nPayload:", JSON.stringify(payload, null, 2));
console.log("\nExpires at:", new Date(payload.exp * 1000).toISOString());
console.log("Is valid now:", payload.exp > Date.now() / 1000);
```

### RLS Testing Query

```sql
-- Test RLS enforcement
-- Sign in as visitor (no user context)
SELECT * FROM song_library;  -- Should return public data

-- Switch to user token (with user_id in metadata)
SELECT * FROM song_library;  -- Should return only user's songs

-- Check JWT claims in query
SELECT auth.jwt() as current_claims;
```

## References

- [Supabase JWT Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
