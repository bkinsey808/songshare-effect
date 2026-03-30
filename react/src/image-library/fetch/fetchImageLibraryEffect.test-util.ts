import { expect } from "vitest";

/**
 * Builds a matcher for the entries record passed to `setImageLibraryEntries`.
 *
 * Extracted to a test-util because nested `expect.objectContaining` triggers
 * `no-unsafe-assignment`; the disable lives here per project convention.
 *
 * @param entries - Expected image library entries keyed by id.
 * @returns An `expect.objectContaining` matcher for the provided entries.
 */
export default function expectedEntriesMatcher(
	entries: Record<string, { image_id: string; user_id: string }>,
): ReturnType<typeof expect.objectContaining> {
	/* oxlint-disable-next-line typescript/no-unsafe-assignment -- Vitest matchers use any internally */
	return expect.objectContaining(
		Object.fromEntries(
			Object.entries(entries).map(([key, val]) => [
				key,
				/* oxlint-disable-next-line typescript/no-unsafe-assignment -- Vitest matchers use any internally */
				expect.objectContaining(val),
			]),
		),
	);
}
