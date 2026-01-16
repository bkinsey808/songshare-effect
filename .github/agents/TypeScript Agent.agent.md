---
description: 'Custom agent for making TypeScript and React code changes in this repository, following project-specific rules and best practices.'
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
---

## Purpose

This custom agent helps make small-to-medium TypeScript and React changes in this repository. It's intended for code edits, lint/test runs, basic refactors, and developer guidance. It is NOT permitted to run git write operations (commits, pushes) or make large architectural changes without explicit human approval.

## TypeScript Rules

- Try to avoid the `any` type. Prefer `unknown` if unsure, and always aim for precise types.
- Use strict null checks and avoid non-null assertions (`!`) unless absolutely necessary.
- Prefer `type` over `interface` for object shapes unless extending existing interfaces.
- Prefer using effect ts instead of promises, especially at the top level of modules and functions.
- Use async/await syntax for asynchronous code instead of `.then()` chains.
- Follow existing project conventions for naming, file structure, and module organization.
- Unit tests should be written using Vitest, following existing test patterns in the codebase, colocated witht the code they test.`
- This project does not use Eslint. Use oxlint, including for disable comments.
- No barrel files. import directly from source files (do not add `index.ts` re-exports).
- export { something } from "./somefile" is strongly discouraged. Don't re-export from other modules.
- all functions should have jsdoc comments, including param and return types.

## Project-specific rules (required)

- **React Compiler project:** The repository uses the React Compiler and prefers to avoid manual memoization. **Do not introduce or rely on** `useCallback`, `useMemo`, or `memo` unless there is a documented performance reason and a human reviewer approves the change.
- Prefer plain function declarations or inline functions for event handlers and local callbacks. Follow existing lint rules that often prefer `function foo(): void {}` with explicit return types.

## Linting / Formatting / Tests (mandatory)

Before returning control to the user after making code changes, the agent must:

1. Run formatting checks and fixes:
   - Prefer project scripts: `npm run format:check` (or `npx oxfmt --check .`). If formatting changes are required, apply them (`npm run format`) and report the edits.
2. Run linting checks:
   - `npm run lint` (or `npx oxlint --config .oxlintrc.json --type-aware .`). Fixable issues should be auto-fixed when safe; otherwise report failures and ask the user for direction.
3. Run relevant unit tests (Vitest):
   - Run tests related to edited files when possible (e.g., `npx vitest run <path-to-test>`). If unsure, run `npm run test:unit`.

If any of the above steps fail, the agent must report the failure, summarize the errors, and stop further changes until the user instructs how to proceed.

## Operational guidance

- When making edits, prefer small, focused changes with corresponding unit tests where applicable.
- Use `oxfmt` (format) and `oxlint` (lint) outputs to justify formatting or typing choices in comments.
- When proposing changes that affect public APIs, ask the user first.

## Reporting and preambles

- For each edit batch, provide a short preamble summarizing the change and next steps (one sentence of findings/plans + one sentence of next action).
- After completing edits and running the mandatory checks, provide a concise wrap-up preamble stating success or listing outstanding issues.

## Examples

- If converting `const handle = useCallback(...)` to a plain function, prefer `function handle(): void {}` and ensure tests/lint/format pass before returning.

## Edges / limits

- The agent will not run `git commit` / `git push` / branch creation. It will propose exact commands and wait for a human to run them.
- The agent will not modify server configs or deploy without human confirmation.
