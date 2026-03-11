import { expect } from "vitest";

const CALL_INDEX = 0;
const ARG_INDEX = 0;

/**
 * Asserts addOrUpdatePublicSongs was called with an argument that has an "s1" key.
 * Extracted to test-util to avoid no-unsafe-assignment from Vitest matchers in test files.
 */
export default function expectAddOrUpdatePublicSongsCalledWithS1(mock: {
	mock: { calls: unknown[][] };
}): void {
	/* oxlint-disable-next-line typescript/no-unsafe-assignment -- mock.calls typed as any[][] */
	const arg = mock.mock.calls[CALL_INDEX]?.[ARG_INDEX];
	expect(arg).toBeDefined();
	expect(typeof arg === "object" && arg !== null && "s1" in arg).toBe(true);
}
