---
name: scripts
description: Conventions for repository scripts (naming, execution, linting, testing).
license: MIT
compatibility: Bun, Node.js 20+, TypeScript 5.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Scripts Skill

This skill documents the conventions and expectations for repository scripts. Follow these rules when adding or changing scripts so they remain discoverable, testable, and consistent with the project's lint/type conventions.

## Naming & Location ✅

- **File name pattern:** **kebab-case.bun.ts** (example: `generate-schemas.bun.ts`) 💡
  - This convention makes it immediately obvious the file is a Bun-executable script.
- **Directory:** Place scripts under `scripts/` in a descriptive sub-path when helpful:
  - `scripts/build/generate-effect-schemas/generate-effect-schemas.bun.ts`
- **Special rule:** The repository also follows the general import/export file naming rules:
  - Files that have a single exported symbol: **PascalCase** (e.g., `MyService.ts`) — use this for normal modules.
  - Files that export multiple symbols: **kebab-case** (e.g., `helpers-io.ts`).
  - **Exception:** scripts themselves must use `kebab-case.bun.ts` regardless of exported symbols.

## File format & runtime 🔧

- Add a shebang at the top so scripts can be run directly:
  ```ts
  #!/usr/bin/env bun
  ```
- Use ESM imports (this project uses ESM everywhere):
  ```ts
  import { readFileSync } from "node:fs";
  ```
- Prefer running scripts via `npx bun` so CI environments that don't have bun globally still work:
  - Run directly: `npx bun ./scripts/my-script.bun.ts`
  - Or: `bun run ./scripts/my-script.bun.ts` when bun is available
- When appropriate, add an entry in `package.json` script to simplify execution (optional):
  ```json
  "scripts": {
    "generate:schemas": "bun run ./scripts/build/generate-effect-schemas/generate-effect-schemas.bun.ts"
  }
  ```

## TypeScript, typing & linting rules (strict) ⚠️

- **Strict types**: `tsconfig` is strict. Avoid `any`. Use `unknown` and explicit narrowing where needed.
- **No null literals**: Prefer `undefined` and type guards.
- **No `continue` statements** are preferred in loops; prefer structured control flow.
- **JSDoc rules**: Add JSDoc for exported functions and modules with concise descriptions (no type annotations in JSDoc). Use `@returns` where applicable and be explicit about side-effects.
- **Export policy**: Avoid barrel files. Export directly from source files.

## Lint & Format ✅

- Format with: `npx oxfmt .` (or `npm run format`)
- Lint with: `npx oxlint --config .oxlintrc.json --type-aware .` (or `npm run lint`)
- Fixable lint issues should be auto-fixed where possible; otherwise discuss with reviewers before suppressing rules.

## Tests & Placement 🧪

- Put tests next to the script under the same directory.
- Naming: test files should be named exactly after the file they test, with the `.test.ts` suffix. Example:
  - Script: `scripts/find-missing-jsdoc/find-missing-jsdoc.bun.ts`
  - Test: `scripts/find-missing-jsdoc/find-missing-jsdoc.bun.test.ts`
- Use Vitest for unit/integration tests and follow the repo's test conventions (colocated tests, descriptive test names, no magic numbers, etc.).
- When adding an integration-style script test that executes `npx bun`, make tests tolerant to environments that do not have `bun` available (use conditional describe/test skip logic or allow environment-specific outcomes to be accepted by assertions).

## Examples ✍️

- Create a Bun script:
  - `scripts/debug-analyze.bun.ts` with a shebang and ESM imports
  - Execute: `npx bun ./scripts/debug-analyze.bun.ts` or `npm run debug:analyze` (if added to `package.json`)
- Add a test: `scripts/debug-analyze.bun.test.ts` that runs the script (or the internal API) and asserts behavior.

## Validation & CI checks 🔁

- Before submitting a PR run:
  1. `npx oxfmt --check .` or `npm run format:check`
  2. `npx oxlint --config .oxlintrc.json --type-aware .` or `npm run lint`
  3. `npx tsc -b .` (typecheck)
  4. `npm run test:unit -- <path-to-test>` (run tests related to your changes)

## Rationale / Best Practices 💡

- Using `kebab-case.bun.ts` makes scripts discoverable and indicates runtime (Bun) at a glance.
- Running via `npx bun` ensures CI portability without requiring global Bun installs.
- Strict typing and lint rules maintain long-term maintainability and prevent runtime surprises.

---

Follow these conventions when adding or updating scripts; they keep the repo consistent and make automation predictable for contributors and CI.
