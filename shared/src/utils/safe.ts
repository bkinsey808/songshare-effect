// Small numeric helpers used to avoid magic-number complaints from lint.
const ZERO = 0;
/** Safely get a property from an object, avoiding prototype pollution and unsafe access */
export function safeGet<
	TValue extends Record<string, unknown>,
	Key extends keyof TValue,
>(obj: TValue, key: Key): TValue[Key] | undefined;
export function safeGet<
	TValue extends Record<string, unknown>,
	Key extends keyof TValue,
	Value,
>(obj: TValue, key: Key, defaultValue: Value): TValue[Key] | Value;
export function safeGet<
	TValue extends Record<string, unknown>,
	Key extends keyof TValue,
	Value,
>(
	obj: TValue,
	key: Key,
	defaultValue?: Value,
): TValue[Key] | Value | undefined {
	if (Object.hasOwn(obj, key)) {
		return obj[key];
	}
	return defaultValue;
}

/**
 * Type-safe property getter for objects with known keys.
 * Use this when you are certain the key exists on the object (e.g., after schema validation or with enum-like objects).
 * Unlike safeGet, this will not return undefined and does not require a default value or optional chaining.
 * Prefer superSafeGet for cases where the key is guaranteed valid at compile time for stricter type safety and cleaner code.
 */
export function superSafeGet<
	TValue extends Record<string, unknown>,
	Key extends keyof TValue,
>(obj: TValue, key: Key): TValue[Key] {
	if (!Object.hasOwn(obj, key)) {
		throw new Error(`superSafeGet: missing key ${String(key)}`);
	}
	return obj[key];
}

// src/features/utils/safeSet.ts
/** Safely set a property on an object, avoiding prototype pollution and unsafe access */
export function safeSet(
	obj: Readonly<Record<string, unknown>>,
	key: string,
	value: unknown,
): void {
	if (key !== "__proto__" && key !== "constructor" && key !== "prototype") {
		// Only set if not polluting prototype
		(obj as Record<string, unknown>)[key] = value;
	}
}

/**
 * Safely delete a property from an object, avoiding prototype pollution and unsafe access.
 * Returns true if the property was deleted, false otherwise.
 */
export default function safeDelete(
	obj: Readonly<Record<string, unknown>>,
	key: string,
): boolean {
	if (Object.hasOwn(obj, key)) {
		return delete (obj as Record<string, unknown>)[key];
	}
	return false;
}

/**
 * Safely get an element from an array by index, avoiding out-of-bounds errors.
 * Returns the element if the index is valid, otherwise returns the default value (or undefined).
 */
export function safeArrayGet<TItem>(
	arr: ReadonlyArray<TItem>,
	idx: number,
	defaultValue?: TItem,
): TItem | undefined;
export function safeArrayGet(
	arr: ReadonlyArray<unknown>,
	idx: number,
	defaultValue?: unknown,
): unknown;
export function safeArrayGet(
	arr: ReadonlyArray<unknown>,
	idx: number,
	defaultValue?: unknown,
): unknown {
	if (Array.isArray(arr) && idx >= ZERO && idx < arr.length) {
		// Implementation uses `unknown` to avoid returning `any` in the
		// generic implementation body which could be flagged by the
		// `no-unsafe-return` rule. The typed overload above ensures callers
		// still get the correct inferred item type when they pass typed
		// arrays.
		return arr[idx];
	}
	return defaultValue;
}

/**
 * Safely set an element in an array by index, avoiding out-of-bounds errors.
 * Returns a new array with the value set if the index is valid, otherwise returns the original array.
 */
export function safeArraySet<TItem>(
	arr: ReadonlyArray<TItem>,
	idx: number,
	value: TItem,
): ReadonlyArray<TItem>;
export function safeArraySet(
	arr: ReadonlyArray<unknown>,
	idx: number,
	value: unknown,
): ReadonlyArray<unknown>;
export function safeArraySet(
	arr: ReadonlyArray<unknown>,
	idx: number,
	value: unknown,
): ReadonlyArray<unknown> {
	if (Array.isArray(arr) && idx >= ZERO && idx < arr.length) {
		// Use Array.from to produce a mutable copy from a ReadonlyArray<T>.
		const copy = Array.from(arr);
		// Assigning a value of unknown is safe in this implementation; callers
		// get the correct typed overload when they pass a typed array.
		(copy as unknown[])[idx] = value;
		return copy;
	}
	return arr;
}
