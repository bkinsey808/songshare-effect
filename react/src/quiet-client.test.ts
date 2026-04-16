import { describe, expect, it, vi } from "vitest";

import {
    deleteConsoleTimeStamp,
    getConsoleDebug,
    getConsoleTimeStamp,
    setConsoleDebug,
    setConsoleTimeStamp,
} from "./quiet-client.test-util";

/**
 * Placeholder original console.timeStamp function used in tests.
 *
 * @returns void
 */
function originalTimeStamp(): void {
	/* placeholder for original console.timeStamp in tests */
}

// Store the *true original* console methods before *any* module is imported, including this test file.
// These are outside hooks so they are truly captured once at module load.
const actualOriginalConsoleDebug = getConsoleDebug();
const actualOriginalConsoleTimeStamp = getConsoleTimeStamp();

// helpers that mirror the old beforeEach/afterEach behavior

/**
 * Import the quiet-client module in a fresh module context to exercise its
 * side-effects for tests.
 *
 * @returns Promise<void> resolved after the module is imported
 */
async function importQuietClient(): Promise<void> {
	// 1. Restore console to its *true original* state for a clean slate.
	setConsoleDebug(actualOriginalConsoleDebug);
	setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
	Reflect.deleteProperty(globalThis, "__origConsoleDebug");

	// 2. Reset module cache to ensure quiet-client.ts is re-imported fresh in each call.
	vi.resetModules();

	// 3. Dynamically import quiet-client.ts. Its side effects will run here.
	await import("./quiet-client");
}

/**
 * Restore the global console methods to their original saved values and
 * restore mocked state used during quiet-client tests.
 *
 * @returns void
 */
function restoreConsole(): void {
	// mirror afterEach cleanup
	setConsoleDebug(actualOriginalConsoleDebug);
	setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
	Reflect.deleteProperty(globalThis, "__origConsoleDebug");
	vi.restoreAllMocks();
}

/**
 * Helper that imports `quiet-client` in a fresh environment, runs `fn`, and
 * then restores console state. Useful to isolate side-effecting module tests.
 *
 * @param fn - function to run while `quiet-client` is active
 * @returns Promise<void>
 */
async function withFreshQuietClient(fn: () => void | Promise<void>): Promise<void> {
	await importQuietClient();
	try {
		await fn();
	} finally {
		restoreConsole();
	}
}

describe("quiet-client", () => {
	it("silences console.debug and saves original", async () => {
		await withFreshQuietClient(() => {
			// At this point, quiet-client.ts has run and modified console.debug.

			// Assertion 1: console.debug should no longer be the actual original debug function.
			expect(getConsoleDebug()).not.toBe(actualOriginalConsoleDebug);
			expect(typeof getConsoleDebug()).toBe("function"); // It should be the no-op function

			// The key check is that the saved original is correct.
			expect(Reflect.get(globalThis, "__origConsoleDebug")).toBe(actualOriginalConsoleDebug);
		});
	});

	it("silences console.timeStamp when it is originally present", async () => {
		// Make sure console.timeStamp exists *before* the module loads so we can
		// verify quiet-client silences it.

		// replicate importQuietClient but allow us to set the stamp beforehand
		setConsoleDebug(actualOriginalConsoleDebug);
		setConsoleTimeStamp(originalTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug");
		vi.resetModules();

		await import("./quiet-client");

		expect(getConsoleTimeStamp()).not.toBe(originalTimeStamp);
		expect(typeof getConsoleTimeStamp()).toBe("function");

		// cleanup similar to restoreConsole
		restoreConsole();
	});

	it("handles missing console.timeStamp gracefully", async () => {
		// We mimic the previous self-contained test without hooks.

		// start from clean globals
		setConsoleDebug(actualOriginalConsoleDebug);
		setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug");
		vi.resetModules();

		// temporarily remove timestamp
		const tempOriginalTimeStamp = getConsoleTimeStamp();
		deleteConsoleTimeStamp();

		await import("./quiet-client");

		// verify console.debug is silenced
		expect(getConsoleDebug()).not.toBe(actualOriginalConsoleDebug);
		expect(typeof getConsoleDebug()).toBe("function");
		expect(Reflect.get(globalThis, "__origConsoleDebug")).toBe(actualOriginalConsoleDebug);

		// timestamp should remain missing
		expect(typeof getConsoleTimeStamp()).not.toBe("function");

		// restore
		setConsoleTimeStamp(tempOriginalTimeStamp);
	});
});
