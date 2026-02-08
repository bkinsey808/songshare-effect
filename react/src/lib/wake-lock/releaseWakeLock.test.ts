import { describe, expect, it, vi } from "vitest";

import releaseWakeLock from "./releaseWakeLock";
import { getWakeLockSentinel, setWakeLockSentinel } from "./sentinel";

/**
 * Create a minimal `WakeLockSentinel`-like object for tests.
 *
 * This factory returns a small object that satisfies the DOM `WakeLockSentinel`
 * shape (including the `type` and `onrelease` fields) while delegating the
 * `release()` implementation to the provided `releaseImpl` callback so tests
 * can simulate success or failure deterministically.
 *
 * Note: This is a test helper only and intentionally minimal.
 *
 * @param releaseImpl - invoked when `release()` is called
 * @returns a test `WakeLockSentinel`
 */
function createSentinelWithRelease(releaseImpl: () => Promise<void>): WakeLockSentinel {
	class DummySentinel extends EventTarget implements WakeLockSentinel {
		// Match the literal union type expected by the DOM type definitions.
		type = "screen" as const;
		// Track internal state in case a test needs to assert it.
		released = false;
		// Minimal `onrelease` implementation to satisfy the type; unused in tests.
		onrelease: ((this: WakeLockSentinel, ev: Event) => unknown) | null = (() => undefined) as (
			this: WakeLockSentinel,
			ev: Event,
		) => unknown;
		release(): Promise<void> {
			// Use `this` so the method qualifies as an instance method per lint rules.
			this.released = true;
			return releaseImpl();
		}
	}
	return new DummySentinel();
}

describe("releaseWakeLock", () => {
	// No sentinel present: should resolve and be a no-op (no errors, no state change).
	it("does nothing when no sentinel set", async () => {
		setWakeLockSentinel(undefined);
		const err = vi.spyOn(console, "error");
		await expect(releaseWakeLock()).resolves.toBeUndefined();
		expect(getWakeLockSentinel()).toBeUndefined();
		expect(err).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});

	// Successful release: should call `release()`, clear the sentinel, and be idempotent.
	it("calls release and clears sentinel when release succeeds and is idempotent", async () => {
		setWakeLockSentinel(undefined);

		const releaseSpy = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
		const sentinel = createSentinelWithRelease(() => releaseSpy());
		setWakeLockSentinel(sentinel);

		const CALLED_ONCE = 1;
		const err = vi.spyOn(console, "error");
		await expect(releaseWakeLock()).resolves.toBeUndefined();
		expect(releaseSpy).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(err).not.toHaveBeenCalled();

		// Second call is a no-op and should leave state unchanged.
		await expect(releaseWakeLock()).resolves.toBeUndefined();
		expect(getWakeLockSentinel()).toBeUndefined();
		vi.restoreAllMocks();
	});

	// When `release()` throws, the function should catch and log the error,
	// and the sentinel should remain set for callers to inspect.
	it("logs error when release throws and leaves sentinel intact", async () => {
		setWakeLockSentinel(undefined);

		const releaseSpy = vi.fn<() => Promise<void>>().mockRejectedValue(new Error("boom"));
		const sentinel = createSentinelWithRelease(() => releaseSpy());
		setWakeLockSentinel(sentinel);

		const CALLED_ONCE = 1;
		const err = vi.spyOn(console, "error");
		await expect(releaseWakeLock()).resolves.toBeUndefined();
		expect(releaseSpy).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(err).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(getWakeLockSentinel()).toBe(sentinel);
		vi.restoreAllMocks();
	});
});
