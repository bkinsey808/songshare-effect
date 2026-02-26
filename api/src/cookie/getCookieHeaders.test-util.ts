import type { Mock } from "vitest";

/**
 * Extracts cookie header values from a Vitest spy on `res.headers.append`.
 *
 * This helper centralizes the unsafe casts required to inspect Vitest mock
 * calls, so individual tests don't need their own oxlint-disable comments.
 *
 * @param appendSpy - The Vitest mock function that was called with (name, value)
 * @returns Array of header values (the second argument of each call)
 */
export default function getCookieHeaders(
	appendSpy: Mock | ((name: string, value: string) => void),
): string[] {
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only cast from Vitest mock calls */
	const calls = (appendSpy as Mock).mock.calls as unknown as [string, string][];
	return calls.map(([_name, value]) => value);
}
