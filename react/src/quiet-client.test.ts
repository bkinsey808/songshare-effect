/* oxlint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Helpers to safely access optional console/global properties without unsafe narrowing
function getConsoleTimeStamp(): unknown {
	return Reflect.get(console, "timeStamp");
}
function setConsoleTimeStamp(value: unknown): void {
	Reflect.set(console, "timeStamp", value);
}

function originalTimeStamp(): void {
	/* placeholder for original console.timeStamp in tests */
}

// Store the *true original* console methods before *any* module is imported, including this test file.
// These are outside beforeEach so they are truly captured once at module load.
const actualOriginalConsoleDebug = console.debug;
const actualOriginalConsoleTimeStamp = getConsoleTimeStamp();

describe("quiet-client", () => {
	// eslint-disable-next-line jest/no-hooks
	beforeEach(async () => {
		// 1. Restore console to its *true original* state for a clean slate.
		console.debug = actualOriginalConsoleDebug;
		setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug"); // Ensure no stale saved original

		// 2. Reset module cache to ensure quiet-client.ts is re-imported fresh in each test.
		vi.resetModules();

		// 3. Dynamically import quiet-client.ts. Its side effects will run here.
		await import("./quiet-client");
	});

	// eslint-disable-next-line jest/no-hooks
	afterEach(() => {
		// 1. Restore console to its *true original* state after each test.
		console.debug = actualOriginalConsoleDebug;
		setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug");

		// 2. Clear Vitest mocks.
		vi.restoreAllMocks();
	});

	it("silences console.debug and saves original", () => {
		// At this point, quiet-client.ts has run and modified console.debug.

		// Assertion 1: console.debug should no longer be the actual original debug function.
		expect(console.debug).not.toBe(actualOriginalConsoleDebug);
		expect(typeof console.debug).toBe("function"); // It should be the no-op function

		// The key check is that the saved original is correct.
		expect(Reflect.get(globalThis, "__origConsoleDebug")).toBe(actualOriginalConsoleDebug);
	});

	it("silences console.timeStamp when it is originally present", async () => {
		// Make sure console.timeStamp exists *before* the module loads so we can
		// verify quiet-client silences it.
		vi.resetModules();
		setConsoleTimeStamp(originalTimeStamp);

		await import("./quiet-client");

		expect(Reflect.get(console, "timeStamp")).not.toBe(originalTimeStamp);
		expect(typeof Reflect.get(console, "timeStamp")).toBe("function");
	});

	it("handles missing console.timeStamp gracefully", async () => {
		// For this test, we need console.timeStamp to be missing *before* quiet-client.ts loads.
		// So we need to do this in a self-contained test after resetting modules.

		// 1. Restore console to its *true original* state at the start of this specific test.
		// (This is done by afterEach/beforeEach, but we need to manipulate specifically for this test)
		console.debug = actualOriginalConsoleDebug;
		setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug");
		vi.resetModules();

		// 2. Temporarily remove console.timeStamp for this test
		const tempOriginalTimeStamp = getConsoleTimeStamp();
		Reflect.deleteProperty(console, "timeStamp");

		// 3. Import quiet-client.ts. Its side effects will run on this console.
		await import("./quiet-client");

		// 4. Verify console.debug is silenced (as in other tests).
		expect(console.debug).not.toBe(actualOriginalConsoleDebug);
		expect(typeof console.debug).toBe("function");
		expect(Reflect.get(globalThis, "__origConsoleDebug")).toBe(actualOriginalConsoleDebug);

		// 5. Verify console.timeStamp is still absent or gracefully handled.
		// quiet-client.ts's logic: if `maybeTimeStamp` (Reflect.get(console, "timeStamp"))
		// is not a function, it won't replace it. So if we deleted it, it should stay deleted.
		expect(typeof Reflect.get(console, "timeStamp")).not.toBe("function"); // Should be undefined or not a function

		// 6. Restore global console.timeStamp after this test.
		setConsoleTimeStamp(tempOriginalTimeStamp);
	});
});
