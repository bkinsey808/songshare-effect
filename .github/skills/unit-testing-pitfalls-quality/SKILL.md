`````skill
````skill
---
name: unit-testing-pitfalls-quality
description: Code-quality anti-patterns to avoid in Vitest tests. Covers lint disable hygiene, type-cast helpers, mocking Node.js built-ins, `as any` on mocked functions, `toStrictEqual` over `toEqual`, and `toSorted()` over `sort()`. Use when writing or editing unit tests that involve lint-disable patterns, Node.js core module mocking, or assertion quality rules.
license: MIT
compatibility: Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Code-Quality Pitfalls

Code-quality anti-patterns to avoid in Vitest tests for this repo.

For behavioral/async pitfalls see [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md).
For mocking strategies see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).

---

## ⚠️ Lint Disable Comments in Tests

- **Avoid file-level `/* oxlint-disable ... */`** in test files — they conceal rule violations.
- **Prefer narrow, local disables** scoped to small test helper functions rather than test bodies.
  - Use `// oxlint-disable-next-line <rule> - reason` for a single-line exception.
  - Better: place the disable above a helper function so the exception is obvious, localized, and easily audited.
- **Never scatter disables throughout test cases.** Centralize them in helpers.
- A custom oxlint rule enforces this: `oxlint-disable` comments are only permitted directly above a small helper function/constant — not inside `describe`, `test`, or `it` blocks or at file top-level.
- **Always add a brief rationale** and a `TODO`/issue reference when you add a disable.

```typescript
// BAD: file-level disable
/* oxlint-disable @typescript-eslint/no-explicit-any */

// BAD: inline disables sprinkled inside tests
it("does something", () => {
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const x: unknown = doUnsafeThing();
  expect(x).toBeDefined();
});

// BETTER: localized, documented helper
// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- localized in helper
export function asUnsafe<T>(value: unknown): T { return value as unknown as T; }

// Tests stay clean:
it("does something", () => {
  const x = asUnsafe<MyType>({ foo: "bar" });
  expect(x).toBeDefined();
});
```

---

## 🛠️ Type-Cast Helpers

The repo provides narrow helpers for common unsafe casts in `react/src/lib/test-utils`: `asNull`, `asNever`, `asPostgrestResponse`. Each contains its own `oxlint-disable` and JSDoc explanation so callers stay lint-friendly.

- Use the existing helpers instead of writing `as any` or sprinkling disables in tests.
- Add a new helper to the folder if you encounter a recurring pattern.

```ts
import { asNever } from "@/lib/test-utils";

it("handles unexpected value", () => {
  const bad = asNever("foo");
  expect(() => myFn(bad)).toThrow();
});
```

Generic helpers that are reused across many tests belong under `react/src/lib/test-utils`. Co-located helpers (e.g., `getCachedUserToken.test-util.ts`) live next to the module they support. See `react/src/lib/test-utils/test-helper-template.ts` for examples.

---

## ❌ Mocking Node.js Built-ins (`node:fs/promises`, `node:path`, etc.)

Do **not** try to mock `node:fs/promises` or other Node.js core modules with `vi.mock`. Vitest cannot reliably replace native named exports, and the mocked module will often be `undefined` at import time even when `importOriginal` is used.

**✅ Better:** Use the real filesystem with `mkdtemp` / `rm` from `node:fs/promises` to set up and tear down actual temporary directories. This also tests real filesystem behavior (permissions, path separators) that a mock would silently ignore.

```typescript
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

it("collects only SKILL.md files recursively", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "my-test-"));
  try {
    await mkdir(path.join(tmp, "sub"), { recursive: true });
    await writeFile(path.join(tmp, "SKILL.md"), "");
    await writeFile(path.join(tmp, "sub", "SKILL.md"), "");
    const result = await myFn(tmp);
    expect(result.toSorted()).toStrictEqual(
      [path.join(tmp, "SKILL.md"), path.join(tmp, "sub", "SKILL.md")].toSorted()
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
```

---

## ❌ `as any` Casts on Mocked Functions

Never cast a mocked import `as any` to reach `.mockReturnValue()` or `.mockImplementation()`. Use `vi.mocked()` instead — it is fully typed, satisfies the linter, and provides autocomplete:

```typescript
// BAD
(readdir as any).mockResolvedValue([]);

// GOOD
import { readdir } from "node:fs/promises";
vi.mock("node:fs/promises"); // or use real fs as described above
vi.mocked(readdir).mockResolvedValue([]);
```

---

## ❌ `toEqual` instead of `toStrictEqual`

The linter enforces `toStrictEqual` over `toEqual` because `toEqual` ignores `undefined` object properties and prototype differences. Always use `toStrictEqual` for value assertions:

```typescript
// BAD
expect(result).toEqual([]);

// GOOD
expect(result).toStrictEqual([]);
```

---

## ❌ `Array#sort()` Instead of `Array#toSorted()`

`Array#sort()` mutates the original array in place, which can corrupt data shared between setup and assertion. The linter enforces `toSorted()` which returns a new sorted array:

```typescript
// BAD — mutates result and expected in place
expect(result.sort()).toEqual(expected.sort());

// GOOD — returns new sorted copies
expect(result.toSorted()).toStrictEqual(expected.toSorted());
```

---

## See Also

- [**unit-testing**](../unit-testing/SKILL.md) — Core Vitest patterns, validation commands
- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — vi.mock, vi.hoisted, callable helpers
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Hono API handler testing
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Behavioral and async pitfalls (magic numbers, `act`, async races)
````

`````
