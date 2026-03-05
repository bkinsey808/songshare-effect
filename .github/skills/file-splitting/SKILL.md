---
name: file-splitting
description: Comprehensive guide for breaking large files into separate single-function files. Covers naming, exports, import paths, test colocation, and validation. Use when refactoring consolidated utilities or test helpers into modular, maintainable pieces.
compatibility: TypeScript 5.x, React 18+, Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.1"
---

# File Splitting Skill

## Use When

Use this skill when:
- Splitting large files into focused single-responsibility modules.
- Extracting utilities/test helpers while preserving behavior.

Execution workflow:
1. Identify extraction boundaries and dependency order before moving code.
2. Create focused files with one primary export where practical.
3. Update all imports and colocated tests alongside each move.
4. Prefer absolute imports for shared test helpers.
5. Run targeted tests first, then `npm run lint`.

Output requirements:
- Summarize what moved, from where, and why.
- List import-path updates and test updates.

## Quick Rules

- Avoid barrel re-exports.
- Keep JSDoc with moved symbols.
- Avoid module-level side effects in test helper modules.
- Remove dead consolidated files once migration is complete.

## References

- Detailed playbook: [docs/file-splitting-reference.md](../../../docs/file-splitting-reference.md)
- File naming and import policy: [../file-organization/SKILL.md](../file-organization/SKILL.md)
- General refactoring: [../source-refactoring/SKILL.md](../source-refactoring/SKILL.md)

## Validation

```bash
npm run test:unit -- path/to/changed.test.ts
npx tsc -b .
npm run lint
```

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If the split includes broader structure/import policy decisions, also load `file-organization`.
- If extraction includes behavior-preserving refactor work, also load `source-refactoring`.
