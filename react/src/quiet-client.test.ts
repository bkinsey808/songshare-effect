import { describe, expect, it, vi } from "vitest";

// helper functions below access and mutate `console` freely.
// we disable the rule on the first helper declaration so the disable
// comment is permitted by `no-disable-in-tests`.
/* oxlint-disable no-console */
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
// These are outside hooks so they are truly captured once at module load.
const actualOriginalConsoleDebug = console.debug;
const actualOriginalConsoleTimeStamp = getConsoleTimeStamp();

// helpers that mirror the old beforeEach/afterEach behavior
async function importQuietClient(): Promise<void> {
	// 1. Restore console to its *true original* state for a clean slate.
	console.debug = actualOriginalConsoleDebug;
	setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
	Reflect.deleteProperty(globalThis, "__origConsoleDebug");

	// 2. Reset module cache to ensure quiet-client.ts is re-imported fresh in each call.
	vi.resetModules();

	// 3. Dynamically import quiet-client.ts. Its side effects will run here.
	await import("./quiet-client");
}

function restoreConsole(): void {
	// mirror afterEach cleanup
	console.debug = actualOriginalConsoleDebug;
	setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
	Reflect.deleteProperty(globalThis, "__origConsoleDebug");
	vi.restoreAllMocks();
}

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
			expect(console.debug).not.toBe(actualOriginalConsoleDebug);
			expect(typeof console.debug).toBe("function"); // It should be the no-op function

			// The key check is that the saved original is correct.
			expect(Reflect.get(globalThis, "__origConsoleDebug")).toBe(actualOriginalConsoleDebug);
		});
	});

	it("silences console.timeStamp when it is originally present", async () => {
		// Make sure console.timeStamp exists *before* the module loads so we can
		// verify quiet-client silences it.

		// replicate importQuietClient but allow us to set the stamp beforehand
		console.debug = actualOriginalConsoleDebug;
		setConsoleTimeStamp(originalTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug");
		vi.resetModules();

		await import("./quiet-client");

		expect(Reflect.get(console, "timeStamp")).not.toBe(originalTimeStamp);
		expect(typeof Reflect.get(console, "timeStamp")).toBe("function");

		// cleanup similar to restoreConsole
		restoreConsole();
	});

	it("handles missing console.timeStamp gracefully", async () => {
		// We mimic the previous self-contained test without hooks.

		// start from clean globals
		console.debug = actualOriginalConsoleDebug;
		setConsoleTimeStamp(actualOriginalConsoleTimeStamp);
		Reflect.deleteProperty(globalThis, "__origConsoleDebug");
		vi.resetModules();

		// temporarily remove timestamp
		const tempOriginalTimeStamp = getConsoleTimeStamp();
		Reflect.deleteProperty(console, "timeStamp");

		await import("./quiet-client");

		// verify console.debug is silenced
		expect(console.debug).not.toBe(actualOriginalConsoleDebug);
		expect(typeof console.debug).toBe("function");
		expect(Reflect.get(globalThis, "__origConsoleDebug")).toBe(actualOriginalConsoleDebug);

		// timestamp should remain missing
		expect(typeof Reflect.get(console, "timeStamp")).not.toBe("function");

		// restore
		setConsoleTimeStamp(tempOriginalTimeStamp);
	});
});
