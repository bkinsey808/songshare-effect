// Small, well-named constants replace magic numbers and keep lint rules happy.
const STRING_RADIX_BASE36 = 36;
const ID_SUBSTRING_FROM = 2;

/**
 * Generate a random ID
 * @returns a unique-ish string id
 */
export default function generateId(): string {
	return (
		Math.random().toString(STRING_RADIX_BASE36).slice(ID_SUBSTRING_FROM) +
		Date.now().toString(STRING_RADIX_BASE36)
	);
}
