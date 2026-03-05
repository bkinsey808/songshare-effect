# Strict TypeScript Patterns

This document captures comprehensive patterns and solutions for working with strict TypeScript configurations, particularly when dealing with external APIs, JSON parsing, and database clients.

> **Quick Reference**: For common lint errors, see [lint-quick-reference.md](./lint-quick-reference.md)
> **Cursor Rule**: For concise guidance, see [.cursor/rules/lint-resolution-agent.mdc](../.cursor/rules/lint-resolution-agent.mdc)

## Project Configuration Context

This project uses extremely strict TypeScript and ESLint configurations:

- `exactOptionalPropertyTypes: true`
- `noPropertyAccessFromIndexSignature: true`
- `@typescript-eslint/no-unsafe-*` rules enabled
- `@typescript-eslint/strict-boolean-expressions` enabled
- `@typescript-eslint/no-explicit-any` enabled

## Common Integration Challenges & Solutions

### 1. Supabase Client Integration

**Challenge**: Supabase client methods return `any` types, causing unsafe assignment errors.

**Solution**: Use type guards and explicit typing:

```typescript
// Type guard for Supabase results
function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
  return typeof value === 'object' && value !== null && 'data' in value && 'error' in value;
}

// Usage pattern
const result: unknown = await supabaseQuery;
if (!isSupabaseResult(result)) {
  throw new Error('Invalid Supabase result');
}

const { data, error } = result;
if (error !== null && error !== undefined) {
  throw new Error(error instanceof Error ? error.message : 'Database query failed');
}
```

### 2. JSON API Response Handling

**Challenge**: `res.json()` returns `any`, requiring safe type assertions.

**Solution**: Type guards with validation:

```typescript
// Generic API response type guard
function isApiResponse<T>(
  value: unknown, 
  dataValidator: (data: unknown) => data is T
): value is { data: T } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    dataValidator((value as { data: unknown }).data)
  );
}

// Usage
const jsonData: unknown = await res.json();
if (!isApiResponse(jsonData, isUserArray)) {
  throw new Error('Invalid API response format');
}
const { data } = jsonData;
```

### 3. Request Body Validation

**Challenge**: Request bodies from HTTP handlers are `unknown` and need validation.

**Solution**: Comprehensive validation with type guards:

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidItemType(value: unknown): value is 'song' | 'playlist' | 'event' {
  return typeof value === 'string' && ['song', 'playlist', 'event'].includes(value);
}

function extractCreateRequest(request: unknown): CreateRequest {
  if (!isRecord(request)) {
    throw new TypeError("Request must be an object");
  }

  const { item_type, name } = request;
  
  if (typeof name !== 'string') {
    throw new TypeError("name must be a string");
  }
  
  if (!isValidItemType(item_type)) {
    throw new TypeError("item_type must be one of: song, playlist, event");
  }

  return { item_type, name };
}
```

### 4. exactOptionalPropertyTypes Handling

**Challenge**: Optional properties can't receive `T | undefined`, only `T` or omission.

**Solution**: Conditional spread pattern:

```typescript
// ❌ FAILS: passes `string | undefined` where `string?` expected
function MyComponent({ optionalProp }: { optionalProp?: string }) {
  return <ChildComponent optionalProp={optionalProp} />; // Type error!
}

// ✅ GOOD: conditional spread
function MyComponent({ optionalProp }: { optionalProp?: string }) {
  return (
    <ChildComponent 
      {...(optionalProp !== undefined && { optionalProp })} 
    />
  );
}
```

### 5. Index Signature Access

**Challenge**: `noPropertyAccessFromIndexSignature` requires bracket notation.

**Solution**: Use bracket notation with proper null checks:

```typescript
// ❌ BAD: Dot notation on index signature
function processObject(obj: Record<string, unknown>) {
  return obj.someProperty; // Error!
}

// ✅ GOOD: Bracket notation with validation
function processObject(obj: Record<string, unknown>) {
  const value = obj['someProperty'];
  return value !== null && value !== undefined ? value : 'default';
}
```

## Type Guard Library

### Basic Type Guards

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}
```

### Enum/Union Type Guards

```typescript
function isValidStatus(value: unknown): value is 'pending' | 'accepted' | 'rejected' {
  return typeof value === 'string' && ['pending', 'accepted', 'rejected'].includes(value);
}

function isValidRole(value: unknown): value is 'admin' | 'user' | 'guest' {
  return typeof value === 'string' && ['admin', 'user', 'guest'].includes(value);
}
```

### Object Shape Type Guards

```typescript
function hasId(obj: unknown): obj is { id: string } {
  return isRecord(obj) && typeof obj['id'] === 'string';
}

function hasRequiredUserFields(obj: unknown): obj is { id: string; email: string } {
  return (
    isRecord(obj) &&
    typeof obj['id'] === 'string' &&
    typeof obj['email'] === 'string'
  );
}
```

## Error Handling Patterns

### Database Errors

```typescript
function handleDatabaseError(error: unknown): never {
  if (error instanceof Error) {
    throw new DatabaseError({ message: error.message });
  }
  throw new DatabaseError({ message: 'Unknown database error' });
}
```

### API Errors

```typescript
function handleApiError(error: unknown): never {
  const message = error instanceof Error 
    ? error.message 
    : 'API request failed';
  throw new Error(message);
}
```

## Performance Considerations

### Function Scoping

Move type guards and utility functions to module scope to avoid recreation:

```typescript
// ✅ GOOD: Module-scoped functions
function isValidUser(value: unknown): value is User {
  return isRecord(value) && typeof value['id'] === 'string';
}

function processUsers(data: unknown[]) {
  return data.filter(isValidUser); // Reuses same function reference
}
```

### Memoization

For expensive validation, consider memoization:

```typescript
const validationCache = new WeakMap<object, boolean>();

function isValidComplexObject(obj: unknown): obj is ComplexObject {
  if (typeof obj === 'object' && obj !== null) {
    if (validationCache.has(obj)) {
      return validationCache.get(obj)!;
    }
    
    const isValid = /* expensive validation */;
    validationCache.set(obj, isValid);
    return isValid;
  }
  return false;
}
```

## Testing Type Guards

```typescript
// Test type guards thoroughly
describe('isValidUser', () => {
  it('accepts valid user objects', () => {
    expect(isValidUser({ id: '123', name: 'John' })).toBe(true);
  });
  
  it('rejects invalid objects', () => {
    expect(isValidUser(null)).toBe(false);
    expect(isValidUser({})).toBe(false);
    expect(isValidUser({ id: 123 })).toBe(false); // wrong type
  });
});
```

## Migration Strategy

When adding strict typing to existing code:

1. **Start with `unknown`**: Replace `any` with `unknown`
2. **Add type guards**: Create validation functions
3. **Test thoroughly**: Ensure runtime safety
4. **Refactor incrementally**: Don't change everything at once

## Advanced Patterns

### Complex Validation Chains

For complex objects with nested validation:

```typescript
function isValidUserWithProfile(value: unknown): value is UserWithProfile {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['email'] === 'string' &&
    isRecord(value['profile']) &&
    typeof value['profile']['name'] === 'string'
  );
}
```

### Generic Type Guards

For reusable validation patterns:

```typescript
function hasProperty<K extends string>(
  obj: unknown, 
  key: K
): obj is Record<K, unknown> {
  return isRecord(obj) && key in obj;
}

function isArrayOf<T>(
  value: unknown, 
  itemValidator: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemValidator);
}
```

### Effect-TS Integration

When using Effect-TS with strict typing:

```typescript
import { Effect, Schema } from "effect";

// Use Schema for validation instead of manual type guards
const UserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.optional(Schema.String)
});

function validateUser(data: unknown): Effect.Effect<User, ValidationError> {
  return Schema.decodeUnknown(UserSchema)(data);
}
```

## Troubleshooting Guide

### When Type Guards Fail

1. **Check for null/undefined**: Always handle these cases explicitly
2. **Array vs Object**: Use `Array.isArray()` to distinguish
3. **Nested Properties**: Validate each level separately
4. **Union Types**: Create separate guards for each variant

### Performance Issues

1. **Move guards to module scope**: Avoid recreation
2. **Cache validation results**: Use WeakMap for expensive checks
3. **Early returns**: Fail fast on obvious mismatches

### Common Gotchas

1. **`typeof null === 'object'`**: Always check `value !== null`
2. **Empty arrays are truthy**: Use `array.length > 0` if needed
3. **NaN is a number**: Use `Number.isNaN()` for validation
4. **Prototype pollution**: Be careful with `in` operator

## References

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
- [Effect-TS Schema](https://effect.website/docs/schema/introduction)