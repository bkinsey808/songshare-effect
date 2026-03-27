---
name: lint-error-resolution
description: >
  Guide for resolving lint errors in strict TypeScript/React environments —
  oxlint, ESLint, and TypeScript compiler errors. Use when encountering lint,
  oxlint, ESLint, or tsc errors in files being edited. Do NOT use for runtime
  errors unrelated to linting or TypeScript compilation.
---

**Requires:** file-read, terminal (linter). No network access needed.

## When invoked

**Preconditions:**
- Read the file containing the error before attempting a fix.
- Obtain the exact error message and line number — do not guess the root cause.

**Clarifying questions:**
- **Defaults (proceed without asking):** fix the root cause; never suppress a rule without justification; use the lookup table below to find the right pattern.
- **Always ask:** for the full error output if only a vague description is provided.

**Output format:**
- Apply the fix directly. After the change, output one sentence explaining the root cause and what was changed.
- Run `npm run lint` to confirm clean; report result.

**Error handling:**
- If the error pattern is not in the lookup table, load [docs/lint-quick-reference.md](/docs/lint-quick-reference.md) for the full reference.
- If the fix requires a type change that cascades across multiple files, report the scope before proceeding and ask for direction.
- If a rule disable is genuinely the only option, output the exact disable comment with a `-- reason` annotation and explain why.

## Quick lookup — common errors

Full patterns with examples: **[docs/lint-quick-reference.md](/docs/lint-quick-reference.md)**

| Error | Doc section |
| ----- | ----------- |
| `no-unsafe-type-assertion` in API handlers | [→ API Handler Patterns](/docs/lint-quick-reference.md#no-unsafe-type-assertion--request-validation) |
| `no-unsafe-assignment` / dynamic Supabase tables | [→ Dynamic Tables](/docs/lint-quick-reference.md#no-unsafe-assignment--no-unsafe-call--no-unsafe-member-access--dynamic-supabase-tables) |
| "All if-else branches same code" (Supabase) | [→ Supabase Error Check](/docs/lint-quick-reference.md#all-if-else-branches-contain-same-code--supabase-error-check) |
| `SupabaseFromLike` optional method chain | [→ Use callSelect](/docs/lint-quick-reference.md#supabasefromlike-optional-method-chain--use-callselect) |
| `id-length` | [→ id-length](/docs/lint-quick-reference.md#id-length--variable-names-too-short) |
| `no-magic-numbers` | [→ no-magic-numbers](/docs/lint-quick-reference.md#no-magic-numbers) |
| `no-negated-condition` | [→ no-negated-condition](/docs/lint-quick-reference.md#no-negated-condition) |
| `prefer-number-properties` | [→ prefer-number-properties](/docs/lint-quick-reference.md#prefer-number-properties) |
| `curly` | [→ curly](/docs/lint-quick-reference.md#curly--always-use-braces) |
| `consistent-type-imports` | [→ type imports](/docs/lint-quick-reference.md#consistent-type-imports--type-only-imports) |
| `--isolatedDeclarations` | [→ isolatedDeclarations](/docs/lint-quick-reference.md#--isolateddeclarations--explicit-type-annotations-on-exports) |
| `unicorn/no-array-sort` | [→ toSorted](/docs/lint-quick-reference.md#unicornno-array-sort--use-tosorted) |
| `unicorn/catch-error-name` | [→ catch name](/docs/lint-quick-reference.md#unicorncatch-error-name--name-catch-parameter-error) |
| `require-useeffect-comment` | [→ useEffect comment](/docs/lint-quick-reference.md#require-useeffect-comment--comment-before-useeffect) |
| `strict-boolean-expressions` / `exactOptionalPropertyTypes` | [→ General TS Rules](/docs/lint-quick-reference.md#general-typescript--eslint-rules) |

## When to disable rules (rare)

Only for third-party library compatibility, generated code, or temporary workarounds with a TODO:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: Add proper typing
const legacyData = oldLibrary.getData();
```

## Evaluations (I/O examples)

**Input:** "I'm getting a `no-unsafe-type-assertion` error in my Hono handler"
**Expected:** Agent reads the handler file, finds the unsafe assertion, applies the safe request-validation pattern from the lookup table (or loads the doc section), runs `npm run lint` to confirm clean, explains the root cause in one sentence.

**Input:** "Can I just add `eslint-disable` here to make it go away?"
**Expected:** Agent answers: only acceptable for third-party library compatibility, generated code, or a temporary workaround with a `-- TODO:` annotation. Explains what fix should be applied instead and offers to apply it.

**Input:** "Fix all lint errors in this file"
**Expected:** Agent runs `npm run lint`, reads the file, fixes each error using the lookup table or doc, re-runs lint, reports which errors were fixed and how.

## References

- **Full patterns**: [docs/lint-quick-reference.md](/docs/lint-quick-reference.md)
- **Tools & config**: [docs/linting-and-formatting.md](/docs/linting-and-formatting.md)
- **Hono patterns**: [../hono-api-patterns/SKILL.md](/.github/skills/hono-api-patterns/SKILL.md)
- **Project rules**: [.agent/rules.md](/.agent/rules.md)

## Do not

- Do not suppress lint rules without explicit justification and `-- reason` annotation.
- Do not expand scope beyond the requested task.
- Do not violate repo-wide rules in `.agent/rules.md`.
