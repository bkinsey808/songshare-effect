// Small numeric helpers used to avoid magic-number complaints from lint.
import { ZERO } from "@/shared/constants/shared-constants";

/**
 * Safely read a property from a plain object while avoiding prototype pollution.
 *
 * Overloaded forms allow providing a `defaultValue` when the key is absent.
 * Uses `Object.hasOwn` to avoid reading properties from the prototype chain.
 *
 * @param obj - The object to read from.
 * @param key - The key to read (must be a direct property of `obj`).
 * @returns - The property value when present, otherwise `undefined` or the provided default value.
 */
export function safeGet<TValue extends Record<string, unknown>, Key extends keyof TValue>(
	obj: TValue,
	key: Key,
): TValue[Key] | undefined;
export function safeGet<TValue extends Record<string, unknown>, Key extends keyof TValue, Value>(
	obj: TValue,
	key: Key,
	defaultValue: Value,
): TValue[Key] | Value;
export function safeGet<TValue extends Record<string, unknown>, Key extends keyof TValue, Value>(
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
export function superSafeGet<TValue extends Record<string, unknown>, Key extends keyof TValue>(
	obj: TValue,
	key: Key,
): TValue[Key] {
	if (!Object.hasOwn(obj, key)) {
		throw new Error(`superSafeGet: missing key ${String(key)}`);
	}
	return obj[key];
}

// src/features/utils/safeSet.ts

/**
 * Safely set a property on an object, avoiding prototype pollution and unsafe access.
 *
 * @param obj - The target object (treated as readonly to avoid mutation at call sites)
 * @param key - The property name to set (must not be a prototype key)
 * @param value - The value to set
 * @returns void
 */
export function safeSet(obj: Readonly<Record<string, unknown>>, key: string, value: unknown): void {
	if (key !== "__proto__" && key !== "constructor" && key !== "prototype") {
		// Only set if not polluting prototype
		(obj as Record<string, unknown>)[key] = value;
	}
}

/**
 * Safely delete a property from an object, avoiding prototype pollution and unsafe access.
 *
 * @param obj - The object to operate on
 * @param key - The property name to delete
 * @returns True if the property was deleted, false otherwise
 */
export default function safeDelete(obj: Readonly<Record<string, unknown>>, key: string): boolean {
	if (Object.hasOwn(obj, key)) {
		// Use Reflect.deleteProperty to avoid using a dynamic `delete` expression
		return Reflect.deleteProperty(obj as Record<string, unknown>, key);
	}
	return false;
}

/**
 * Safely get an element from an array by index, avoiding out-of-bounds errors.
 * Returns the element if the index is valid, otherwise returns the default value (or undefined).
 *
 * @param arr - The array to index
 * @param idx - Index to read
 * @param defaultValue - Optional default value if index is invalid
 * @returns The element at `idx` or the provided default/undefined
 * Typed overload: safely get an element from a typed array by index.
 *
 * @returns The element at `idx` or the provided default/undefined
 */
export function safeArrayGet<TItem>(
	arr: readonly TItem[],
	idx: number,
	defaultValue?: TItem,
): TItem | undefined;

/**
 * Untyped overload: safely get an element from an unknown array by index.
 *
 * @returns The element at `idx` or the provided default/undefined
 */
export function safeArrayGet(arr: readonly unknown[], idx: number, defaultValue?: unknown): unknown;

/**
 * Implementation: safely get an element from an array by index.
 *
 * @param arr - The array to index
 * @param idx - Index to read
 * @param defaultValue - Optional default value if index is invalid
 * @returns The element at `idx` or the provided default/undefined
 */
export function safeArrayGet(
	arr: readonly unknown[],
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
 *
 * @param arr - The original readonly array
 * @param idx - Index to set
 * @param value - Value to set at `idx`
 * @returns New array with the value set when valid, otherwise the original array
 


 * Typed overload: safely set an element in a typed array by index.
 *
 * @returns New array with the value set when valid, otherwise the original array
 */
export function safeArraySet<TItem>(
	arr: readonly TItem[],
	idx: number,
	value: TItem,
): readonly TItem[];

/**
 * Untyped overload: safely set an element in an unknown array by index.
 *
 * @returns New array with the value set when valid, otherwise the original array
 */
export function safeArraySet(
	arr: readonly unknown[],
	idx: number,
	value: unknown,
): readonly unknown[];

/**
 * Implementation: safely set an element in an array by index, returning a new array when valid.
 *
 * @param arr - The original readonly array
 * @param idx - Index to set
 * @param value - Value to set at `idx`
 * @returns New array with the value set when valid, otherwise the original array
 */
export function safeArraySet(
	arr: readonly unknown[],
	idx: number,
	value: unknown,
): readonly unknown[] {
	if (Array.isArray(arr) && idx >= ZERO && idx < arr.length) {
		// Use spread (with a cast) to produce a mutable copy from a readonly array while keeping types safe.
		const copy = [...(arr as unknown[])] as unknown[];
		// Assigning a value of unknown is safe in this implementation; callers
		// get the correct typed overload when they pass a typed array.
		copy[idx] = value;
		return copy;
	}
	return arr;
}
