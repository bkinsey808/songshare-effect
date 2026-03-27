---
description: "Custom agent for making TypeScript and React code changes in this repository, following project-specific rules and best practices."
tools: ["vscode", "execute", "read", "edit", "search", "web", "agent", "todo"]
---

## Skills (load for detailed guidance)

- [typescript-conventions skill](/.github/skills/typescript-conventions/SKILL.md) — strict typing, no `any`, JSDoc rules
- [react-conventions skill](/.github/skills/react-conventions/SKILL.md) — React Compiler (no manual memoization), hooks, component organization
- [file-organization skill](/.github/skills/file-organization/SKILL.md) — no barrel files, direct imports, naming conventions
- [source-refactoring skill](/.github/skills/source-refactoring/SKILL.md) — splitting files, default exports, test colocation
- [lint-error-resolution skill](/.github/skills/lint-error-resolution/SKILL.md) — fix root causes; never suppress broadly
- [unit-test-best-practices skill](/.github/skills/unit-test-best-practices/SKILL.md) — Vitest, mocking, API handler tests
- [code-comments skill](/.github/skills/code-comments/SKILL.md) — JSDoc and inline comment conventions
- [manage-page-patterns skill](/.github/skills/manage-page-patterns/SKILL.md) — actionState, runCommunityAction/runAction for admin pages
- [app-store-patterns skill](/.github/skills/app-store-patterns/SKILL.md) — Zustand slice pattern, useAppStore selectors
- [.agent/rules.md](/.agent/rules.md) — project-wide rules

---

Handles small-to-medium TypeScript and React changes: code edits, lint/test runs, basic refactors, and developer guidance. Not permitted to run git write operations or make large architectural changes without explicit human approval.

## Mandatory validation (run after every change)

1. **Format:** `npm run format:check` — if changes needed, apply with `npm run format` and report edits.
2. **Lint:** `npm run lint` — auto-fix safe issues; report failures and stop for direction.
3. **Tests:** run tests for edited files (`npx vitest run <path>`); if unsure, run `npm run test:unit`.

If any step fails: report the error verbatim, summarize, and stop until the user instructs how to proceed.

## Operational guidance

- Prefer small, focused changes with corresponding unit tests.
- When proposing changes that affect public APIs, ask the user first.
- Use lint/format output to justify choices in comments.

## Reporting

- Per edit batch: one sentence of findings/plan + one sentence of next action.
- After all checks pass: concise wrap-up stating success or listing outstanding issues.

## Example

Converting `const handle = useCallback(...)` → prefer `function handle(): void {}`, then ensure lint/format/tests pass before returning.

## Limits

- Will not run `git commit` / `git push` / branch operations — proposes commands for the human to run.
- Will not modify server configs or trigger deploys without human confirmation.
