import { vi } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

/**
 * Centralize mocks for `decodeUnknownSyncOrThrow` so tests don't need
 * to include inline `oxlint-disable` comments for unsafe returns.
 */
export function mockDecodeReturn(value: unknown): void {
	// test-only cast: convert `unknown` into the function's return type
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test-only narrow cast */
	vi.mocked(decodeUnknownSyncOrThrow).mockReturnValue(value);
}

export function mockDecodeThrow(err?: unknown): void {
	// ensure we throw an Error instance (satisfies `only-throw-error`)
	vi.mocked(decodeUnknownSyncOrThrow).mockImplementation(() => {
		if (err instanceof Error) {
			throw err;
		}

		// stringify safely for non-string errors
		let msg = "";
		if (err === undefined) {
			msg = "mock decode error";
		} else if (typeof err === "string") {
			msg = err;
		} else {
			msg = JSON.stringify(err);
		}

		throw new Error(msg);
	});
}
