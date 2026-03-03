---
name: realtime-rls-debugging
description: Debugging Supabase Realtime subscriptions that connect but deliver no updates, empty filter errors, and RLS silent-rejection diagnosis. Use when Realtime subscriptions are not delivering messages or updates.
license: MIT
compatibility: Supabase Realtime, PostgreSQL RLS
metadata:
  author: bkinsey808
  version: "1.1"
---

# Realtime + RLS Debugging Skill

## When to Use

- Subscription reaches `SUBSCRIBED` but UPDATE/INSERT messages never fire
- `Error parsing filter params: [""]` in Supabase logs
- Changes persist to DB (API calls succeed) but Realtime doesn't broadcast them
- Multi-window sync stops working

---

## Quick SQL Cheat Sheet

```sql
-- 1. Is RLS enabled?
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'event_public';

-- 2. List all policies on the table
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'event_public'
ORDER BY policyname;

-- 3. Simulate what Realtime sees for a JWT
SET ROLE authenticated;
SET app.jwt = '<paste-jwt>';
SELECT * FROM public.event_public WHERE event_id = '<test-id>';
-- 0 rows → RLS is blocking this token

-- 4. Confirm Realtime is publishing this table
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

---

## Debugging Workflow

### Step 1 — Verify Realtime enabled on table

If the table is missing from `pg_publication_tables`, enable it: Supabase dashboard → **Database → Replication → toggle table**.

### Step 2 — Check for empty filters

```bash
grep -r 'filter: ""' react/src --include="*.ts" --include="*.tsx"
```

Supabase cannot parse `filter: ""`. Either remove the key entirely or provide a valid value:

```typescript
// ❌ Filter error
channel.on("postgres_changes", { event: "UPDATE", table: "user_public", filter: "" }, cb);

// ✅ Omit filter (all rows) or provide valid expression
channel.on("postgres_changes", { event: "UPDATE", table: "event_public",
  filter: `event_id=eq.${eventId}` }, cb);
```

### Step 3 — Add error listener to channel

```typescript
channel.on("system", { event: "error" }, (payload: unknown) => {
  if (isRecord(payload) && payload["status"] !== "ok") {
    console.error("Realtime error:", payload);
  }
});
```

Catches parsing errors, auth failures, and RLS rejections that are otherwise silent.

### Step 4 — Confirm token passes RLS (direct SQL test)

Decode your JWT in DevTools:

```javascript
const [, b64] = token.split(".");
console.log(JSON.parse(atob(b64)));
// Check: app_metadata.visitor_id OR app_metadata.user.user_id
```

Then run the Step 3 SQL simulation above. If `SELECT` returns 0 rows, the RLS policy is blocking this JWT.

### Step 5 — Inspect policy logic

```sql
SELECT policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'event_public' AND policyname LIKE '%read%';
```

Common mistakes:

- Wrong JWT path (`{ user_id: "..." }` at root instead of inside `app_metadata`)
- Missing visitor token branch (see [realtime-rls-architecture skill](../realtime-rls-architecture/SKILL.md))
- `WITH CHECK` clause blocks the UPDATE/change notification row

---

## Fix Patterns

### Subscription connects, no updates

Most likely RLS is silently filtering the subscriber. Confirm with the SQL simulation (Step 4), then verify the SELECT policy includes both visitor and user JWT paths. See [realtime-rls-architecture skill](../realtime-rls-architecture/SKILL.md) for the verified production policy templates.

### Updates reach some users, not others

Decode both JWTs and compare structures. Check whether both `visitor_id` and `user.user_id` paths are handled in the policy USING clause.

---

## Verification After Any RLS Change

```bash
npm run lint
npm run test:unit
```

Manual two-tab smoke test:

1. Open event in Tab A (owner) and Tab B (participant)
2. Change `active_song_id` in Tab A
3. Tab B should receive the update within ~250 ms + Realtime latency
4. Open a **private** event in Tab B that it has no access to; changes in Tab A must **not** arrive in Tab B

---

## References

- Architecture + policy templates: [realtime-rls-architecture skill](../realtime-rls-architecture/SKILL.md)
- JWT token structure: [authentication-system skill](../authentication-system/SKILL.md)
- [Supabase Realtime docs](https://supabase.com/docs/guides/realtime)
- [Supabase RLS docs](https://supabase.com/docs/guides/auth/row-level-security)
- Project migration: `supabase/migrations/20260220000011_re_enable_rls_on_event_public.sql`
