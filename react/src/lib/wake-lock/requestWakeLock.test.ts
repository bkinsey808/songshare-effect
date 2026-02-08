import { describe, expect, it, vi } from "vitest";

import requestWakeLock from "./requestWakeLock";
import { getWakeLockSentinel, setWakeLockSentinel } from "./sentinel";

describe("requestWakeLock", () => {
	it("returns false when Wake Lock API unsupported", async () => {
		const navigatorObj = Reflect.get(globalThis, "navigator");
		const originalWakeLock = Reflect.get(navigatorObj, "wakeLock");
		setWakeLockSentinel(undefined);
		Reflect.deleteProperty(navigatorObj, "wakeLock");

		const warn = vi.spyOn(console, "warn");
		const success = await requestWakeLock();
		expect(success).toBe(false);
		expect(warn).toHaveBeenCalledWith("Wake Lock API not supported");

		Reflect.set(navigatorObj, "wakeLock", originalWakeLock);
		vi.restoreAllMocks();
	});

	it("acquires and stores sentinel when supported", async () => {
		const navigatorObj = Reflect.get(globalThis, "navigator");
		const originalWakeLock = Reflect.get(navigatorObj, "wakeLock");
		setWakeLockSentinel(undefined);

		// Create a small, typed sentinel to avoid unsafe type assertions in tests
		const releaseSpy = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
		class DummySentinel extends EventTarget implements WakeLockSentinel {
			type = "screen" as const;
			released = false;
			onrelease: ((this: WakeLockSentinel, ev: Event) => unknown) | null = (() => undefined) as (
				this: WakeLockSentinel,
				ev: Event,
			) => unknown;
			release(): Promise<void> {
				// use `this` to satisfy `class-methods-use-this` lint rule
				this.released = true;
				return releaseSpy();
			}
		}
		const sentinel: WakeLockSentinel = new DummySentinel();
		Reflect.set(navigatorObj, "wakeLock", { request: vi.fn().mockResolvedValue(sentinel) });

		const success = await requestWakeLock();
		expect(success).toBe(true);
		expect(getWakeLockSentinel()).toBe(sentinel);

		Reflect.set(navigatorObj, "wakeLock", originalWakeLock);
		vi.restoreAllMocks();
	});

	it("returns false and logs error on request failure", async () => {
		const navigatorObj = Reflect.get(globalThis, "navigator");
		const originalWakeLock = Reflect.get(navigatorObj, "wakeLock");
		setWakeLockSentinel(undefined);

		Reflect.set(navigatorObj, "wakeLock", {
			request: vi.fn().mockRejectedValue(new Error("boom")),
		});

		const err = vi.spyOn(console, "error");
		const success = await requestWakeLock();
		expect(success).toBe(false);
		expect(err).toHaveBeenCalledWith(
			expect.stringContaining("Failed to request wake lock:"),
			expect.anything(),
		);

		Reflect.set(navigatorObj, "wakeLock", originalWakeLock);
		vi.restoreAllMocks();
	});
});
