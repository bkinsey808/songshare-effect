import { describe, expect, it, vi } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import randomId from "./randomId";

describe("randomId", () => {
	it("returns a string", () => {
		const result = randomId();
		expect(typeof result).toBe("string");
	});

	it("returns non-empty string", () => {
		const result = randomId();
		expect(result.length).toBeGreaterThan(ZERO);
	});

	it("returns alphanumeric string from radix 36", () => {
		const result = randomId();
		expect(result).toMatch(/^[a-z0-9]+$/);
	});

	it("returns deterministic result when Math.random and Date are mocked", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
		const FIXED_RANDOM = 0.5;
		vi.spyOn(Math, "random").mockReturnValue(FIXED_RANDOM);
		const first = randomId();
		const second = randomId();
		expect(first).toBe(second);
		vi.useRealTimers();
	});
});
