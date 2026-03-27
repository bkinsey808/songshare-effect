---
name: realtime-rls-architecture
description: >
  RLS policy architecture for Supabase Realtime subscriptions — access control
  layers, JWT validation logic for visitor/user tokens, verified production
  policy templates. Use when writing or reviewing RLS policies for tables used
  with Realtime. Do NOT use for debugging active subscription failures — load
  realtime-rls-debugging instead.
---

**Requires:** file-read. No terminal or network access needed.

**Depends on:** [`authentication-system/SKILL.md`](/.github/skills/authentication-system/SKILL.md) — load when token-claim behavior or JWT structure is in scope. [`realtime-rls-debugging/SKILL.md`](/.github/skills/realtime-rls-debugging/SKILL.md) — load when the issue is active breakage (messages not arriving).

## When invoked

**Preconditions:**
- If writing a new policy, read the relevant existing migration files under `supabase/migrations/` to understand the table shape.
- Check the authentication-system skill for token structure if unfamiliar with the dual visitor/user JWT format.

**Clarifying questions:**
- **Defaults (proceed without asking):** apply both visitor and user token conditions to any public-readable SELECT policy; use proven templates from this skill.
- **Always ask:** which table and which operation(s) (SELECT/UPDATE/DELETE) if not specified.
- State assumptions when proceeding: "Writing a public SELECT policy for `song_public` — covering both visitor and user tokens. Let me know if owner-only access was intended."

**Output format:**
- Output SQL `CREATE POLICY` statement(s) in a fenced SQL code block.
- Follow with a brief bullet list: which token paths are allowed, and what Realtime visibility impact to expect.

**Error handling:**
- If the table schema is unknown, stop and ask for the column list before writing policies.
- If the task involves debugging (messages not arriving, empty filter errors), defer to the `realtime-rls-debugging` skill.

## Access control layers

| Layer | Mechanism | Purpose |
| ----- | --------- | ------- |
| **Database RLS** | Row-level policies enforce owner/admin/participant access | Primary protection |
| **API** | Service role with business-logic validation | Secondary check |
| **Frontend** | Hide edit/delete UI for non-owners | UX safety |
| **Realtime filtering** | RLS SELECT policies filter per-subscriber | Real-time safety |

**Key principle:** Realtime respects RLS. Subscriptions succeed regardless, but message delivery is silently filtered — a client without SELECT permission receives nothing, no error.

The API uses the service role (bypasses RLS) for writes. Realtime then broadcasts, and RLS filters each subscriber independently.

## JWT validation in RLS policies

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

| Token type | `visitor_id` | `user.user_id` | Result |
| ---------- | ------------ | -------------- | ------ |
| Visitor (anonymous) | ✅ set | null | `TRUE OR FALSE` → access ✅ |
| User (signed in) | null | ✅ set | `FALSE OR TRUE` → access ✅ |
| Invalid/malformed | null | null | `FALSE OR FALSE` → blocked ❌ |

See [authentication-system skill](/.github/skills/authentication-system/SKILL.md) for full token generation details.

## Verified production policy templates (`event_public`)

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

## Key insights

1. **A missing SELECT policy = silent broadcast blackout** — the subscriber never knows.
2. **`WITH CHECK` on UPDATE** must also pass for Realtime to deliver the post-update row.
3. **Service role bypasses RLS** by design — safe when RLS is the primary guard.
4. Private events only broadcast to participants because their SELECT policy restricts it.

## Evaluations (I/O examples)

**Input:** "Write RLS policies for `song_public` so both visitors and authenticated users can read public songs"
**Expected:** Agent outputs a fenced SQL `CREATE POLICY` for SELECT using the dual JWT template (`visitor_id IS NOT NULL OR user.user_id IS NOT NULL`), scoped to `is_public = true`. Follows with a bullet list: visitors and users both receive Realtime broadcasts for public songs; users without a valid token are silently filtered out.

**Input:** "Why is my visitor seeing events in the UI but the Realtime subscription delivers nothing?"
**Expected:** Agent identifies this as an active debugging task, defers to `realtime-rls-debugging` skill for root cause workflow. May note that a missing or malformed SELECT policy is the most common cause (see Key insight #1).

**Input:** "Add owner-only UPDATE access to the `song_public` table"
**Expected:** Agent outputs the UPDATE policy template using `owner_id = user.user_id::uuid`, includes both `USING` and `WITH CHECK` clauses, notes that `WITH CHECK` is required for Realtime to deliver the post-update row.

## References

- Debugging subscriptions: [realtime-rls-debugging skill](/.github/skills/realtime-rls-debugging/SKILL.md)
- JWT token structure: [authentication-system skill](/.github/skills/authentication-system/SKILL.md)
- Project migration: `supabase/migrations/20260220000011_re_enable_rls_on_event_public.sql`
- [docs/realtime-rls-architecture.md](/docs/realtime-rls-architecture.md)

## Do not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not write a SELECT policy without handling both visitor and user token paths.
- Do not omit `WITH CHECK` on UPDATE policies — Realtime requires it to deliver the updated row.
- Do not expand scope beyond the requested task without calling it out.
