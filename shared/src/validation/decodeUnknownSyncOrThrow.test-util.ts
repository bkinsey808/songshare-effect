import { vi } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

/**
 * Centralize mock for `decodeUnknownSyncOrThrow` return value so tests don't
 * need to include inline `oxlint-disable` comments for unsafe assignments.
 */
export default function mockDecodeUnknownSyncOrThrow(value: unknown): void {
	// test-only cast: convert `unknown` into the function's return type
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test-only narrow cast */
	vi.mocked(decodeUnknownSyncOrThrow).mockReturnValue(value);
}
