---
name: scripts
description: Conventions for repository scripts (naming, execution, linting, testing).
---

**Requires:** file-read, terminal (Bun). No network access needed.

# Scripts Skill

## Use When

Use this skill when:

- Adding or editing files under `scripts/`.
- Refactoring script logic into testable modules.

Execution workflow:

1. Keep `.bun.ts` entrypoints thin and move logic into pure modules.
2. Follow script naming/layout conventions and colocate tests with helper modules.
3. Prefer reusable helpers over duplicated CLI logic.
4. Validate with targeted unit tests and `npm run lint` when script code changes are substantial.

Output requirements:

- Summarize script entrypoint vs helper-module changes.
- Report any test coverage added or updated.

This skill documents the conventions and expectations for repository scripts. Follow these rules when adding or changing scripts so they remain discoverable, testable, and consistent with the project's lint/type conventions.

## Naming & Location ✅

- **Simple scripts** (no extracted helpers): a single file at the top level of `scripts/`:
  - `scripts/my-script.bun.ts`
- **Scripts with helper logic**: use a **named subdirectory** — the entry point shares the directory name:
  - `scripts/my-script/my-script.bun.ts`
  - Helper modules sit alongside the entry point in the same directory.
- **File name pattern for entry points:** `kebab-case.bun.ts` (e.g., `check-skill-line-count.bun.ts`) — this signals the file is a Bun-executable script.
- **Helper module naming** follows standard module rules:
  - Single exported symbol → **PascalCase** (e.g., `collectSkillFiles.ts`, `countLines.ts`)
  - Multiple related exports → descriptive name (e.g., `constants.ts`)

### Example directory layout

```
scripts/
  check-skill-line-count/
    check-skill-line-count.bun.ts   ← entry point (shebang, thin shell only)
    checkSkillFiles.ts              ← pure exported function with logic; unit-testable
    collectSkillFiles.ts            ← export default collectSkillFiles(...)
    countLines.ts                   ← export default countLines(...)
    checkSkillFiles.test.ts         ← unit tests for the pure logic module
    collectSkillFiles.test.ts       ← unit tests colocated with source
    countLines.test.ts
```

### Entry-point vs logic module pattern 🔑

Keep `.bun.ts` entry points as **thin shells**: they resolve `repoRoot` via `import.meta.dir`, call a pure exported function, and handle side-effects (`process.exit`, `stderr.write`, `stdout.write`). All non-trivial logic lives in its own module so it can be unit-tested under Node/Vitest **without spawning Bun**.

```ts
// check-skill-line-count.bun.ts  ← thin shell
import path from "node:path";
import { checkSkillFiles } from "./checkSkillFiles";

async function main(): Promise<void> {
	const repoRoot = path.resolve(import.meta.dir, "../..");
	const result = await checkSkillFiles(repoRoot);
	if (result.hasError) {
		for (const msg of result.errors) {
			process.stderr.write(`${msg}\n`);
		}
		process.exit(1);
	}
	process.stdout.write(`✓ Checked ${result.checkedCount} file(s).\n`);
}
await main();
```

The pure module returns a typed result object rather than calling `process.exit`:

```ts
// checkSkillFiles.ts  ← pure, testable under Node
export type CheckResult = { hasError: boolean; checkedCount: number; errors: string[] };
export type CheckOptions = { maxLines?: number; searchDirs?: string[]; /* ... */ };
export async function checkSkillFiles(repoRoot: string, opts: CheckOptions = {}): Promise<CheckResult> { ... }
```

> **Why options object?** ESLint's `max-params` rule (default max 3) will trigger if you pass many positional helper args. Group injectable dependencies into a single `opts` parameter.

## File format & runtime 🔧

- Add a shebang at the top of entry points so scripts can be run directly:
  ```ts
  #!/usr/bin/env bun
  ```
- Use ESM imports (this project uses ESM everywhere):
  ```ts
  import { readFileSync } from "node:fs";
  ```
- Prefer running scripts via `npx bun` so CI environments without a global Bun install still work:
  - `npx bun ./scripts/my-script/my-script.bun.ts`
- Add a `package.json` entry to simplify invocation:
  ```json
  "scripts": {
    "check:skill-line-count": "bun run ./scripts/check-skill-line-count/check-skill-line-count.bun.ts"
  }
  ```

## TypeScript, typing & linting rules (strict) ⚠️

- **Strict types**: `tsconfig` is strict. Avoid `any`. Use `unknown` and explicit narrowing where needed.
- **No null literals**: Prefer `undefined` and type guards.
- **No `continue` statements** in loops; prefer structured control flow.
- **JSDoc rules**: Add JSDoc for all exported functions with concise descriptions (no type annotations in JSDoc for `.ts` files). Use `@returns` where applicable.
- **Export policy**: No barrel files. Import helpers directly from their source files.
- **Named constants**: Extract magic numbers and strings into named constants (e.g., in `constants.ts`).

## Lint & Format ✅

- Format with: `npx oxfmt .` (or `npm run format`)
- Lint with: `npx oxlint --config .oxlintrc.json --type-aware .` (or `npm run lint`)
- Fixable lint issues should be auto-fixed where possible; otherwise discuss with reviewers before suppressing.

## Tests & Placement 🧪

- Colocate test files next to the file they test, inside the script's directory.
- Naming: append `.test.ts` to the source file name:
  - Source: `scripts/check-skill-line-count/countLines.ts`
  - Test: `scripts/check-skill-line-count/countLines.test.ts`
- **Prefer testing the pure logic module** (`checkSkillFiles.ts`) over the entry point (`.bun.ts`). The entry point is a thin shell and does not need its own spec; the logic module does.
- Use Vitest and follow the repo's test conventions (descriptive names, no magic numbers, etc.).
- **Do not spawn `bun` in unit tests.** Tests that call `spawnSync("bun", ...)` will fail in environments where Bun is not installed. Extract logic into a pure Node-importable module instead.
- If you must write an integration test that spawns a binary, guard it with a runtime availability check so it degrades to `test.skip` cleanly in restricted environments.

## Validation & CI checks 🔁

Before submitting a PR run:

1. `npx oxfmt --check .` or `npm run format:check`
2. `npx oxlint --config .oxlintrc.json --type-aware .` or `npm run lint`
3. `npm run lint`
4. `npm run test:unit -- <path-to-test>` (tests related to your changes)

## Rationale 💡

- The subdirectory pattern keeps helpers and tests colocated and importable independently, making unit testing straightforward without importing the full entry-point script.
- Splitting the entry point into a thin shell + pure logic module allows the logic to be tested under Node/Vitest without spawning Bun, which is often unavailable in automated environments.
- `kebab-case.bun.ts` entry points are immediately recognisable as Bun scripts.
- Running via `npx bun` ensures CI portability without requiring global Bun installs — but `npx bun` may also be unavailable in locked-down CI; having a pure Node-testable module is the reliable fallback.

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If script files are being decomposed into smaller modules, also load `file-splitting`.
- If script tests are being added/updated, also load `unit-test-best-practices`.
