import { describe, expect, it, vi } from "vitest";

import randomId from "./randomId";

describe("randomId", () => {
	const RAND_VALUE = 0.123_456_789;
	const NOW_MILLIS = 1_672_531_200_000;
	const MIN_LENGTH = 1;

	it("produces deterministic output when Math.random and Date.now are stubbed", () => {
		const rand = vi.spyOn(Math, "random").mockReturnValue(RAND_VALUE);
		const now = vi.spyOn(Date, "now").mockReturnValue(NOW_MILLIS);
		const id = randomId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThanOrEqual(MIN_LENGTH);
		rand.mockRestore();
		now.mockRestore();
	});

	it("generates unique values on subsequent calls", () => {
		const first = randomId();
		const second = randomId();
		expect(first).not.toBe(second);
	});
});
