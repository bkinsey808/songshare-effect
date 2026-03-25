---
name: lint-error-resolution
description: Guide for resolving lint errors in strict TypeScript environments. Use when encountering ESLint, TypeScript, or oxlint errors.
compatibility: TypeScript 5.x, ESLint 9.x, oxlint
metadata:
  author: bkinsey808
  version: "2.1"
---

# Lint Error Resolution Skill

## Use When

Use this skill when:

- The task mentions lint, TypeScript errors, ESLint, oxlint, or failing CI checks.
- Any command output contains lint/type errors in files being edited.

Execution workflow:

1. Run `npm run lint` to see all errors.
2. Fix root causes — do not suppress rules without explicit justification.
3. Re-run `npm run lint` to confirm clean.

**❌ AVOID** disabling rules. **✅ PREFER** fixing the root cause.

---

## Quick Lookup — Common Errors

Full patterns with examples live in **[docs/lint-quick-reference.md](../../../docs/lint-quick-reference.md)**.

Deep links by topic:

| Error                                                       | Doc section                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `no-unsafe-type-assertion` in API handlers                  | [→ API Handler Patterns](../../../docs/lint-quick-reference.md#no-unsafe-type-assertion--request-validation)                                     |
| `no-unsafe-assignment` / dynamic Supabase tables            | [→ Dynamic Tables](../../../docs/lint-quick-reference.md#no-unsafe-assignment--no-unsafe-call--no-unsafe-member-access--dynamic-supabase-tables) |
| "All if-else branches same code" (Supabase)                 | [→ Supabase Error Check](../../../docs/lint-quick-reference.md#all-if-else-branches-contain-same-code--supabase-error-check)                     |
| `SupabaseFromLike` optional method chain                    | [→ Use callSelect](../../../docs/lint-quick-reference.md#supabasefromlike-optional-method-chain--use-callselect)                                 |
| `id-length`                                                 | [→ id-length](../../../docs/lint-quick-reference.md#id-length--variable-names-too-short)                                                         |
| `no-magic-numbers`                                          | [→ no-magic-numbers](../../../docs/lint-quick-reference.md#no-magic-numbers)                                                                     |
| `no-negated-condition`                                      | [→ no-negated-condition](../../../docs/lint-quick-reference.md#no-negated-condition)                                                             |
| `prefer-number-properties`                                  | [→ prefer-number-properties](../../../docs/lint-quick-reference.md#prefer-number-properties)                                                     |
| `curly`                                                     | [→ curly](../../../docs/lint-quick-reference.md#curly--always-use-braces)                                                                        |
| `consistent-type-imports`                                   | [→ type imports](../../../docs/lint-quick-reference.md#consistent-type-imports--type-only-imports)                                               |
| `--isolatedDeclarations`                                    | [→ isolatedDeclarations](../../../docs/lint-quick-reference.md#--isolateddeclarations--explicit-type-annotations-on-exports)                     |
| `unicorn/no-array-sort`                                     | [→ toSorted](../../../docs/lint-quick-reference.md#unicornno-array-sort--use-tosorted)                                                           |
| `unicorn/catch-error-name`                                  | [→ catch name](../../../docs/lint-quick-reference.md#unicorncatch-error-name--name-catch-parameter-error)                                        |
| `require-useeffect-comment`                                 | [→ useEffect comment](../../../docs/lint-quick-reference.md#require-useeffect-comment--comment-before-useeffect)                                 |
| `strict-boolean-expressions` / `exactOptionalPropertyTypes` | [→ General TS Rules](../../../docs/lint-quick-reference.md#general-typescript--eslint-rules)                                                     |

---

## When to Disable Rules (Rare)

Only for third-party library compatibility, generated code, or temporary workarounds with a TODO:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: Add proper typing
const legacyData = oldLibrary.getData();
```

---

## References

- **Full patterns**: [docs/lint-quick-reference.md](../../../docs/lint-quick-reference.md)
- **Tools & config**: [docs/linting-and-formatting.md](../../../docs/linting-and-formatting.md)
- **API endpoint workflow**: [.agent/workflows/add-api-endpoint.md](../../../.agent/workflows/add-api-endpoint.md)
- **Hono patterns**: [../hono-api-patterns/SKILL.md](../hono-api-patterns/SKILL.md)
- **Project rules**: [.agent/rules.md](../../../.agent/rules.md)

## Do Not

- Do not suppress lint rules without explicit justification.
- Do not expand scope beyond the requested task.
- Do not violate repo-wide rules in `.agent/rules.md`.
