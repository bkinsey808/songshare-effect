import { expect } from "vitest";

/**
 * Asserts the guard returns false for null input.
 * Extracted to test-util so oxlint-disable can live outside the test file.
 *
 * @param guard - Type guard under test.
 * @returns void
 */
export default function expectGuardRejectsNull(guard: (value: unknown) => boolean): void {
	/* oxlint-disable-next-line unicorn/no-null -- must pass null to verify guard rejects it */
	expect(guard(null)).toBe(false);
}
