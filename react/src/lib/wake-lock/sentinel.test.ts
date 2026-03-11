import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import {
	getWakeLockSentinel,
	setWakeLockSentinel,
} from "./sentinel";

describe("sentinel", () => {
	it("returns undefined when not set", () => {
		setWakeLockSentinel(undefined);
		expect(getWakeLockSentinel()).toBeUndefined();
	});

	it("returns set value when sentinel is set", () => {
		const mockSentinel = forceCast<WakeLockSentinel>({ release: async (): Promise<void> => { /* noop */ } });
		setWakeLockSentinel(mockSentinel);
		expect(getWakeLockSentinel()).toBe(mockSentinel);
	});

	it("returns undefined after clearing", () => {
		const mockSentinel = forceCast<WakeLockSentinel>({ release: async (): Promise<void> => { /* noop */ } });
		setWakeLockSentinel(mockSentinel);
		setWakeLockSentinel(undefined);
		expect(getWakeLockSentinel()).toBeUndefined();
	});
});
