---
name: file-splitting
description: >
  Step-by-step guide for breaking large consolidated files into single-function
  files — naming, exports, import paths, test colocation, and validation. Use
  when refactoring consolidated utilities or test helpers into modular,
  maintainable pieces. Do NOT use for creating new files from scratch — this
  skill is for splitting existing files only.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Depends on:** [`file-organization/SKILL.md`](/skills/file-organization/SKILL.md) — load when naming or import-policy decisions arise. [`source-refactoring/SKILL.md`](/skills/source-refactoring/SKILL.md) — load when the split includes broader behavior-preserving refactor work.

## Full reference

[docs/file-splitting-reference.md](/docs/file-splitting-reference.md) — load on demand for the detailed step-by-step playbook.

## When invoked

**Preconditions:**
- Read the file to be split before starting.
- Identify all import sites for each symbol being moved (`grep` or search).
- Check `docs/ai/rules.md` for repo-wide constraints.

**Clarifying questions:**
- **Defaults (proceed without asking):** split all symbols into separate files; follow naming conventions from `file-organization` skill; colocate tests with source.
- **Always ask:** which file to split if not specified and cannot be inferred.
- State assumptions when proceeding: "Splitting `helpers.ts` into per-symbol files — let me know if a different scope was intended."

**Output format:**
- After edits, output a brief bullet list: which symbols moved, where they landed, which imports were updated, and which test files were moved or created.
- Run validation and report results.

**Error handling:**
- If tests fail after a split, report the failure verbatim and fix import paths or re-exports before declaring success.
- If a symbol has circular dependencies that prevent extraction, stop and report — do not force the split.

## Quick rules

- **No barrel re-exports** — do not create `index.ts` that re-exports the split files.
- **Preserve JSDoc** — carry over all JSDoc comments when moving symbols.
- **Default export for single-export files** — when a new file contains a single
  exported function (or class) make that symbol the `default` export. This
  reduces churn at call sites when the symbol is renamed or when the file is
  moved, and it matches repository style where single-export modules are
  preferred as default exports.

- **Remove leftover "moved" comments** — do not leave behind lines such as
  `// \\`symbol\\` moved to ./path` after extracting a symbol. Always remove
  temporary or human-facing comments that reference the refactor location; if
  a reference is useful, add it to the commit message or PR description
  instead of leaving it in the codebase.

- **Split large functions into their own files** — if a function is medium or large
  (subjective, but typically > ~20 or more lines or containing distinct
  responsibilities), extract it into its own module. Name the file after the
  function, export the function as the default (single-export modules), and
  update import sites. This keeps modules small and reviewable and matches the
  repository's single-export default-export convention.

  Quick validation: after splitting, run

  ```bash
  git grep -n "\\`\w\+\\` moved to" || true
  npm run lint
  ```
  to ensure no leftover "moved" comments remain and lint passes.
- **Strict prohibition: do NOT leave "moved" comments in code**

- Never leave temporary refactor comments in source that state a symbol was
  "moved to" another file (for example: `// ensureConfigFile moved to
  ./ensureConfigFile.ts`). These lines are forbidden in the codebase and must
  be removed before committing. If a migration note is needed for reviewers,
  include it in the PR description or commit message instead.

- Forbidden pattern (grep for it):

  ```bash
  git grep -nE "^\s*//.*\\bmoved to\\b.*$" || true
  ```

  If this finds any matches, remove them before committing; treat a match as
  a blocking issue during code review.
- **Colocate tests** — move or create a `*.test.ts` next to each new source file.
- **Absolute imports for shared test helpers** — use `@/` aliases rather than relative paths when helpers are reused across test directories.
- **No module-level side effects** in test helper modules.
- **Remove the consolidated file** once all symbols have been migrated.

## Validation

```bash
npm run test:unit -- path/to/changed.test.ts
npm run lint
```

## Evaluations (I/O examples)

**Input:** "Split `shared/src/utils/helpers.ts` into separate files"
**Expected:** Agent reads the file, identifies each exported symbol, creates one file per symbol named after the symbol, updates all import sites, moves or creates colocated tests, removes the original file if empty, runs lint + tsc + targeted tests, reports a bullet list of what moved where.

**Input:** "Extract the `formatDate` helper to its own file"
**Expected:** Agent reads the source file, creates `formatDate.ts` next to it, moves the function and its JSDoc, updates the one or two import sites, runs validation. Does not create a barrel re-export.

**Input:** "Split this file" (no file specified)
**Expected:** Agent asks which file to split before proceeding.

## Do not

- Do not violate repo-wide rules in `docs/ai/rules.md`.
- Do not create barrel `index.ts` re-exports.
- Do not drop JSDoc when moving symbols.
- Do not expand scope beyond the requested task without calling it out.
