# Lint Error Quick Reference

Quick solutions for the most common lint errors in this strict TypeScript project.

## 🚨 Most Common Errors

### `no-unsafe-type-assertion`
```typescript
// ❌ BAD
const data = response as UserData;

// ✅ GOOD
function isUserData(value: unknown): value is UserData {
  return typeof value === 'object' && value !== null && 'id' in value;
}
if (!isUserData(response)) throw new Error('Invalid data');
const data = response;
```

### `no-unsafe-assignment`
```typescript
// ❌ BAD
const result = await apiCall();

// ✅ GOOD
const result: unknown = await apiCall();
if (!isValidResult(result)) throw new Error('Invalid result');
```

### `strict-boolean-expressions`
```typescript
// ❌ BAD
if (nullableString) { }

// ✅ GOOD
if (nullableString !== null && nullableString !== undefined) { }
```

### `exactOptionalPropertyTypes`
```typescript
// ❌ BAD
<Component optionalProp={maybeUndefined} />

// ✅ GOOD
<Component {...(maybeUndefined !== undefined && { optionalProp: maybeUndefined })} />
```

### `init-declarations`
```typescript
// ❌ BAD
let query: unknown;

// ✅ GOOD
let query: unknown = undefined;
```

### `no-confusing-void-expression`
```typescript
// ❌ BAD
onClick={() => setLoading(true)}

// ✅ GOOD
onClick={() => { setLoading(true); }}
```

## 🛠️ Essential Type Guards

```typescript
// Basic type guards
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// API result type guard
function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
  return isRecord(value) && 'data' in value && 'error' in value;
}

// Enum type guard
function isValidStatus(value: unknown): value is 'pending' | 'accepted' | 'rejected' {
  return typeof value === 'string' && ['pending', 'accepted', 'rejected'].includes(value);
}
```

## 🔄 Common Patterns

### JSON API Response
```typescript
const jsonData: unknown = await res.json();
if (!isValidApiResponse(jsonData)) {
  throw new Error('Invalid response');
}
const { data } = jsonData;
```

### Supabase Query
```typescript
const result: unknown = await query;
if (!isSupabaseResult(result)) {
  throw new Error('Invalid query result');
}
const { data, error } = result;
if (error !== null) {
  throw new Error(error instanceof Error ? error.message : 'Query failed');
}
```

### Request Validation
```typescript
function extractRequest(request: unknown): ValidRequest {
  if (!isRecord(request)) {
    throw new TypeError("Request must be an object");
  }
  
  const { field1, field2 } = request;
  
  if (!isString(field1)) {
    throw new TypeError("field1 must be a string");
  }
  
  return { field1, field2 };
}
```

## ⚡ Quick Commands

```bash
# Check types only
npx tsc -b . --noEmit

# Run full lint
npm run lint

# Build check
npm run build:client
```

## 📚 Full Documentation

- [Lint Error Resolution Skill](../.github/skills/lint-error-resolution/SKILL.md)
- [Strict TypeScript Patterns](./strict-typescript-patterns.md)
- [TypeScript Conventions](../.github/skills/typescript-conventions/SKILL.md)