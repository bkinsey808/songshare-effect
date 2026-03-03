---
name: realtime-rls-architecture
description: RLS policy architecture for Supabase Realtime subscriptions — access control layers, JWT validation logic for visitor/user tokens, verified production policy templates. Use when writing or reviewing RLS policies for tables used with Realtime.
license: MIT
compatibility: Supabase Realtime, PostgreSQL RLS
metadata:
  author: bkinsey808
  version: "1.0"
---

# Realtime + RLS Architecture Skill

## When to Use

- Writing or modifying RLS policies on tables used with Realtime
- Understanding why the dual visitor/user JWT structure requires two policy conditions
- Copying verified SELECT/UPDATE/DELETE policy templates
- Reviewing security layers for event_public or similar tables

---

## Access Control Layers

| Layer                  | Mechanism                                                 | Purpose            |
| ---------------------- | --------------------------------------------------------- | ------------------ |
| **Database RLS**       | Row-level policies enforce owner/admin/participant access | Primary protection |
| **API**                | Service role with business-logic validation               | Secondary check    |
| **Frontend**           | Hide edit/delete UI for non-owners                        | UX safety          |
| **Realtime filtering** | RLS SELECT policies filter per-subscriber                 | Real-time safety   |

**Key principle**: Realtime respects RLS. Subscriptions succeed regardless, but message delivery is silently filtered — a client without SELECT permission receives nothing, no error.

The API uses the service role (bypasses RLS) for writes. Realtime then broadcasts, and RLS filters each subscriber independently.

---

## JWT Validation in RLS Policies

This project uses two token types. Any SELECT policy on a public-readable table must handle both:

```sql
(
  -- Visitor token: app_metadata.visitor_id is set
  (((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL)
  OR
  -- User token: app_metadata.user.user_id is set
  ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)
)
```

| Token type          | `visitor_id` | `user.user_id` | Result                        |
| ------------------- | ------------ | -------------- | ----------------------------- |
| Visitor (anonymous) | ✅ set       | null           | `TRUE OR FALSE` → access ✅   |
| User (signed in)    | null         | ✅ set         | `FALSE OR TRUE` → access ✅   |
| Invalid/malformed   | null         | null           | `FALSE OR FALSE` → blocked ❌ |

See [authentication-system skill](../authentication-system/SKILL.md) for full token generation details.

---

## Verified Production Policy Templates (`event_public`)

### SELECT — public events (visitors + users)

```sql
CREATE POLICY "Allow read access to public events"
ON public.event_public FOR SELECT TO authenticated
USING (
  is_public = true
  AND (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'visitor_id'::text) IS NOT NULL)
    OR
    ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)
  )
);
```

### SELECT — owner access

```sql
CREATE POLICY "Allow owner to read own event_public"
ON public.event_public FOR SELECT TO authenticated
USING (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
);
```

### SELECT — participant access

```sql
CREATE POLICY "Allow participant to read event_public"
ON public.event_public FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_user eu
    WHERE eu.event_id = event_public.event_id
      AND eu.user_id = (((auth.jwt() -> 'app_metadata') -> 'user' ->> 'user_id')::uuid)
      AND eu.status IN ('invited', 'joined', 'left')
  )
);
```

### UPDATE — owner

```sql
CREATE POLICY "Allow owner to update own event_public"
ON public.event_public FOR UPDATE TO authenticated
USING (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
)
WITH CHECK (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
);
```

### UPDATE — event admins

```sql
CREATE POLICY "Allow event admins to update event_public"
ON public.event_public FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_user eu
    WHERE eu.event_id = event_public.event_id
      AND eu.user_id = (((auth.jwt() -> 'app_metadata') -> 'user' ->> 'user_id')::uuid)
      AND eu.role IN ('event_admin', 'event_playlist_admin')
      AND eu.status = 'joined'
  )
);
```

### DELETE — owner only

```sql
CREATE POLICY "Allow owner to delete own event_public"
ON public.event_public FOR DELETE TO authenticated
USING (
  owner_id = (((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text)::uuid
);
```

---

## Key Insights

1. **A missing SELECT policy = silent broadcast blackout** — the subscriber never knows.
2. **`WITH CHECK` on UPDATE** must also pass for Realtime to deliver the post-update row.
3. **Service role bypasses RLS** by design — safe when RLS is the primary guard.
4. Private events only broadcast to participants because their SELECT policy restricts it.

---

## References

- Debugging subscriptions: [realtime-rls-debugging skill](../realtime-rls-debugging/SKILL.md)
- JWT token structure: [authentication-system skill](../authentication-system/SKILL.md)
- Project migration: `supabase/migrations/20260220000011_re_enable_rls_on_event_public.sql`
- [docs/realtime-rls-architecture.md](../../../docs/realtime-rls-architecture.md)
