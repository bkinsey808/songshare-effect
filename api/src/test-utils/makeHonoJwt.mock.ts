import { verify } from "hono/jwt";
import { vi } from "vitest";

/**
 * Helpers to centralize typed mocks for `hono/jwt` in tests.
 *
 * Keep the small unsafe assertions and ESLint disables inside this helper
 * so individual tests remain lint-clean and don't need inline disables.
 */
export function mockVerifySuccess(payload: unknown): void {
	// test-only cast: feed the mocked `verify` the expected resolved payload type
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion -- test-only narrow cast */
	vi.mocked(verify).mockResolvedValue(payload as unknown as Awaited<ReturnType<typeof verify>>);
}

export function mockVerifyFailure(err: unknown): void {
	// normalise rejected value to an Error for callers that expect Error instances
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
	vi.mocked(verify).mockRejectedValue(err instanceof Error ? err : new Error(String(err)));
}
