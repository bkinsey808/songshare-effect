# Supabase Realtime + RLS Security Architecture & Debugging Skill

**Purpose**: Understand the complete RLS security architecture for `event_public` table and debug Supabase Realtime subscription issues where updates are not being delivered to connected clients.

**Status**: ✅ **PRODUCTION READY** - RLS is re-enabled with comprehensive security policies (migration `20260220000011_re_enable_rls_on_event_public.sql`)

**When to use this skill:**

- Understanding how Realtime + RLS work together for real-time sync
- Debugging Realtime subscriptions that connect (SUBSCRIBED status) but no UPDATE messages arrive
- Verifying changes persist to database (API calls succeed) but don't broadcast to Realtime
- Troubleshooting multi-window/multi-tab sync issues
- Ensuring RLS policies properly protect row-level access
- Debugging RLS policy logic for update/delete operations

---

## Quick SQL Debugging Cheat Sheet

**Use these copy-paste queries immediately when troubleshooting:**

1. **Check if RLS is enabled:**

   ```sql
   SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'event_public';
   -- Should show: relrowsecurity = true
   ```

2. **List all RLS policies on the table:**

   ```sql
   SELECT policyname, permissive, roles, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'event_public'
   ORDER BY policyname;
   ```

3. **Test if a JWT passes the RLS policy:**

   ```sql
   SET ROLE authenticated;
   SET app.jwt = '[paste-your-jwt-token-here]';

   SELECT * FROM public.event_public
   WHERE event_id = '[your-test-event-id]';
   -- If returns 0 rows: RLS is blocking this user
   -- If returns rows: User has access
   ```

4. **Verify Realtime is enabled on the table:**

   ```sql
   SELECT schemaname, tablename
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   -- event_public should be in the list
   ```

5. **Check JWT structure (in browser DevTools):**
   ```javascript
   // Paste in browser console with your token
   const parts = token.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log(payload);
   // Should show app_metadata.visitor_id OR app_metadata.user.user_id
   ```

---

## Current Security Architecture (✅ Verified Production Ready)

### RLS Status on `event_public`

- ✅ **RLS ENABLED** on `event_public` table
- ✅ **Realtime enabled** for real-time subscriptions and message delivery
- ✅ **All required policies** in place (SELECT, UPDATE, DELETE)
- ✅ **JWT validation** built into all policies for custom token structure

### Access Control Layers

**Layer 1: Database RLS Policies (Primary Protection)**

READ policies for `event_public`:

1. **Public events**: `is_public = true` + valid JWT (visitor_id OR user_id)
2. **Owner access**: `owner_id = current_user_id` from JWT
3. **Participant access**: User exists in `event_user` table with `status IN ('invited', 'joined', 'left')`

UPDATE policies for `event_public`:

1. **Owner updates**: `owner_id = current_user_id` from JWT
2. **Admin updates**: User exists in `event_user` with role IN (`'event_admin'`, `'event_playlist_admin'`) and `status = 'joined'`

DELETE policies for `event_public`:

1. **Owner deletion**: Only `owner_id = current_user_id` can delete

**Layer 2: API Validation (Secondary Protection)**

- API uses Supabase service role (bypasses RLS)
- Provides additional validation before database changes
- Acts as fallback when RLS is enabled

**Layer 3: Frontend Notifications**

- React UI validates permissions before showing edit/delete options
- Realtime subscriptions deliver updates respecting RLS policies

### How Realtime Respects RLS

When a user updates `event_public.active_song_id`:

1. API call persists change using service role (bypasses RLS)
2. Supabase Realtime broadcasts UPDATE to ALL connected clients
3. Each client's Realtime subscription is filtered by RLS policies:
   - Only clients with READ permission receive the UPDATE message
   - Clients without permission silently don't receive it
   - **Note**: This is silent—no error is reported to the client

---

## Problem Patterns

### Pattern 1: Subscription Connects But No Updates Arrive

```
✅ Realtime subscribed to event: [event-id] - Ready to receive updates
❌ 📨 event_public UPDATE received: [Never fires]
```

**Database confirms changes are being saved, but Realtime client never receives the UPDATE message.**

### Pattern 2: Empty Filter Parsing Error

```
❌ Error parsing `filter` params: [""]
```

**A Realtime listener has an empty `filter: ""` parameter, which Supabase cannot parse.**

### Pattern 3: Silent JWT Rejection

```
✅ Subscription reaches SUBSCRIBED status
✅ API calls persist changes
❌ Realtime delivers nothing
```

**The JWT token may not be recognized as `authenticated`, causing RLS policies to silently filter out all updates.**

---

## Root Causes Checklist

When Realtime stops delivering updates, investigate these layers in order:

### Layer 1: Realtime Configuration

- [ ] Is Realtime **enabled on the table**? (Check: `Database > Replication` in Supabase dashboard)
  - Query to verify:
    ```sql
    SELECT schemaname, tablename
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    ORDER BY schemaname, tablename;
    ```

### Layer 2: Subscription Setup

- [ ] Are all filter parameters **valid strings** (not empty)?
  - ❌ Bad: `filter: ""`
  - ✅ Good: `filter: "event_id=eq.${eventId}"` or omit entirely
- [ ] Is the `event` type correct? (e.g., `"UPDATE"`, `"INSERT"`, `"*"`)
- [ ] Is the channel actually calling `.subscribe()`?

### Layer 3: Authentication

- [ ] Is the client JWT token **properly signed**?
- [ ] Does the JWT have standard structure: `header.payload.signature`?
- [ ] Is the token being passed correctly to Supabase client?
  - ```ts
    client.realtime.setAuth(supabaseClientToken)
    // AND
    Authorization: `Bearer ${token}`
    ```

### Layer 4: RLS Policies (Current Implementation Verified)

- [ ] Is RLS **ENABLED** on the table?
  - Query to verify:
    ```sql
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname = 'event_public';
    -- Should show: relrowsecurity = true
    ```
- [ ] Do RLS policies **exist and validate JWT**?
  - Query to check all policies:
    ```sql
    SELECT policyname, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_public'
    ORDER BY policyname;
    ```
  - ✅ **Verified in production**:
    - "Allow read access to public events" (validates JWT + is_public)
    - "Allow owner to update own event_public" (validates owner_id from JWT)
    - "Allow event admins to update event_public" (validates role + JWT)
    - "Allow owner to delete own event_public" (validates owner_id from JWT)
    - And 3 additional policies for comprehensive access control

### Layer 5: JWT Structure

- [ ] What **role** does Supabase recognize? (`authenticated` or `anon`)
- [ ] What **structure** does your JWT have?
  - Standard Supabase JWT: `{ sub, aud, exp, iat, ... }`
  - Custom JWT: needs special handling for RLS
- [ ] Are custom JWT claims in the **right path**?
  - ❌ Wrong: `{ user_id: "..." }` (root level)
  - ✅ Right: `{ app_metadata: { user: { user_id: "..." } } }`

---

## Debugging Workflow

### Step 1: Verify Realtime is Enabled on Table

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**If table is NOT in results**: Enable Realtime in Supabase dashboard (`Database > Replication > Toggle table`)

### Step 2: Check for Empty Filters

```bash
grep -r "filter: \"\"" react/src --include="*.ts" --include="*.tsx"
```

**Remove all empty filters.** Supabase cannot parse them.

### Step 3: Add Channel Error Listener

```typescript
channel.on("system", { event: "error" }, (payload: unknown) => {
  if (isRecord(payload) && payload["status"] !== "ok") {
    console.error("Realtime error:", payload);
  }
});
```

This catches parsing errors, RLS rejections, and other issues.

### Step 4: Verify JWT is Recognized as `authenticated`

```typescript
// Log the decoded JWT to check structure
const decoded = jwtDecode(token); // or parse manually
console.log("JWT payload:", decoded);

// Check if Supabase recognizes it as authenticated
const client = createClient(url, key, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
client.realtime.setAuth(token);
```

### Step 5: Test RLS Policy with Direct SQL

```sql
-- Simulate what Realtime sees (authenticated role + jwt)
SET ROLE authenticated;
SET app.jwt = '[your-jwt-token]';

SELECT * FROM public.event_public
WHERE event_id = '[test-id]';
-- If this returns nothing, RLS is blocking it
```

### Step 6: Validate RLS Policy Logic

Check the `qual` column for the policy:

```sql
SELECT policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'event_public'
  AND policyname LIKE '%read%';
```

**Common issues:**

- Missing JWT validation → Add `(auth.jwt() ->> 'sub' IS NOT NULL)` check
- Wrong JWT path → Check your custom JWT structure (see Layer 5 above)
- Logic error → Test policy with `SELECT ... WHERE [policy_condition]`

---

## Solutions for Common Scenarios

### Scenario A: Realtime Enabled, But Getting "Empty Filter" Error

**Root cause**: Listener has `filter: ""` or `filter: undefined`

**Fix**:

```typescript
// ❌ WRONG
channel.on("postgres_changes", {
  event: "UPDATE",
  table: "user_public",
  filter: "",  // Parser error!
}, callback);

// ✅ RIGHT
channel.on("postgres_changes", {
  event: "UPDATE",
  table: "user_public",
  // Omit filter entirely if you want all updates
}, callback);

// ✅ OR with valid filter
channel.on("postgres_changes", {
  event: "UPDATE",
  table: "event_public",
  filter: `event_id=eq.${eventId}`,
}, callback);
```

### Scenario B: Subscription SUBSCRIBED But No Updates

**Root cause**: RLS policy blocks updates silently (most common)

**Diagnosis**:

1. Run SQL test (Step 5 above)
2. If SELECT returns nothing → RLS is blocking
3. Add error listener to see if Realtime reports permission errors
4. **Common issue**: Empty filter string in listener → Remove it

**Fix** (IF NEEDED):
Verify RLS policy validates JWT + includes necessary checks:

```sql
-- Example from current production implementation:
CREATE POLICY "Allow read access to public events"
ON public.event_public
FOR SELECT
TO authenticated
USING (
  is_public = true
  AND (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL)
    OR
    ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)
  )
);
```

For UPDATE policies, ensure owner check:

```sql
-- Example from current production:
CREATE POLICY "Allow owner to update own event_public"
ON public.event_public
FOR UPDATE
USING (owner_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid))
WITH CHECK (owner_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id')::uuid));
```

#### Understanding the JWT Validation Logic

The RLS policy checks **two different JWT paths** because your system supports two authentication types:

```sql
(((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL)
OR
((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)
```

**Why two checks?**

Your JWTs can look like either of these. See [authentication-system skill](../authentication-system/SKILL.md) for complete token generation and structure details.

**Case 1: Visitor Token** (anonymous user)

```json
{
  "app_metadata": {
    "visitor_id": "550e8400-e29b-41d4-a716-446655440000",
    "user": null
  }
}
```

- First condition: `(auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL` ✅ **TRUE**
- Second condition: `(auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL` ❌ FALSE
- Result: `TRUE OR FALSE = TRUE` → Policy allows access ✅

**Case 2: User Token** (registered account)

```json
{
  "app_metadata": {
    "visitor_id": null,
    "user": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

- First condition: `(auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL` ❌ FALSE
- Second condition: `(auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL` ✅ **TRUE**
- Result: `FALSE OR TRUE = TRUE` → Policy allows access ✅

**Case 3: Invalid/Malformed Token** (neither has a valid ID)

```json
{
  "app_metadata": {
    "visitor_id": null,
    "user": null
  }
}
```

- First condition: FALSE (no visitor_id)
- Second condition: FALSE (no user_id)
- Result: `FALSE OR FALSE = FALSE` → Policy **blocks** access ❌

**Why both are needed:**

- Your app has **two auth flows**: visitors (anonymous) and registered users
- Both should access public events
- The OR ensures that **either type** with a valid ID can read public events
- Without the visitor_id check: visitors couldn't see public events
- Without the user_id check: registered users couldn't see public events
- Without both checks: anyone with a fake/empty JWT could access events

### Scenario C: Updates Work for Some Users, Not Others

**Root cause**: JWT path mismatch for different user types

**Diagnosis**:

1. Decode JWTs from both user types
2. Compare structures
3. Update RLS policy to handle both

**Fix**:

```sql
-- Support multiple JWT structures
CREATE POLICY "Allow read for all authenticated"
ON public.event_public
FOR SELECT
TO authenticated
USING (
  is_public = true
  AND (
    -- Standard Supabase Auth
    auth.uid() IS NOT NULL
    OR
    -- Custom visitor token
    (((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL)
    OR
    -- Custom user token
    ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)
  )
);
```

---

## Verification Checklist

**Current Status** (✅ All verified as of migration `20260220000011`):

- [x] RLS **ENABLED** on `event_public` table
- [x] All **SELECT, UPDATE, DELETE policies** in place
- [x] **JWT validation** in all policies (app_metadata structure)
- [x] Realtime subscriptions work across browser windows
- [x] Multi-window sync tested and working
- [x] 1164+ unit tests passing
- [x] Linting: 0 warnings, 0 errors

**Testing after future RLS changes:**

- [ ] Run lint: `npm run lint`
- [ ] Run tests: `npm run test:unit`
- [ ] Manually test in two browser tabs:
  1. Open event in Tab A
  2. Open same event in Tab B
  3. Change active_song_id in Tab A (debounced 250ms)
  4. Change active_slide_position in Tab A
  5. Verify Tab B receives both updates in real-time
- [ ] Check browser console for errors (no red errors)
- [ ] Check Supabase logs for RLS rejections (`Real-time Monitor`)
- [ ] Verify API calls still succeed with RLS enabled (service role bypasses RLS)

---

## Key Insights

1. **Realtime respects RLS** - Subscriptions succeed, but message delivery is filtered by RLS policies
   - In this project: Realtime works perfectly because RLS policies validate JWT and allow broadcasts
2. **Empty filters break parsing** - Supabase Realtime cannot parse `filter: ""` (always omit or provide valid value)
   - Fixed in this project by removing empty filter from `user_public` listener
3. **JWT validation is critical** - If RLS policy doesn't validate JWT, Realtime filters that user out without error
   - Fixed in this project by adding explicit JWT validation to all policies
4. **RLS policies control both read + broadcast** - A SELECT policy that blocks a user also blocks them from receiving Realtime updates for that row
   - Used intentionally in this project: Private events only broadcast to participants
5. **Test RLS with direct SQL** - The easiest way to debug is to test the RLS policy directly with the JWT in SQL
   - See Step 5 in Debugging Workflow above
6. **Service role bypasses RLS by design** - API uses service role for writes, which is safe when RLS is enabled as a fallback
   - Used in this project: `/api/events/save` updates database, Realtime broadcasts, RLS filters per-user

---

## Production Implementation (SongShare Effect)

### Real-time Sync Flow

1. **User Action**: Changes `active_song_id` in event editor
2. **Frontend**: Posts to `/api/events/save` with debounce (250ms)
3. **API**: Uses service role to update `event_public.active_song_id`
4. **PostgreSQL**: Triggers `update_updated_at_column` trigger
5. **Supabase Realtime**: Broadcasts UPDATE to all subscribed clients
6. **RLS Filter**: Realtime respects RLS—only sends to clients with SELECT permission
   - Event owner ✅
   - Event admins ✅
   - Event participants ✅
   - Non-participants ❌ (silently declined)
7. **Frontend Update**: Zustand store receives update, UI re-renders

### Security Architecture Layers

| Layer                    | Mechanism                                                 | Purpose            | Status         |
| ------------------------ | --------------------------------------------------------- | ------------------ | -------------- |
| **Database (RLS)**       | Row-level policies enforce owner/admin/participant access | Primary protection | ✅ Enabled     |
| **API Validation**       | Service role with backup business logic                   | Secondary check    | ✅ Active      |
| **Frontend Permissions** | Hide edit/delete UI for non-owners                        | UX safety          | ✅ Implemented |
| **Realtime Filtering**   | RLS policies filter broadcast per-user                    | Real-time safety   | ✅ Enabled     |

### Testing Verification

**Two-browser sync test** (the critical validation):

1. Open Event A in Browser 1 (owner)
2. Open Event A in Browser 2 (as guest/participant)
3. Change active_song_id in Browser 1
4. **Within 250ms debounce + Realtime latency**: Browser 2 receives update
5. Change active_slide_position in Browser 1
6. **Within 250ms debounce + Realtime latency**: Browser 2 receives update
7. Open Event B (private that Browser 2 is NOT in) in Browser 2
8. Change active_song_id in Browser 1 (Event B)
9. **Browser 2 does NOT receive Event B update** (RLS blocking) ✅

**Result**: ✅ **Real-time sync with row-level security fully functional**

---

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Row Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security-best-practices)
- [pg_policies System Catalog](https://www.postgresql.org/docs/current/catalog-pg-policy.html)
- **Project Migration**: `supabase/migrations/20260220000011_re_enable_rls_on_event_public.sql`
