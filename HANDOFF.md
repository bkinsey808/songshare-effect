# Supabase JWT Key Rotation Fix — Handoff Document

## Problem Summary

Supabase rotated the JWT signing key on the **BardoShare staging** project from Legacy HS256 → ECC P-256 (ES256). After rotation:

- **GoTrue** (the Supabase auth service) now **issues ES256 tokens**.
- **PostgREST** has ALSO been updated — it now **accepts ES256 tokens and rejects HS256**.
- **Supabase Realtime** — behavior unknown; may still use HS256 OR may also accept ES256.

## Confirmed Facts (from direct curl tests, 2026-03-22)

```bash
# Visitor sign-in → GoTrue issues ES256 token
curl POST $SUPABASE_URL/auth/v1/token → alg: ES256

# ES256 token → PostgREST returns 200 ✓
curl -H "Authorization: Bearer {ES256_token}" $SUPABASE_URL/rest/v1/song_library → 200

# HS256 token → PostgREST returns 401 ✗
curl -H "Authorization: Bearer {HS256_token}" $SUPABASE_URL/rest/v1/song_library → 401
# Error: {"code":"PGRST301","details":"None of the keys was able to decode the JWT","hint":null,"message":"No suitable key or wrong key type"}
```

**PostgREST only accepts ES256 tokens** (uses the new ECC P-256 key for verification). HS256 tokens are rejected.

## Key Env Vars

| Name                         | Purpose                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `SUPABASE_LEGACY_JWT_SECRET` | Base64-encoded HS256 secret; still used by Supabase **Realtime** WebSocket auth (unconfirmed but suspected) |
| `SUPABASE_JWT_SECRET`        | Legacy name in keyring — probably the old HS256 secret (may be same value)                                  |

**Both are in the keyring** under `songshare-staging` and in `config/worker-vars.list`.
**`SUPABASE_LEGACY_JWT_SECRET` has been pushed to the Cloudflare Worker secret store** (via `wrangler secret put`).

## Current Code State (as of 2026-03-22 ~23:00 UTC)

The code was simplified from a "dual-token" approach back to a single-token approach, BUT it was simplified to use **HS256**, which is now **wrong** because PostgREST rejects HS256.

### Files that need to be changed

**The core issue:** `getSupabaseClientToken.ts` and `getUserToken.ts` both re-sign tokens with HS256 when `SUPABASE_LEGACY_JWT_SECRET` is set. But PostgREST only accepts ES256. This causes the song library to return 401 → empty library → Edit button never visible → E2E test fails.

### Two possible correct solutions

#### Option A: ES256 for everything (simpler — try first)

Use raw GoTrue ES256 token for both PostgREST AND Realtime. If Realtime has also been updated to accept ES256 (like PostgREST was), this works with zero custom JWT signing.

**Changes needed:**

- `api/src/supabase/getSupabaseClientToken.ts` — remove the HS256 re-signing block; always `return data.session.access_token`
- `api/src/user-session/getUserToken.ts` — remove the HS256 re-signing block; always `return { access_token: refreshData.session.access_token, ... }`
- `api/src/env.ts` — can remove `SUPABASE_LEGACY_JWT_SECRET` (optional)
- The `signSupabaseJwtWithLegacySecret.ts` file can be deleted (optional)

**Test:** Deploy and run `npm run test:e2e:staging -- --project=chromium --grep "song-tagging"`. If no `CHANNEL_ERROR`, Realtime accepts ES256 and we're done.

#### Option B: ES256 for PostgREST + HS256 for Realtime (dual-token)

If Option A shows `CHANNEL_ERROR` in Realtime (meaning Realtime still uses HS256 for verification), we need the dual-token approach that was built earlier and then reverted.

**Changes needed:**

- `api/src/supabase/getSupabaseClientToken.ts` — return `{ accessToken: ES256, realtimeToken: HS256 }`
- `api/src/supabase/getSupabaseClientTokenHandler.ts` — expose `realtime_token` in the response
- `api/src/user-session/getUserToken.ts` — return `{ access_token: ES256, realtime_token: HS256 }`
- React token cache (`token-cache.ts`) — cache both tokens separately
- React Supabase client (`getSupabaseClient.ts`) — call `setAuth(realtimeToken)` for Realtime but keep `Authorization: Bearer {accessToken}` for PostgREST
- `useItemTagsDisplay.ts` — use `getCachedRealtimeToken()` to call `setAuth` before subscribing

The dual-token approach was previously implemented (and mostly complete) before being reverted. The git history (`git log --oneline`) should show the commit before the revert.

## Critical Implementation Detail (for Option B / HS256 signing)

The legacy JWT secret is **base64-encoded**. It must be decoded to **raw bytes** before using as the HMAC key:

```typescript
// signSupabaseJwtWithLegacySecret.ts
const keyBytes = Uint8Array.from(atob(legacyBase64Secret), (char) => char.charCodeAt(0));
const cryptoKey = await crypto.subtle.importKey(
	"raw",
	keyBytes,
	{ name: "HMAC", hash: "SHA-256" },
	false,
	["sign"],
);
return sign(payload, cryptoKey, "HS256");
```

Using the string directly as UTF-8 (the default Hono behavior) produces tokens that Supabase infrastructure **rejects**.

## Architecture Note

The app uses a **single Supabase visitor user** for all server-side Supabase operations. User identity is injected via `app_metadata`:

- `visitor_id`: the visitor user's own Supabase UUID (set once)
- `user.user_id`: the app user's ID (set per authenticated request in `getUserToken.ts`)
- `userPublic`: the user's public profile (set per authenticated request)

RLS policies read these `app_metadata` claims to authorize row-level access. The `sub` (JWT subject) is always the visitor user's Supabase UUID — NOT the app user's ID.

## Environment Setup

The legacy JWT secret for BardoShare staging is stored in the system keyring:

```
keyring set songshare-staging SUPABASE_LEGACY_JWT_SECRET
```

Value: `tKHa2gMeyqBRpzu6MTKHg1AZzAUaW8vQItYzdbkU5DEntW3hdkgS7rFWzfp0J/JoEiFRwpKTk5899VaNS9LIZA==`

**Already pushed to Cloudflare Worker** via:

```bash
cd api && keyring get songshare-staging SUPABASE_LEGACY_JWT_SECRET | npx wrangler secret put SUPABASE_LEGACY_JWT_SECRET --env staging --config wrangler.staging.toml
```

Note: `npm run deploy:staging` does NOT push secrets. Secrets must be pushed separately with the above command (or by running `bun run scripts/env/set-cloudflare-secrets.bun.ts --env staging`).

## E2E Test

```bash
# Runs only the song-tagging realtime test
npm run test:e2e:staging -- --project=chromium --grep "song-tagging"

# With tracing for diagnosis
npm run test:e2e:staging -- --project=chromium --grep "song-tagging" --trace on --retries 1
```

Sessions must be for staging domain (`staging.bardoshare.com`). If they're missing or stale, recreate:

```bash
npm run e2e:create-session:staging-url
npm run e2e:create-session:staging-url:user2
```

## Current Test Failure

```
Error: expect(locator).toBeVisible() failed
Locator: locator('div').filter({ has: locator('a[href*="e2e-test-song"]') }).first().getByRole('button', { name: 'Edit' })
Timeout: 75000ms
at navigateToSongEditPage (e2e/specs/tagging/song-tagging.spec.ts:62:24)
```

The "Edit" button on a song card only appears when `currentUserId === entry.song_owner_id` (from the Supabase `song_library` + `song_public` query). This query fails with 401 because the Worker is currently returning HS256 tokens that PostgREST rejects.

**Root cause:** `getSupabaseClientToken.ts` and `getUserToken.ts` re-sign with HS256 when `SUPABASE_LEGACY_JWT_SECRET` is set. PostgREST only accepts ES256 (ECC P-256), not HS256.

**Fix:** Try Option A first (remove HS256 re-signing, use ES256 for everything).
