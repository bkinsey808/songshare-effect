import { verify } from "hono/jwt";
import { vi } from "vitest";

/**
 * Mocks `verify` to return success with the given payload.
 * @param payload - The payload to resolve with.
 * @returns void
 */
export function mockHonoJwtVerifySuccess(payload: unknown): void {
	// test-only cast: feed the mocked `verify` the expected resolved payload type
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion -- test-only narrow cast */
	vi.mocked(verify).mockResolvedValue(payload as unknown as Awaited<ReturnType<typeof verify>>);
}

/**
 * Mocks `verify` to reject with the given error.
 * @param err - The raw error to reject with.
 * @returns void
 */
export function mockHonoJwtVerifyFailure(err: unknown): void {
	// normalise rejected value to an Error for callers that expect Error instances
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
	vi.mocked(verify).mockRejectedValue(err instanceof Error ? err : new Error(String(err)));
}
