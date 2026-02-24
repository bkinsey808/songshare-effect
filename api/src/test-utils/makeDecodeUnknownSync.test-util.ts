import { vi } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

/**
 * Helper for tests that want `decodeUnknownSyncOrThrow` to throw.  The
 * shared implementation keeps the necessary ESLint disables in one place.
 */
export default function mockDecodeThrow(err?: unknown): void {
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
