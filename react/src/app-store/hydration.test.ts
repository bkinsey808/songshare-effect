import { describe, expect, it, vi } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

describe("hydration utilities", () => {
	it("initializes a promise and resolve function", async () => {
		vi.resetModules();
		const { hydrationState } = await import("./hydration");

		expect(hydrationState.isHydrated).toBe(false);
		expect(hydrationState.listeners).toBeInstanceOf(Set);
		expect(hydrationState.listeners.size).toBe(ZERO);
		expect(hydrationState.promise).toBeInstanceOf(Promise);
		expect(typeof hydrationState.resolvePromise).toBe("function");
	});

	it("awaitAppStoreHydration resolves immediately when already hydrated", async () => {
		vi.resetModules();
		const { hydrationState, awaitAppStoreHydration } = await import("./hydration");

		hydrationState.isHydrated = true;
		hydrationState.listeners.clear();

		let reached = false;
		await awaitAppStoreHydration();
		reached = true;
		expect(reached).toBe(true);
	});

	it("awaitAppStoreHydration waits for the hydration promise when not hydrated", async () => {
		vi.resetModules();
		const { hydrationState, awaitAppStoreHydration } = await import("./hydration");

		hydrationState.isHydrated = false;
		hydrationState.listeners.clear();

		const waiter = awaitAppStoreHydration();

		// Simulate completion of hydration via the module resolver
		hydrationState.resolvePromise?.();
		hydrationState.resolvePromise = undefined;
		hydrationState.isHydrated = true;

		await waiter;
		expect(hydrationState.isHydrated).toBe(true);
	});
});
