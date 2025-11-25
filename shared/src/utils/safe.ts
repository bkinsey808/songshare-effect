/** Safely get a property from an object, avoiding prototype pollution and unsafe access */
export function safeGet<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	key: K,
): T[K] | undefined;
export function safeGet<
	T extends Record<string, unknown>,
	K extends keyof T,
	V,
>(obj: T, key: K, defaultValue: V): T[K] | V;
export function safeGet<
	T extends Record<string, unknown>,
	K extends keyof T,
	V,
>(obj: T, key: K, defaultValue?: V): T[K] | V | undefined {
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
	T extends Record<string, unknown>,
	K extends keyof T,
>(obj: T, key: K): T[K] {
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
export function safeArrayGet<T>(
	arr: ReadonlyArray<T>,
	idx: number,
	defaultValue?: T,
): T | undefined {
	if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return arr[idx];
	}
	return defaultValue;
}

/**
 * Safely set an element in an array by index, avoiding out-of-bounds errors.
 * Returns a new array with the value set if the index is valid, otherwise returns the original array.
 */
export function safeArraySet<T>(
	arr: ReadonlyArray<T>,
	idx: number,
	value: T,
): ReadonlyArray<T> {
	if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
		// Use spread to produce a mutable copy from a ReadonlyArray<T>.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-spread, typescript/no-unsafe-spread, @typescript-eslint/no-unsafe-assignment
		const copy = [...arr];
		copy[idx] = value;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return copy;
	}
	return arr;
}
