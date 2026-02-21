import { Effect as EffectRuntime } from "effect";
import { describe, expect, it, vi } from "vitest";

import refreshEvent from "./refreshEvent";

describe("refreshEvent", () => {
	it("does nothing when slug is undefined", async () => {
		vi.resetAllMocks();
		const fetchEventBySlug = vi.fn();
		let sideEffect = false;

		// even if fetch is called, the effect should not run
		fetchEventBySlug.mockReturnValue(
			EffectRuntime.sync(() => {
				sideEffect = true;
			}),
		);

		await refreshEvent(undefined, fetchEventBySlug);

		expect(fetchEventBySlug).not.toHaveBeenCalled();
		expect(sideEffect).toBe(false);
	});

	it("does nothing when slug is an empty string", async () => {
		vi.resetAllMocks();
		const fetchEventBySlug = vi.fn();
		let sideEffect = false;

		fetchEventBySlug.mockReturnValue(
			EffectRuntime.sync(() => {
				sideEffect = true;
			}),
		);

		await refreshEvent("", fetchEventBySlug);

		expect(fetchEventBySlug).not.toHaveBeenCalled();
		expect(sideEffect).toBe(false);
	});

	it("invokes the provided effect when a non‑empty slug is given", async () => {
		vi.resetAllMocks();
		let sideEffect = false;
		const fetchEventBySlug = vi.fn().mockImplementation((_slug: string) =>
			EffectRuntime.sync(() => {
				sideEffect = true;
			}),
		);

		await refreshEvent("event-123", fetchEventBySlug);

		expect(fetchEventBySlug).toHaveBeenCalledWith("event-123");
		expect(sideEffect).toBe(true);
	});

	it("propagates errors from the runtime", async () => {
		vi.resetAllMocks();
		const err = new Error("failure");
		const fetchEventBySlug = vi.fn().mockReturnValue(EffectRuntime.fail(err));

		// the runtime wraps the original error in a fiber failure, so just
		// assert on the message text rather than the exact object.
		await expect(refreshEvent("slug", fetchEventBySlug)).rejects.toThrow("failure");
	});
});
