---
name: lint-error-resolution
description: Guide for resolving lint errors in strict TypeScript environments. Use when encountering ESLint, TypeScript, or oxlint errors.
compatibility: TypeScript 5.x, ESLint 9.x, oxlint
metadata:
  author: bkinsey808
  version: "1.0"
---

# Lint Error Resolution Skill

## Use When

Use this skill when:

- The task mentions lint, TypeScript errors, ESLint, oxlint, or failing CI checks related to static analysis.
- Any command output contains lint/type errors in files being edited.

Execution workflow:

1. Run the narrowest failing check first (single file or targeted command).
2. Fix root causes in source code; do not suppress rules unless explicitly justified.
3. Re-run the same narrow check.
4. Run `npm run lint` before finalizing broader lint/type work.

Output requirements:

- Report exact rules/errors fixed and files changed.
- If any suppression is added, include the rule name and one-line justification.

## Philosophy: Fix Root Causes, Not Symptoms

**❌ AVOID**: Disabling lint rules with `eslint-disable` comments
**✅ PREFER**: Solving the underlying type safety or code quality issue

This project uses strict linting rules to enforce type safety and code quality. When you encounter lint errors, focus on improving the code rather than suppressing warnings.

## Quick Solutions for Common Errors

### `no-unsafe-type-assertion`

```typescript
// ❌ BAD: Unsafe assertion
const data = response as { user: User };

// ✅ GOOD: Type guard with validation
function isUserResponse(value: unknown): value is { user: User } {
	return typeof value === "object" && value !== null && "user" in value;
}
if (!isUserResponse(response)) throw new Error("Invalid response");
const data = response;
```

### `no-unsafe-assignment`

```typescript
// ❌ BAD: Unsafe assignment
const result = await query;

// ✅ GOOD: Type guard for API results
const result: unknown = await query;
if (!isSupabaseResult(result)) throw new Error("Invalid result");
const { data, error } = result;
```

### `strict-boolean-expressions`

```typescript
// ❌ BAD: Implicit truthiness
if (nullableString) {
}

// ✅ GOOD: Explicit null/undefined checks
if (nullableString !== null && nullableString !== undefined) {
}
```

### `exactOptionalPropertyTypes`

```typescript
// ❌ BAD: Type error with exactOptionalPropertyTypes
<Component optionalProp={maybeUndefined} />

// ✅ GOOD: Conditional spread pattern
<Component {...(maybeUndefined !== undefined && { optionalProp: maybeUndefined })} />
```

### `init-declarations`

```typescript
// ❌ BAD: Uninitialized variable
let query: unknown;

// ✅ GOOD: Initialize on declaration
let query: unknown = undefined;
```

### `consistent-function-scoping`

```typescript
// ❌ BAD: Function recreated on every call
function parent() {
	function helper() {
		return true;
	}
	return helper;
}

// ✅ GOOD: Move to outer scope
function helper() {
	return true;
}
function parent() {
	return helper;
}
```

## Essential Type Guards

```typescript
// Basic validation
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// API result validation
function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
	return isRecord(value) && "data" in value && "error" in value;
}

// Enum validation
function isValidStatus(value: unknown): value is "pending" | "accepted" | "rejected" {
	return typeof value === "string" && ["pending", "accepted", "rejected"].includes(value);
}
```

## Error Resolution Workflow

1. **Identify Error Type**: TypeScript vs ESLint vs oxlint
2. **Choose Strategy**: Type guards, explicit typing, code restructuring
3. **Validate Solution**: Run `npm run lint`

## When to Disable Rules (Rare)

Only for:

- Third-party library compatibility
- Temporary workarounds with TODO comments
- Generated code

Always include specific rule name and explanation:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: Add proper typing
const legacyData = oldLibrary.getData();
```

## References

- **Full Documentation**: [docs/strict-typescript-patterns.md](../../../docs/strict-typescript-patterns.md)
- **Quick Reference**: [docs/lint-quick-reference.md](../../../docs/lint-quick-reference.md)
- **Cursor Rule**: [.cursor/rules/lint-resolution-agent.mdc](../../../.cursor/rules/lint-resolution-agent.mdc)
- [TypeScript Conventions](../typescript-conventions/SKILL.md)
- [React Conventions](../react-conventions/SKILL.md)

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If errors are mostly TypeScript strictness problems, also load `typescript-conventions`.
- If lint failures are in React files, also load `react-conventions`.
