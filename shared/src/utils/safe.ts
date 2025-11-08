/** Safely get a property from an object, avoiding prototype pollution and unsafe access */
// eslint-disable-next-line max-params
export function safeGet<
	T extends Record<string, unknown>,
	K extends keyof T,
	V = T[K] | undefined,
>(obj: T, key: K, defaultValue?: V): T[K] | V {
	if (Object.hasOwn(obj, key)) {
		// eslint-disable-next-line security/detect-object-injection
		return obj[key];
	}
	// TypeScript knows defaultValue is V, so this is safe
	return defaultValue as V;
}

/**
 * Type-safe property getter for objects with known keys.
 * Use this when you are certain the key exists on the object (e.g., after schema validation or with enum-like objects).
 * Unlike safeGet, this will not return undefined and does not require a default value or optional chaining.
 * Prefer superSafeGet for cases where the key is guaranteed valid at compile time for stricter type safety and cleaner code.
 */
export function superSafeGet<
	T extends Record<string, unknown>,
	K extends keyof T,
>(obj: T, key: K): T[K] {
	return safeGet(obj, key);
}

// src/features/utils/safeSet.ts
/** Safely set a property on an object, avoiding prototype pollution and unsafe access */
// eslint-disable-next-line max-params
export function safeSet(
	obj: Record<string, unknown>,
	key: string,
	value: unknown,
): void {
	if (key !== "__proto__" && key !== "constructor" && key !== "prototype") {
		// Only set if not polluting prototype
		// eslint-disable-next-line security/detect-object-injection, no-param-reassign
		obj[key] = value;
	}
}

/**
 * Safely delete a property from an object, avoiding prototype pollution and unsafe access.
 * Returns true if the property was deleted, false otherwise.
 */
export default function safeDelete(
	obj: Record<string, unknown>,
	key: string,
): boolean {
	if (Object.hasOwn(obj, key)) {
		// eslint-disable-next-line security/detect-object-injection, no-param-reassign, @typescript-eslint/no-dynamic-delete
		return delete obj[key];
	}
	return false;
}

/**
 * Safely get an element from an array by index, avoiding out-of-bounds errors.
 * Returns the element if the index is valid, otherwise returns the default value (or undefined).
 */
// eslint-disable-next-line max-params
export function safeArrayGet<T>(
	arr: T[],
	idx: number,
	defaultValue?: T,
): T | undefined {
	if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
		// eslint-disable-next-line security/detect-object-injection
		return arr[idx];
	}
	return defaultValue;
}

/**
 * Safely set an element in an array by index, avoiding out-of-bounds errors.
 * Returns a new array with the value set if the index is valid, otherwise returns the original array.
 */
// eslint-disable-next-line max-params
export function safeArraySet<T>(arr: T[], idx: number, value: T): T[] {
	if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
		const copy = [...arr];
		// eslint-disable-next-line security/detect-object-injection
		copy[idx] = value;
		return copy;
	}
	return arr;
}
