---
name: typescript-best-practices
description: >
  TypeScript conventions for this repo (no `any`, explicit return types, JSDoc,
  exactOptionalPropertyTypes, ambient types, import style). Use when authoring or
  editing any `.ts` or `.tsx` file, resolving TypeScript strictness errors, or
  fixing type-related lint failures. Do NOT use for React-specific typing patterns
  (see react-best-practices skill) or JSDoc-only changes (see code-comment-best-practices skill).
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Full reference:** [/docs/typescript-best-practices.md](/docs/typescript-best-practices.md)

## Use when

- Editing any `.ts` or `.tsx` file.
- Resolving TypeScript strictness or lint errors related to typing quality.

## Execution workflow

1. Apply relevant rules below (each links to the full doc for examples).
2. Keep changes minimal and local to the problem area.
3. Run `npm run lint` after meaningful TS changes.

## Key rules

- **No `any`** — use `unknown` + type guards instead.
  [→ full detail](/docs/typescript-best-practices.md#avoid-any)

- **Prefer `type` over `interface`** — for object shapes, unions, and function signatures.
  [→ full detail](/docs/typescript-best-practices.md#type-vs-interface)

- **Explicit return types** — always annotate function return types.
  [→ full detail](/docs/typescript-best-practices.md#explicit-return-types)

- **JSDoc on new/changed functions** — concise, purpose-focused, no type annotations in JSDoc.
  [→ code-comment-best-practices skill](/.github/skills/code-comment-best-practices/SKILL.md)

- **Ambient types** — `ReactElement` is ambient (no import needed); `ReactNode` must be imported.
  [→ full detail](/docs/typescript-best-practices.md#ambient-types)

- **Destructure params in signature** — destructure object parameters in the function signature, not the body.

- **`exactOptionalPropertyTypes`** — use conditional spread `...(x === undefined ? {} : { x })` to thread optional props; never pass `T | undefined` where `T` is expected.
  [→ full detail](/docs/typescript-best-practices.md#exactoptionalpropertytypes-handling)

- **No redundant casts** — prefer an explicit type annotation on the receiving variable over an inline `as` cast.
  [→ full detail](/docs/typescript-best-practices.md#avoiding-redundant-type-assertions)

- **`Set` from optional arrays** — `new Set(optionalArray)` needs no `?? []` fallback.
  [→ full detail](/docs/typescript-best-practices.md#strict-null-checks)

- **Type-only imports** — `import type { }` for all-type imports; inline `type` keyword for mixed imports.
  [→ full detail](/docs/typescript-best-practices.md#type-only-imports)

## Defaults (proceed without asking)

- Strict mode and `exactOptionalPropertyTypes: true` are always on.
- `no-null` lint rule is active; use `oxlint-disable-next-line no-null` only when clearing nullable FK columns.

## Output format

- Inline code edits only — no standalone files unless asked.
- After edits, summarize which rules were applied; note any unavoidable tradeoffs (e.g., a temporary `as` assertion with justification).

## Validation

```bash
npm run lint       # lint (always from project root)
npm run test:unit  # when behavior is non-trivial
```

## Skill handoffs

- Lint failures → also load `lint-error-resolution`.
- React-focused edits → also load `react-best-practices`.
- JSDoc-only changes → load `code-comment-best-practices`.
