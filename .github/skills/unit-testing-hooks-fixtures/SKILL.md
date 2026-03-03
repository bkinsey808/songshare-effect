````skill
---
name: unit-testing-hooks-fixtures
description: How to structure mock/fixture data for hook unit tests. Covers using the real domain type, forceCast for nullable fields, and declaring shared fixture constants at module level instead of repeating them in each test. Use whenever writing or reviewing test fixture data for a custom hook test.
license: MIT
compatibility: Vitest 1.x, TypeScript strict, oxlint
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Hook Test Fixtures

For the general renderHook-first approach see [unit-testing-hooks](../unit-testing-hooks/SKILL.md).
For mocking external modules see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).

---

## Use the real domain type

Declare fixture arrays with the actual domain type (e.g. `CommunityEntry[]`), not trimmed subsets or `Record<string, unknown>`. This ensures the fixture stays in sync with schema changes and that the type-checker validates your test data.

```tsx
import type { CommunityEntry } from "@/react/community/community-types";

// ❌ Loses type safety — schema changes won't surface in this test
const mockCommunities: Record<string, unknown>[] = [ ... ];

// ✅ Typed correctly — TS catches stale fields
const mockCommunities: CommunityEntry[] = [ ... ];
```

---

## `forceCast` for nullable fields

Fields typed as `string | null` that have no meaningful test value cannot be assigned `undefined` directly (type mismatch), and `null` is rejected by the `no-null-literals` lint rule. Use `forceCast<T>(value)` from `@/react/lib/test-utils/forceCast`:

```tsx
import forceCast from "@/react/lib/test-utils/forceCast";

const mockCommunities: CommunityEntry[] = [
  {
    community_id: "c1",
    owner_id: "owner1",
    name: "Alpha",
    slug: "alpha",
    description: forceCast<string | null>(undefined),
    is_public: true,
    public_notes: forceCast<string | null>(undefined),
    created_at: "2020-01-01",
    updated_at: "2020-01-02",
  },
];
```

Use `forceCast<T>(value)` anywhere you need to coerce a test value past a type mismatch — partial event objects, synthetic `MouseEvent` stubs, etc. **Never** use inline `as unknown as T`; it triggers `typescript/no-unsafe-type-assertion`.

```tsx
// ❌ Triggers no-unsafe-type-assertion lint rule
result.current.handleInputChange({ target: { value: "alp" } } as unknown as ChangeEvent<HTMLInputElement>);

// ✅ forceCast is the repo-approved pattern
result.current.handleInputChange(forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }));
```

---

## Shared fixture constants — declare at module level

Do **not** re-declare the same fixture object inside every test. Duplicate inline fixtures are noisy and easy to get out of sync.

```tsx
// ❌ Same data copy-pasted into each test
it("filters by query", async () => {
  const entries = {
    e1: { event_id: "e1", event_public: { event_name: "First Event", event_slug: "first" } },
    e2: { event_id: "e2", event_public: { event_name: "Second Event", event_slug: "second" } },
  };
  installStore(entries);
  // ...
});

// ✅ One module-level constant, referenced everywhere
const mockEntries: Record<string, unknown> = {
  e1: { event_id: "e1", event_public: { event_name: "First Event", event_slug: "first" } },
  e2: { event_id: "e2", event_public: { event_name: "Second Event", event_slug: "second" } },
  e3: { event_id: "e3", event_public: { event_name: "Third Event", event_slug: "third" } },
};

it("filters by query", async () => {
  installStore(mockEntries);
  // ...
});
```

If a single test needs a **different** store shape (empty, or a one-entry subset), pass a local override directly to `installStore` for that one test only.

---

## Filter-query specificity

When testing search/filter logic, use a query string that **narrows the result to fewer entries** than the full list. A query that matches every entry proves nothing:

```tsx
// ❌ "a" matches Alpha, Beta, Gamma — filtering is never verified
result.current.handleInputChange(forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "a" } }));

// ✅ "alp" matches only Alpha — narrowing is confirmed
result.current.handleInputChange(forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }));
await waitFor(() => {
  expect(result.current.filteredCommunities).toHaveLength(ONE);
});
```

---

## References

- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — renderHook, installStore, test structure
- [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — Harness components, completeness checklist
- [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) — React Compiler constraint, query helpers, lint traps
- [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — `vi.mock`, `vi.mocked`, `forceCast`
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — magic numbers, async races
````
