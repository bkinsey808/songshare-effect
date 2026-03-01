import getStringField from "@/shared/utils/getStringField";

/**
 * Default deep equality comparison for objects and arrays.
 *
 * Returns true if states are different (has changes).
 *
 * @param current - Current value to compare
 * @param initial - Initial value to compare against
 * @returns true if values are different, false if they are equal
 */
export default function defaultCompare<StateType>(current: StateType, initial: StateType): boolean {
	// Primitive comparison
	if (current === initial) {
		return false;
	}

	// Handle null/undefined
	if (current === null || initial === null || current === undefined || initial === undefined) {
		return current !== initial;
	}

	// Array comparison
	if (Array.isArray(current) && Array.isArray(initial)) {
		if (current.length !== initial.length) {
			return true;
		}
		return current.some((item, index) => defaultCompare(item, initial[index]));
	}

	// Object comparison
	if (
		typeof current === "object" &&
		typeof initial === "object" &&
		current !== null &&
		initial !== null
	) {
		const currentKeys = Object.keys(current);
		const initialKeys = Object.keys(initial);

		if (currentKeys.length !== initialKeys.length) {
			return true;
		}

		return currentKeys.some((key) => {
			// Use `getField` helper (centralized) to read the property as `unknown`.
			const currentValue = getStringField(current, key);
			const initialValue = getStringField(initial, key);
			return defaultCompare(currentValue, initialValue);
		});
	}

	// Fallback to strict equality
	return current !== initial;
}
