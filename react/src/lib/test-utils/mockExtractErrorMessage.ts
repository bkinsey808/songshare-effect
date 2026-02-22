import { vi } from "vitest";

/**
 * Sets up a typed mock for the shared `extractErrorMessage` helper.
 *
 * The returned spy lets callers inspect or override the default behaviour
 * if a test needs more control.  Placing this logic in a helper keeps
 * disabling lint rules out of test files and centralizes the pattern.
 */
// create a reusable spy that can be inspected or overwritten by tests.
const extractSpy = vi.fn((err: unknown, def: string) => `${String(err)}-${def}`);

// establish the mock as soon as this module loads so that any other imports
// (e.g. runAction) see the stubbed implementation.  keeping the `vi.mock`
// call at module top avoids the "hoisted API in runtime location" warning.
vi.mock("@/shared/error-message/extractErrorMessage", () => ({
	__esModule: true,
	default: extractSpy,
}));

/**
 * Sets up a typed mock for the shared `extractErrorMessage` helper.
 *
 * The returned spy lets callers inspect or override the default behaviour
 * if a test needs more control.  Placing this logic in a helper keeps
 * disabling lint rules out of test files and centralizes the pattern.
 */
export function mockExtractErrorMessage(): typeof extractSpy {
	return vi.mocked(extractSpy);
}

// keep default export for consumers that were already using it
export default mockExtractErrorMessage;
