---
name: supabase-client-patterns
description: Which Supabase client to use in React (public vs token-auth vs withAuth), safe-query helpers (callSelect/callInsert/callUpdate), and SupabaseClientLike type. Use when querying Supabase from a React component, hook, or fetch function.
compatibility: Supabase JS 2.x, TypeScript 5.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Supabase Client Patterns (React)

**For API-side Supabase usage** see `api/src/supabase/`. This skill covers React-side clients only.

## Use When

Use this skill when:
- Fetching or mutating Supabase data from React hooks/components.
- Refactoring Supabase access code in `react/` to align with repo client and safe-query patterns.

Execution workflow:
1. Choose the correct client (`getSupabaseClientWithAuth` by default).
2. Use `SupabaseClientLike` in signatures and safe-query helpers for table operations.
3. Handle `{ data, error }` consistently and avoid direct raw client creation in React code.
4. Validate with targeted unit tests for changed fetch/mutation logic, then run `npm run lint`.

Output requirements:
- State which client/helper pattern was applied and where.
- Note any auth or RLS-related behavior changes.

## The Three Clients

| Function | Location | Auth | Use when |
|---|---|---|---|
| `getPublicSupabaseClient` | `react/src/lib/supabase/client/` | Anon key only | Truly public data, no RLS needed |
| `getSupabaseClient(token)` | same | JWT in header | You already have the token string |
| `getSupabaseClientWithAuth()` | same | Auto-fetch token | Fetching data in a hook/component |

**Default: always use `getSupabaseClientWithAuth()`** unless you have a specific reason for the others.

```typescript
import getSupabaseClientWithAuth from "@/react/lib/supabase/client/getSupabaseClientWithAuth";

const client = await getSupabaseClientWithAuth();
if (!client) {
  // Handle unavailable client (env vars missing, token fetch failed)
  return;
}
````

`getSupabaseClientWithAuth` automatically picks the right token (user JWT if signed in, visitor JWT if not) with 3-retry + exponential backoff.

## SupabaseClientLike

The return type is `SupabaseClientLike<Database>` (from `@/react/lib/supabase/client/SupabaseClientLike`), not the raw `SupabaseClient`. This is an interface to keep code testable — use it in type signatures:

```typescript
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import type { Database } from "@/shared/generated/supabaseTypes";

async function fetchSomething(client: SupabaseClientLike<Database>) { ... }
```

## Safe-Query Helpers

Prefer `callSelect` / `callInsert` / `callUpdate` from `@/react/lib/supabase/client/safe-query/` over calling `.from().select()` directly. They provide type-safe table names and normalised `PostgrestResponse<Row>` returns.

```typescript
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import callInsert from "@/react/lib/supabase/client/safe-query/callInsert";
import callUpdate from "@/react/lib/supabase/client/safe-query/callUpdate";

// Select
const response = await callSelect<SongRow, Database, "songs">(client, "songs", {
  cols: "id, title, artist",
  eq: { col: "community_id", val: communityId },
  order: "title",
});

// Insert
const response = await callInsert(client, "songs", { id, title, artist });

// Update
const response = await callUpdate(client, "songs", { title }, {
  eq: { col: "id", val: songId },
});
```

### Handling the response

Supabase returns `{ data, error }`. Always check both:

```typescript
const { data, error } = await callSelect<SongRow, Database, "songs">(client, "songs");
if (error) {
  // handle
  return;
}
// data is SongRow[] | null
```

## Testing — Mocking the Client

Use `asPostgrestResponse` from `@/react/lib/test-utils/asPostgrestResponse` to build typed mock responses. Mock `callSelect` (not the client itself):

```typescript
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");
const mockedCallSelect = vi.mocked(callSelect);

mockedCallSelect.mockResolvedValue(asPostgrestResponse({ data: [{ id: "s1" }] }));
```

For the client itself use `getSupabaseClient.test-util` from `@/react/lib/supabase/client/`.

## Do Not

- ❌ Call `createClient` from `@supabase/supabase-js` directly in React code
- ❌ Hardcode token strings
- ❌ Use `getPublicSupabaseClient` for any data with RLS policies
- ❌ Use `SupabaseClient<Database>` in function signatures — use `SupabaseClientLike<Database>`

## References

- Authentication skill: [../authentication-system/SKILL.md](../authentication-system/SKILL.md)
- Unit testing mocking: [../unit-testing/SKILL.md](../unit-testing/SKILL.md)
- Generated types: `@/shared/generated/supabaseTypes`

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If token acquisition/selection logic changes, also load `authentication-system`.
- If realtime behavior or policy access is involved, also load `realtime-rls-debugging`.
