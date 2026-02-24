import { beforeAll, vi } from "vitest";

// suppress noisy console output during unit tests. individual tests can
// re-enable a method with `vi.restoreAllMocks()` if they need to inspect logs.
beforeAll(() => {
	// oxlint-disable-next-line no-empty-function
	vi.spyOn(console, "log").mockImplementation(() => {});
	// oxlint-disable-next-line no-empty-function
	vi.spyOn(console, "warn").mockImplementation(() => {});
	// oxlint-disable-next-line no-empty-function
	vi.spyOn(console, "error").mockImplementation(() => {});
});
