# Linting and Formatting

This document describes the project's linting and formatting rules, tools, configuration, and recommended workflows. It references the repository's canonical configs so contributors have one clear place to check expected behavior.

## Tools we use

- **oxfmt** — opinionated formatter used via `npx oxfmt` and configured in `.oxfmtrc.json` (repo root)
- **oxlint** — linting (type-aware ESLint + plugins) configured in `.oxlintrc.json` (repo root)
- **Husky** — pre-commit hook runner (see `.husky/pre-commit`) ensures commits don't bypass the lint check
- **lint-staged** — fast staged-file formatting (configured in `lint-staged.config.mjs`) used to keep commits quick while enforcing style on changed files

## Configuration files to inspect

- `.oxfmtrc.json` — controls oxfmt behavior
  - Notable settings in this repo:
    - `useTabs: true` — the project uses tabs for indentation
    - `experimentalSortImports` — import ordering and grouping behavior (configured to keep import groups separated and case-insensitive sorting)

- `.oxlintrc.json` — master lint rules for the repo
  - Notable/important rules:
    - `oxc/no-barrel-file` = error — no index-barrel re-exports; import directly
    - `typescript/no-explicit-any` = error — disallow untyped `any` by default
    - `typescript/consistent-type-imports` and `typescript/consistent-type-definitions` — prefer `type` imports and `type` definitions
    - Extensive `react`, `jsx-a11y`, `unicorn`, `promise`, and `vitest` rules are enforced for safety and consistency

- `lint-staged.config.mjs` — staged-file pipeline; typically formats with oxfmt and runs the repo lint command for staged files
- `.husky/pre-commit` — runs `npm run lint`, so pre-commit runs the full `oxlint` check and fails the commit if errors exist

## Useful npm scripts

Formatting:

```bash
npm run format          # run oxfmt across the repository
npm run format:check    # exit non-zero if files are not formatted
npm run format:list-different  # list files that differ from formatting
```

Linting:

```bash
npm run lint            # run type-aware oxlint across the repo
npm run lint:fix        # attempt auto-fixes with oxlint
npm run lint:list-files # print files containing lint problems
```

Pre-commit behavior (note)

- Husky's `.husky/pre-commit` runs `npm run lint` (oxlint) across the working tree. `lint-staged` separately runs oxfmt + lint-auto-fix pipelines on staged files (see `lint-staged.config.mjs`). The end result: commits should be formatted and free of lint errors.

## Best practices and workflows

- Keep formatting separate from logic changes: run `npm run format` and commit formatting-only changes first when necessary.
- Fix lint problems incrementally — use `npm run lint` locally, then `npm run lint:fix` to apply safe autofixes. If autofixes don't resolve an error, address it manually.
- Avoid using `any`. The lint rule `typescript/no-explicit-any` is enforced; when an exception is necessary, keep it small, add an explanatory comment and prefer `unknown` + runtime checks.
- Import modules directly (no barrel `index.ts` files) to simplify tooling and tree-shaking. The repo enforces this with `oxc/no-barrel-file`.
- Avoid deep parent-relative imports (`../../…`). A general `no-restricted-imports` rule flags any path starting with `../../` and suggests using an alias (`@/`) or reorganizing code instead. This keeps import graphs easy to follow and prevents unwieldy file relocation churn.
- When adding manual optimizations (like useMemo/useCallback/memo), include a short comment that explains the measured reason — profiling is required for exceptions to the default rule of relying on the React Compiler.

### When you need to relax rules or add exceptions

- Use scoped `// oxlint-disable-next-line <rule>` or `/* oxlint-disable */` with a short justification when a rule needs to be suppressed. These should be rare and clearly explained in code and PR descriptions.
- Generated files and `dist/` outputs are ignored via `ignorePatterns` in both `.oxfmtrc.json` and `.oxlintrc.json`.

## TypeScript-specific guidance

- The repo enforces strict TypeScript rules. Some highlights:
  - `no-explicit-any` is an error — use `unknown` and runtime validation instead or narrow in a small helper with a clear comment.
  - `consistent-type-imports`, `explicit-function-return-type`, and `explicit-module-boundary-types` are enforced in many places.

  ### TypeScript compiler settings (lint-like enforcement)

  The TypeScript compiler is configured with strict, lint-like checks in `tsconfig.base.json` which catch many issues at build time. These aren't `oxlint` rules but they act the same way — forcing safer code and reducing runtime surprises. Key options include:
  - `strict: true` — turns on the whole strict family (non-nullability, strict type checking)
  - `noUnusedLocals` / `noUnusedParameters` — stops forgotten variables and dead parameters early
  - `noImplicitReturns` — requires functions return in all branches, preventing undefined surprises
  - `noUncheckedIndexedAccess` — forces you to handle potentially undefined indexed access (e.g., object[property])
  - `exactOptionalPropertyTypes` — makes optional properties' undefined behavior explicit and safer
  - `noImplicitOverride` — ensures method overrides are intentional and explicit

  How this influences real code (examples):
  - Explicit return types & overloads: `api/src/cookie/parseDataFromCookie.ts` uses function overloads and explicit Promise return types so callers get precise types and the implementation can't silently break type expectations.
  - Defensive `unknown` and runtime checks: `shared/src/utils/safe.ts` uses `unknown` inside implementations and typed overloads for callers so the compiler can't silently widen types — you must explicitly handle conversions.
  - Avoiding unused locals/parameters: the strict `noUnused*` options prevent temporary debug variables or forgotten argument names from lingering in production code and encourage cleanup during reviews.

  These TypeScript settings are a first line of defense and work hand-in-hand with `oxlint` to make incorrect or unsafe code visible earlier in the development cycle.

## Examples & quick commands

- Format changed files only (fast, before commit):

```bash
npx oxfmt "{,**/}*.{js,ts,jsx,tsx}"
```

- Run lint (type-aware) and autofix:

```bash
npm run lint:fix
npm run lint
```

- If a pre-commit fails with non-fixable issues:

```text
1. Run `npm run lint` to see full diagnostic output
2. Apply manual fixes and add tests where needed
3. Use `oxlint-disable` sparingly with inline comments if absolutely necessary
```

## Troubleshooting

- If `oxlint` or `oxfmt` behaves differently on CI vs your machine, ensure you have the same local versions installed (project pins versions in `package.json`).
- If a linting rule seems too strict or interferes with productivity, open a short PR proposing the change — include rationale, examples, and a plan for migration.

## Checklist before opening a PR

- [ ] Run `npm run format` and commit formatting changes
- [ ] Run `npm run lint` and fix all errors (or justify exceptions in PR description)
- [ ] Keep `any` to a minimum and document any exceptions clearly

## Where to read more

- `.oxfmtrc.json` — project formatting configuration
- `.oxlintrc.json` — project lint rules
- `lint-staged.config.mjs` — per-staged-file pipeline used by pre-commit
- `.husky/pre-commit` — runs `npm run lint` for each commit
- `package.json` — scripts for formatting and linting

---

If you'd like, I can also:

- Add examples of common oxlint rule violations and how to fix them
- Annotate a couple of demo files that purposefully use manual memoization so they're clearly labeled as performance demos
- Add a short developer note about editor integration (VS Code settings for oxfmt + linting)

If you want any of the follow-ups, tell me which you'd prefer and I'll make them next.

## How strong lint rules lead to better code — concrete examples 🔍

Below are real-code examples from this repository showing how strict lint rules changed code patterns for the better. Each example links a rule to a concrete benefit and points at the actual file location in the repo.

### 1) No `any` => safer runtime checks and small helpers

- Rule: `typescript/no-explicit-any` (error) encourages avoiding plain `any` and designing small, typed helper functions.
- Example: `api/src/cookie/parseDataFromCookie.ts`
  - The implementation uses a shared decode helper `decodeUnknownSyncOrThrow(schema, verified)` which returns a typed result but is complex enough that the analyzer may complain. Rather than using `any` throughout, the team keeps a small, localized exception using `oxlint-disable-next-line typescript/no-unsafe-assignment` and documents why it is allowed.
  - Benefit: the risky cast is isolated to a single small spot and the helper enforces schema validation at runtime — the rest of the code can rely on well-typed results.

Example excerpt (simplified):

```ts
// decodeUnknownSyncOrThrow validates the payload and returns typed result
// oxlint-disable-next-line typescript/no-unsafe-assignment
const decoded = decodeUnknownSyncOrThrow(schema, verified);
// oxlint-disable-next-line typescript/no-unsafe-return
return decoded as Schema.Schema.Type<SchemaT>;
```

### 2) Prefer `unknown` & overloads => avoid unsafe return types

- Rule: `no-unsafe-return`, `no-unsafe-assignment` push maintainers to accept `unknown` in helper bodies and narrow later.
- Example: `shared/src/utils/safe.ts` implements `safeGet` / `safeArrayGet` with `unknown` internals and typed overloads so callers get correct types while the implementation remains safe.
  - Benefit: callers enjoy strong typing while the implementation avoids `any` and keeps runtime checks explicit.

### 3) No barrel files => clearer imports, easier tooling

- Rule: `oxc/no-barrel-file` = error means importing directly from source paths instead of index-barrels.
- Example: you'll see consistent direct imports across the repo like `import { type Song } from '@/shared/generated/database.types'` instead of `import { Song } from '@/shared/generated'`.
  - Benefit: static analysis and bundlers get precise module graphs, which reduces accidental cycles, improves tree-shaking, and makes code navigation more predictable.

### 4) Explicit types & return types => easier to review and reason about code

- Rule: `typescript/explicit-function-return-type` is enforced; many top-level functions explicitly declare return types.
- Example: `api/src/cookie/parseDataFromCookie.ts` declares Promise-based return types and function overloads so callers get exact types whether `allowMissing` is true or false.
  - Benefit: function contracts are explicit which improves reviewer confidence and prevents subtle type regressions.

### 5) Avoid `await` in loops => prefer Promise-based concurrency

- Rule: `eslint/no-await-in-loop` = error encourages replacing sequential awaits in loops with `Promise.all` or other concurrency techniques.
- Example: `react/src/utils/cacheManagement.ts` uses `await Promise.all([...])` to delete caches in parallel.
  - Benefit: faster operation and fewer performance surprises in hot code paths.

### 6) Central rule surrogates for exceptions (example: `no-console`)

- Rule: `eslint/no-console` is a warning in many places but the repo centralizes console usage in `api/src/logger.ts` where a file-level `/* oxlint-disable no-console */` is used
  - Benefit: centralized exceptions with a single file-scoped disable make the exception explicit and easy to review while keeping the rest of the codebase free of ad-hoc console statements.

### Real-world outcome — predictable, reviewable code

Taken together, strict rules push contributors to:

- write small, testable helpers that isolate unsafe logic;
- narrow `unknown` to concrete types instead of allowing `any` everywhere;
- prefer declarative APIs with explicit return types; and
- handle concurrency and safety cosmetically (Promise.all, abort signals, etc.).

These rules require extra work up front, but they make code easier to audit, safer at runtime, and simpler to refactor later.
